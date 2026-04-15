// 파일 경로: src/app/pages/ProfileEditPage.tsx
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Camera, MapPin, CheckCircle2, ShieldCheck, ChevronDown, Loader2, Home, BadgeCheck } from 'lucide-react';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useUserLocation } from '../../contexts/UserLocationContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { displayNameFromUser } from '../../lib/ensurePublicProfile';
import {
  DAENG_AVATAR_THEME_PREFIX,
  PROFILE_THEME_AVATARS,
  encodeProfileAvatarTheme,
  parseProfileAvatarUrl,
} from '../../lib/profileAvatar';
import { virtualDogPhotoForSeed } from '../data/virtualDogPhotos';
import {
  readCareProviderTrack,
  writeCareProviderTrack,
  type CareProviderTrack,
} from '../../lib/careProviderTrack';
import { formatKoreanMobileDigits } from '../../lib/phoneAuth';
import { imageContentTypeForDogPhotosUpload, safeImageExtForDogPhotos } from '../../lib/storageImageMime';

function phoneDigitsOk(digits: string): boolean {
  if (digits.length === 0) return true;
  return digits.length >= 10 && digits.length <= 11;
}

type AvatarDraft = 'theme' | 'custom';

const PROFILE_AVATAR_FILE_ID = 'daeng-profile-avatar-file';

export function ProfileEditPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { fullLabel, location: userLoc, locationBasedEnabled } = useUserLocation();
  const [profileMode, setProfileMode] = useState<'general' | 'repairer'>('general');
  const [careTrack, setCareTrack] = useState<CareProviderTrack>(() => readCareProviderTrack());
  const [locationOpen, setLocationOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saveBusy, setSaveBusy] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<AvatarDraft>('theme');
  const [committedAvatarUrl, setCommittedAvatarUrl] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const pendingFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nickname: '',
    phone: '',
    avatarTheme: 'default',
    specialty: '산책 · 방문 돌봄', // 돌봄회원 탭 (로컬만)
  });

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const careQuery = searchParams.get('care');
  /** 링크로 들어온 경우: ?care=sitter → 댕집사만 + 돌봄 탭 */
  useEffect(() => {
    if (careQuery !== 'sitter') return;
    writeCareProviderTrack('sitter_only');
    setCareTrack('sitter_only');
    setProfileMode('repairer');
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.delete('care');
        return p;
      },
      { replace: true },
    );
  }, [careQuery, setSearchParams]);

  const pickCareTrack = (v: CareProviderTrack) => {
    setCareTrack(v);
    writeCareProviderTrack(v);
  };

  const loadProfile = useCallback(async () => {
    if (!user) {
      setFormData((prev) => ({
        ...prev,
        nickname: '',
        phone: '',
        avatarTheme: 'default',
      }));
      setCommittedAvatarUrl(null);
      setAvatarDraft('theme');
      setLocalPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      pendingFileRef.current = null;
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('name, phone, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    if (error) {
      console.warn('[프로필 수정] profiles 조회:', error.message);
    }
    const nameFromProfile = data?.name?.trim();
    const phoneFromProfile = data?.phone?.trim() ?? '';
    const rawAv = data?.avatar_url?.trim() ?? null;
    setCommittedAvatarUrl(rawAv);
    const parsed = parseProfileAvatarUrl(rawAv);
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    pendingFileRef.current = null;
    if (parsed.kind === 'image') {
      setAvatarDraft('custom');
      setFormData((prev) => ({
        ...prev,
        nickname: (nameFromProfile || displayNameFromUser(user)).slice(0, 10),
        phone: phoneFromProfile ? formatKoreanMobileDigits(phoneFromProfile) : '',
        avatarTheme: 'default',
      }));
    } else {
      setAvatarDraft('theme');
      setFormData((prev) => ({
        ...prev,
        nickname: (nameFromProfile || displayNameFromUser(user)).slice(0, 10),
        phone: phoneFromProfile ? formatKoreanMobileDigits(phoneFromProfile) : '',
        avatarTheme: parsed.themeId,
      }));
    }
    setProfileLoading(false);
  }, [user]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const locationVerified = userLoc.source === 'gps' || userLoc.source === 'map';
  const hasRegion = Boolean(userLoc.city && userLoc.district);
  const phoneDigits = formData.phone.replace(/\D/g, '');
  const phoneOk = phoneDigitsOk(phoneDigits);

  // 프로필 완성도 (동네는 UserLocation과 동일 — 별도 시·구 폼 없음)
  const completionRate =
    formData.nickname && phoneOk && phoneDigits.length > 0 && hasRegion
      ? locationVerified
        ? 100
        : 80
      : formData.nickname && phoneOk && phoneDigits.length > 0
        ? 60
        : formData.nickname
          ? 45
          : 35;

  const handleSave = async () => {
    if (!user) {
      alert('로그인 후 저장할 수 있어요.');
      navigate('/login');
      return;
    }
    if (!formData.nickname.trim()) {
      alert('닉네임을 입력해 주세요.');
      return;
    }
    if (!phoneOk) {
      alert('전화번호는 10~11자리 숫자로 입력해 주세요. (예: 010-1234-5678)');
      return;
    }
    if (phoneDigits.length === 0) {
      alert('연락을 위해 전화번호를 입력해 주세요.');
      return;
    }

    setSaveBusy(true);
    try {
      const phoneOut = formatKoreanMobileDigits(phoneDigits);
      let avatar_url: string | null = null;
      const pending = pendingFileRef.current;
      if (pending) {
        if (pending.size > 5 * 1024 * 1024) {
          alert('사진은 5MB 이하로 올려 주세요.');
          return;
        }
        const safeExt = safeImageExtForDogPhotos(pending);
        const path = `user-avatars/${user.id}/${Date.now()}.${safeExt}`;
        const { error: upErr } = await supabase.storage.from('dog-photos').upload(path, pending, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageContentTypeForDogPhotosUpload(pending, safeExt),
        });
        if (upErr) {
          alert(upErr.message || '프로필 사진 업로드에 실패했습니다. Storage 정책(dog-photos)을 확인해 주세요.');
          return;
        }
        const { data: pub } = supabase.storage.from('dog-photos').getPublicUrl(path);
        avatar_url = pub.publicUrl;
      } else if (avatarDraft === 'theme') {
        avatar_url = encodeProfileAvatarTheme(formData.avatarTheme);
      } else {
        avatar_url = committedAvatarUrl;
      }

      const nick = formData.nickname.trim().slice(0, 10);
      const { error } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          name: nick,
          phone: phoneOut,
          avatar_url,
        },
        { onConflict: 'id' },
      );
      if (error) {
        alert(error.message || '저장에 실패했습니다.');
        return;
      }
      /** 목록·마이는 profiles 우선이나, 조회 실패·지연 시에도 카카오 메타 닉네임이 옛값으로 남지 않도록 동기화 */
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { nickname: nick, name: nick, full_name: nick },
      });
      if (metaErr) {
        console.warn('[프로필 수정] auth.user_metadata 동기화:', metaErr.message);
      }
      pendingFileRef.current = null;
      setLocalPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setCommittedAvatarUrl(avatar_url);
      if (avatar_url?.startsWith(DAENG_AVATAR_THEME_PREFIX)) {
        setAvatarDraft('theme');
      } else if (avatar_url && /^https?:\/\//i.test(avatar_url)) {
        setAvatarDraft('custom');
      } else {
        setAvatarDraft('theme');
      }
      alert('프로필이 저장되었습니다! 💾');
      navigate('/my');
    } finally {
      setSaveBusy(false);
    }
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const imageOk =
      file.type.startsWith('image/') || /\.(heic|heif|jpg|jpeg|png|webp|gif)$/i.test(file.name);
    if (!imageOk) {
      alert('이미지 파일만 선택할 수 있어요.');
      return;
    }
    pendingFileRef.current = file;
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setAvatarDraft('custom');
  };

  const selectThemeAvatar = (themeId: string) => {
    pendingFileRef.current = null;
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setAvatarDraft('theme');
    setFormData((prev) => ({ ...prev, avatarTheme: themeId }));
  };

  const avatarMain = useMemo(() => {
    if (avatarDraft === 'theme') {
      const th = PROFILE_THEME_AVATARS.find((t) => t.id === formData.avatarTheme) ?? PROFILE_THEME_AVATARS[0];
      return { kind: 'emoji' as const, ...th };
    }
    const parsed = parseProfileAvatarUrl(committedAvatarUrl);
    const src = localPreviewUrl ?? (parsed.kind === 'image' ? parsed.url : '');
    if (src) return { kind: 'image' as const, src };
    const th = PROFILE_THEME_AVATARS.find((t) => t.id === formData.avatarTheme) ?? PROFILE_THEME_AVATARS[0];
    return { kind: 'emoji' as const, ...th };
  }, [avatarDraft, formData.avatarTheme, localPreviewUrl, committedAvatarUrl]);

  return (
    <div className="min-h-screen bg-slate-50">
      <LocationPickerModal open={locationOpen} onClose={() => setLocationOpen(false)} />
      <header className="sticky top-0 z-50 bg-market-header shadow-market-lg">
        <div className="mx-auto flex h-14 max-w-screen-md items-center justify-between px-4">
          <button
            type="button"
            onClick={() => navigate('/my')}
            className="-ml-2 rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
            aria-label="뒤로"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-extrabold text-white">프로필 수정</h1>
          <div className="w-8" aria-hidden />
        </div>
      </header>

      <div className="max-w-screen-md mx-auto p-4 space-y-4">
        {authLoading || profileLoading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" aria-label="불러오는 중" />
          </div>
        ) : (
          <>
        {!user ? (
          <div className="rounded-2xl border border-brand/25 bg-brand-soft px-4 py-3 text-sm font-medium text-slate-800">
            로그인하면 닉네임·전화번호를 저장할 수 있어요.
          </div>
        ) : null}

        {/* 일반회원 / 돌봄회원 탭 */}
        <div className="bg-slate-100 p-1 rounded-2xl flex relative mb-6">
          <button
            type="button"
            onClick={() => setProfileMode('general')}
            className={`z-10 flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${profileMode === 'general' ? 'text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            일반회원
          </button>
          <button 
            type="button"
            onClick={() => setProfileMode('repairer')}
            className={`z-10 flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${profileMode === 'repairer' ? 'text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            돌봄회원
          </button>
          {/* 토글 애니메이션 배경 */}
          <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl transition-transform duration-300 shadow-sm ${profileMode === 'repairer' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`} />
        </div>

        {/* 프로필 완성도 게이지 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-end mb-3">
            <div>
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                내 프로필 신뢰도 {completionRate === 100 && <ShieldCheck className="h-4 w-4 text-brand" aria-hidden />}
              </span>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {completionRate === 100
                  ? '완벽해요! 이웃들이 신뢰할 수 있어요.'
                  : hasRegion
                    ? '아래에서 지도·GPS로 위치를 맞추면 신뢰도가 올라가요.'
                    : '동네·위치를 맞추면 신뢰도가 올라가요.'}
              </p>
            </div>
            <span className="text-xl font-black text-brand">{completionRate}%</span>
          </div>
          <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${completionRate === 100 ? 'bg-gradient-to-r from-brand to-brand-bright' : 'bg-gradient-to-r from-brand-bright to-amber-300'}`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* 프로필 사진 & 테마 선택 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-extrabold text-slate-800 mb-4">프로필 이미지</h3>
          <input
            id={PROFILE_AVATAR_FILE_ID}
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleAvatarFile}
          />
          <div className="flex flex-col items-center">
            <label
              htmlFor={PROFILE_AVATAR_FILE_ID}
              className="relative mb-5 group cursor-pointer"
            >
              <span className="sr-only">프로필 사진 올리기</span>
              {avatarMain.kind === 'image' ? (
                <div className="relative h-24 w-24 overflow-hidden rounded-3xl border-4 border-orange-200 shadow-inner">
                  <ImageWithFallback
                    src={avatarMain.src}
                    fallbackSrc={virtualDogPhotoForSeed(`profile-edit-${user?.id ?? 'anon'}`)}
                    alt="프로필 사진"
                    className="h-full w-full object-cover pointer-events-none"
                  />
                </div>
              ) : (
                <div
                  className={`flex h-24 w-24 items-center justify-center rounded-3xl border-4 text-4xl shadow-inner transition-colors ${avatarMain.bg} ${avatarMain.border}`}
                >
                  {avatarMain.emoji}
                </div>
              )}
              <div className="pointer-events-none absolute -bottom-2 -right-2 rounded-full border-2 border-white bg-slate-800 p-2 text-white shadow-lg transition-transform group-hover:scale-110">
                <Camera className="h-4 w-4" aria-hidden />
              </div>
            </label>

            <div className="flex gap-3 justify-center rounded-2xl bg-slate-50 p-2.5">
              {PROFILE_THEME_AVATARS.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => selectThemeAvatar(theme.id)}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl transition-all ${theme.bg} ${
                    avatarDraft === 'theme' && formData.avatarTheme === theme.id
                      ? 'scale-110 ring-2 ring-brand ring-offset-2'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  aria-label={`캐릭터 ${theme.id}`}
                >
                  {theme.emoji}
                </button>
              ))}
            </div>
            <p className="mt-3 px-2 text-center text-[11px] font-bold text-slate-400">
              사진을 올리거나, 댕댕이 캐릭터(품종 느낌)를 골라보세요. 저장 후 내댕댕에 반영돼요.
            </p>
          </div>
        </div>

        {/* 닉네임 수정 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <label className="flex justify-between text-sm font-extrabold text-slate-800 mb-2">
            닉네임
            <span className="text-xs text-slate-400 font-medium">{formData.nickname.length}/10자</span>
          </label>
          <input
            type="text"
            value={formData.nickname}
            maxLength={10}
            onChange={(e) => setFormData({...formData, nickname: e.target.value})}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-bold text-slate-800 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
          />
        </div>

        {/* 동네·위치 — 마이페이지와 같은 저장소(LocationPickerModal), 시·구 드롭다운 이중 노출 없음 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-extrabold text-slate-800">동네·위치</label>
            {locationVerified ? (
              <span className="flex items-center gap-1 rounded-lg border border-brand/20 bg-brand/10 px-2 py-1 text-[11px] font-extrabold text-brand">
                <CheckCircle2 className="w-3.5 h-3.5" /> 위치 맞춤
              </span>
            ) : (
              <span className="text-[11px] font-bold text-slate-400">지도·GPS는 아래에서</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mb-3">
            내댕댕과 같아요. 위치 기반을 켜면 우리 동네·내 주변 글, 끄면 전국이에요.
          </p>
          <button
            type="button"
            title={fullLabel}
            onClick={() => setLocationOpen(true)}
            className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-left transition-colors hover:bg-slate-100"
          >
            <MapPin className={`h-5 w-5 shrink-0 ${locationBasedEnabled ? 'text-brand' : 'text-slate-400'}`} />
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">{fullLabel}</span>
            <ChevronDown className="w-5 h-5 shrink-0 text-slate-400" />
          </button>
        </div>

        {/* 전화번호 — 카카오 등 OAuth는 전화를 넘기지 않는 경우가 많아 profiles.phone 에 직접 저장 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <label className="block text-sm font-extrabold text-slate-800 mb-2">전화번호</label>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="010-0000-0000"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: formatKoreanMobileDigits(e.target.value) })
            }
            disabled={!user}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-bold text-slate-800 transition-all placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:opacity-60"
          />
          <p className="mt-2 text-[11px] font-medium leading-relaxed text-slate-500">
            카카오 로그인만으로는 전화번호가 넘어오지 않을 수 있어요. 연락 가능한 번호를 직접 입력한 뒤 저장해 주세요.
          </p>
        </div>

        {/* 돌봄회원: 목표 선택 + 맡김 돌봄 안내 */}
        {profileMode === 'repairer' && (
          <div className="animate-fadeIn space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-center text-xs font-extrabold text-slate-800">돌봄 목표를 골라 주세요</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => pickCareTrack('sitter_only')}
                  className={`rounded-2xl border-2 px-3 py-3 text-left transition-all active:scale-[0.99] ${
                    careTrack === 'sitter_only'
                      ? 'border-orange-400 bg-orange-50 shadow-sm'
                      : 'border-slate-100 bg-slate-50/80 hover:border-orange-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                    <Home className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
                    댕집사(방문)까지
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold leading-snug text-slate-600">
                    이웃 집 방문 돌봄·산책
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => pickCareTrack('guard_mom')}
                  className={`rounded-2xl border-2 px-3 py-3 text-left transition-all active:scale-[0.99] ${
                    careTrack === 'guard_mom'
                      ? 'border-violet-400 bg-violet-50 shadow-sm'
                      : 'border-slate-100 bg-slate-50/80 hover:border-violet-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                    <BadgeCheck className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
                    인증 보호맘
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold leading-snug text-slate-600">
                    교육·인증 후 맡기기
                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => pickCareTrack('unset')}
                className="mt-2 w-full py-1.5 text-[10px] font-bold text-slate-400 underline-offset-2 hover:text-slate-600"
              >
                아직 안 정했어요
              </button>
              {careTrack === 'guard_mom' && (
                <Link
                  to="/guard-mom/register"
                  className="mt-3 flex min-h-11 items-center justify-center rounded-2xl bg-violet-600 px-4 py-2.5 text-center text-xs font-extrabold text-white shadow-md active:scale-[0.99]"
                >
                  보호맘 프로필 등록·이어하기
                </Link>
              )}
              {careTrack === 'sitter_only' && (
                <p className="mt-3 text-center text-[10px] font-semibold leading-snug text-slate-500">
                  인증·목록은 정책에 따라 달라질 수 있어요. 예시는 인증 돌봄 탭의 댕집사에서 볼 수 있어요.
                </p>
              )}
            </div>

            <div className="rounded-3xl border-2 border-brand/20 bg-brand-soft p-5">
              <h3 className="mb-2 text-sm font-extrabold text-slate-900">🐕 도와드릴 수 있는 돌봄</h3>
              <p className="mb-3 text-xs font-medium leading-relaxed text-slate-700">
                모임 글과는 달리, <strong className="font-bold text-slate-900">주인 집에 찾아가 방문 돌봄·산책</strong>을 도와주시는
                활동이에요. 제공 가능한 일정·서비스를 적어 주세요.
              </p>
              <input
                type="text"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="예: 주간 방문 산책·배식, 당일 방문 돌봄"
                className="w-full rounded-2xl border border-brand/25 bg-white px-4 py-3.5 font-bold text-slate-800 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
              />
            </div>
          </div>
        )}

          </>
        )}
      </div>

      {/* 하단 고정 저장 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50 pb-safe max-w-[430px] mx-auto">
        <div className="max-w-screen-md mx-auto">
          <button 
            type="button"
            onClick={() => void handleSave()}
            disabled={saveBusy || authLoading || profileLoading}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-market-cta text-lg font-bold text-white shadow-market transition-all hover:opacity-[0.92] active:scale-[0.98] disabled:opacity-50"
          >
            {saveBusy ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : null}
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}