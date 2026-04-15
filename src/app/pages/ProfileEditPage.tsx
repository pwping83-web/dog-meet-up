// src/app/pages/ProfileEditPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  Loader2,
  Bell,
} from 'lucide-react';
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
import { formatKoreanMobileDigits } from '../../lib/phoneAuth';

function phoneDigitsOk(digits: string): boolean {
  if (digits.length === 0) return true;
  return digits.length >= 10 && digits.length <= 11;
}

type AvatarDraft = 'theme' | 'custom';

type ProfileModeFace = {
  nickname: string;
  avatarTheme: string;
  avatarDraft: AvatarDraft;
  committedAvatarUrl: string | null;
  localPreviewUrl: string | null;
};

type DogProfileDraft = {
  id: string | null;
  name: string;
  breed: string;
  age: string;
  gender: '남아' | '여아';
  photoUrl: string | null;
};

function emptyFace(): ProfileModeFace {
  return {
    nickname: '',
    avatarTheme: 'default',
    avatarDraft: 'theme',
    committedAvatarUrl: null,
    localPreviewUrl: null,
  };
}

function faceFromProfileRow(
  name: string | null | undefined,
  rawAv: string | null | undefined,
  fallbackNick: string,
): ProfileModeFace {
  const nick = (name?.trim() || fallbackNick).slice(0, 10);
  const raw = rawAv?.trim() ?? null;
  const parsed = parseProfileAvatarUrl(raw);
  if (parsed.kind === 'image') {
    return {
      nickname: nick,
      avatarTheme: 'default',
      avatarDraft: 'custom',
      committedAvatarUrl: raw,
      localPreviewUrl: null,
    };
  }
  return {
    nickname: nick,
    avatarTheme: parsed.themeId,
    avatarDraft: 'theme',
    committedAvatarUrl: raw,
    localPreviewUrl: null,
  };
}

export function ProfileEditPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { fullLabel, location: userLoc, locationBasedEnabled } = useUserLocation();
  const [locationOpen, setLocationOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saveBusy, setSaveBusy] = useState(false);
  const [dogPhotoBusy, setDogPhotoBusy] = useState(false);
  const [phone, setPhone] = useState('');
  const [general, setGeneral] = useState<ProfileModeFace>(() => emptyFace());
  const [dogDraft, setDogDraft] = useState<DogProfileDraft>({
    id: null,
    name: '',
    breed: '',
    age: '',
    gender: '남아',
    photoUrl: null,
  });

  const loadProfile = useCallback(async () => {
    if (!user) {
      setGeneral(emptyFace());
      setPhone('');
      setDogDraft({
        id: null,
        name: '',
        breed: '',
        age: '',
        gender: '남아',
        photoUrl: null,
      });
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
    const fallback = displayNameFromUser(user);
    const phoneFromProfile = data?.phone?.trim() ?? '';
    setPhone(phoneFromProfile ? formatKoreanMobileDigits(phoneFromProfile) : '');

    const g = faceFromProfileRow(data?.name, data?.avatar_url, fallback);
    setGeneral(g);

    const { data: dogRows, error: dogErr } = await supabase
      .from('dog_profiles')
      .select('id,name,breed,age,gender,photo_url')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (dogErr) {
      console.warn('[프로필 수정] dog_profiles 조회:', dogErr.message);
      setDogDraft({
        id: null,
        name: '',
        breed: '',
        age: '',
        gender: '남아',
        photoUrl: null,
      });
    } else {
      const row = dogRows?.[0];
      setDogDraft({
        id: row?.id ?? null,
        name: typeof row?.name === 'string' ? row.name : '',
        breed: typeof row?.breed === 'string' ? row.breed : '',
        age: typeof row?.age === 'number' && Number.isFinite(row.age) ? String(row.age) : '',
        gender: row?.gender === '여아' ? '여아' : '남아',
        photoUrl: typeof row?.photo_url === 'string' ? row.photo_url : null,
      });
    }
    setProfileLoading(false);
  }, [user]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const activeFace = general;
  const setActiveFace = setGeneral;

  const locationVerified = userLoc.source === 'gps' || userLoc.source === 'map';
  const hasRegion = Boolean(userLoc.city && userLoc.district);
  const phoneDigits = phone.replace(/\D/g, '');
  const phoneOk = phoneDigitsOk(phoneDigits);

  const completionRate =
    activeFace.nickname && phoneOk && phoneDigits.length > 0 && hasRegion
      ? locationVerified
        ? 100
        : 80
      : activeFace.nickname && phoneOk && phoneDigits.length > 0
        ? 60
        : activeFace.nickname
          ? 45
          : 35;

  const buildAvatarUrlForSave = async (face: ProfileModeFace): Promise<string | null> => {
    if (face.avatarDraft === 'theme') {
      return encodeProfileAvatarTheme(face.avatarTheme);
    }
    return face.committedAvatarUrl;
  };

  const handleSave = async () => {
    if (!user) {
      alert('로그인 후 저장할 수 있어요.');
      navigate('/login');
      return;
    }
    const nick = activeFace.nickname.trim();
    if (!nick) {
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
      let avatar_url: string | null;
      try {
        avatar_url = await buildAvatarUrlForSave(activeFace);
      } catch (e) {
        const msg = (e as Error).message;
        alert(msg);
        return;
      }

      const nickOut = nick.slice(0, 10);

      const { data: updated, error } = await supabase
        .from('profiles')
        .update({
          name: nickOut,
          avatar_url: avatar_url,
          phone: phoneOut,
        })
        .eq('id', user.id)
        .select('id');
      if (error) {
        alert(error.message || '저장에 실패했습니다.');
        return;
      }
      if (!updated?.length) {
        const { error: insErr } = await supabase.from('profiles').upsert(
          {
            id: user.id,
            name: nickOut,
            avatar_url: avatar_url,
            phone: phoneOut,
          },
          { onConflict: 'id' },
        );
        if (insErr) {
          alert(insErr.message || '저장에 실패했습니다.');
          return;
        }
      }
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { nickname: nickOut, name: nickOut, full_name: nickOut },
      });
      if (metaErr) {
        console.warn('[프로필 수정] auth.user_metadata 동기화:', metaErr.message);
      }

      const dogName = dogDraft.name.trim();
      const dogBreed = dogDraft.breed.trim();
      const dogAgeStr = dogDraft.age.trim();
      const hasAnyDogField = Boolean(dogName || dogBreed || dogAgeStr || dogDraft.photoUrl || dogDraft.id);
      if (hasAnyDogField) {
        if (!dogName) {
          alert('강아지 이름을 입력해 주세요.');
          return;
        }
        const dogAgeNum = dogAgeStr ? Number.parseInt(dogAgeStr, 10) : null;
        if (dogAgeStr && (!Number.isFinite(dogAgeNum as number) || (dogAgeNum as number) <= 0 || (dogAgeNum as number) > 35)) {
          alert('강아지 나이는 1~35 사이 숫자로 입력해 주세요.');
          return;
        }
        const payload = {
          owner_id: user.id,
          name: dogName.slice(0, 20),
          breed: dogBreed ? dogBreed.slice(0, 30) : null,
          age: dogAgeNum,
          gender: dogDraft.gender,
          photo_url: dogDraft.photoUrl ?? null,
          city: userLoc.city?.trim() || null,
          district: userLoc.district?.trim() || null,
        };
        const dogError = dogDraft.id
          ? (
              await supabase
                .from('dog_profiles')
                .update(payload)
                .eq('id', dogDraft.id)
            ).error
          : (
              await supabase
                .from('dog_profiles')
                .insert([payload])
            ).error;
        if (dogError) {
          alert(dogError.message || '강아지 정보를 저장하지 못했어요.');
          return;
        }
      }

      setGeneral((prev) => {
        const parsed = parseProfileAvatarUrl(avatar_url);
        const nextDraft: AvatarDraft =
          avatar_url?.startsWith(DAENG_AVATAR_THEME_PREFIX)
            ? 'theme'
            : avatar_url && /^https?:\/\//i.test(avatar_url)
              ? 'custom'
              : 'theme';
        return {
          ...prev,
          nickname: nickOut,
          committedAvatarUrl: avatar_url,
          localPreviewUrl: null,
          avatarDraft: nextDraft,
          avatarTheme: parsed.kind === 'theme' ? parsed.themeId : prev.avatarTheme,
        };
      });

      alert('프로필이 저장되었어요! 💾');
      navigate('/my');
    } finally {
      setSaveBusy(false);
    }
  };

  const applyLatestDogPhoto = useCallback(async () => {
    if (!user?.id) {
      alert('로그인 후 사용할 수 있어요.');
      return;
    }
    setDogPhotoBusy(true);
    try {
      const { data, error } = await supabase
        .from('dog_profiles')
        .select('id,name,breed,age,gender,photo_url')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) {
        alert(error.message || '강아지 사진을 불러오지 못했어요.');
        return;
      }
      const photo = (data?.[0]?.photo_url ?? '').trim();
      if (!photo || !/^https?:\/\//i.test(photo)) {
        alert('등록된 강아지 사진이 없어요. 먼저 우리 댕댕이 등록에서 사진을 올려 주세요.');
        return;
      }
      setActiveFace((prev) => ({
        ...prev,
        avatarDraft: 'custom',
        committedAvatarUrl: photo,
        localPreviewUrl: null,
      }));
      setDogDraft((prev) => ({
        ...prev,
        photoUrl: photo,
        id: data?.[0]?.id ?? prev.id,
        name: (data?.[0]?.name as string | undefined) ?? prev.name,
        breed: (data?.[0]?.breed as string | undefined) ?? prev.breed,
        age:
          typeof data?.[0]?.age === 'number' && Number.isFinite(data?.[0]?.age)
            ? String(data?.[0]?.age)
            : prev.age,
        gender: data?.[0]?.gender === '여아' ? '여아' : prev.gender,
      }));
    } finally {
      setDogPhotoBusy(false);
    }
  }, [setActiveFace, user?.id]);

  const selectThemeAvatar = (themeId: string) => {
    setActiveFace((prev) => {
      return {
        ...prev,
        localPreviewUrl: null,
        avatarDraft: 'theme',
        avatarTheme: themeId,
      };
    });
  };

  const avatarMain = useMemo(() => {
    if (activeFace.avatarDraft === 'theme') {
      const th =
        PROFILE_THEME_AVATARS.find((t) => t.id === activeFace.avatarTheme) ?? PROFILE_THEME_AVATARS[0];
      return { kind: 'emoji' as const, ...th };
    }
    const parsed = parseProfileAvatarUrl(activeFace.committedAvatarUrl);
    const src = activeFace.localPreviewUrl ?? (parsed.kind === 'image' ? parsed.url : '');
    if (src) return { kind: 'image' as const, src };
    const th =
      PROFILE_THEME_AVATARS.find((t) => t.id === activeFace.avatarTheme) ?? PROFILE_THEME_AVATARS[0];
    return { kind: 'emoji' as const, ...th };
  }, [activeFace.avatarDraft, activeFace.avatarTheme, activeFace.localPreviewUrl, activeFace.committedAvatarUrl]);

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
          <Link
            to="/notifications"
            className="relative shrink-0 rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
            aria-label="알림 설정"
          >
            <Bell className="h-5 w-5" aria-hidden />
            <span
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500"
              aria-hidden
            />
          </Link>
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

            {/* 돌봄회원 프로필 버튼 제거(중복): 일반 프로필만 수정 */} 

            {/* 프로필 완성도 게이지 */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    내 프로필 신뢰도{' '}
                    {completionRate === 100 && <ShieldCheck className="h-4 w-4 text-brand" aria-hidden />}
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
              <div className="flex flex-col items-center">
                <div className="relative mx-auto mb-3 flex h-[7.5rem] w-[7.5rem] shrink-0 items-center justify-center rounded-3xl">
                  <div className="relative z-10">
                    {avatarMain.kind === 'image' ? (
                      <div className="relative h-24 w-24 overflow-hidden rounded-3xl border-4 border-orange-200 shadow-inner">
                        <ImageWithFallback
                          src={avatarMain.src}
                          fallbackSrc={virtualDogPhotoForSeed(`profile-edit-${user?.id ?? 'anon'}`)}
                          alt="프로필 사진"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className={`flex h-24 w-24 items-center justify-center rounded-3xl border-4 text-4xl shadow-inner transition-colors ${avatarMain.bg} ${avatarMain.border}`}
                      >
                        {avatarMain.emoji}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void applyLatestDogPhoto()}
                  disabled={dogPhotoBusy}
                  className="mb-2 flex min-h-12 w-full max-w-[19rem] items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(249,115,22,0.35)] transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
                >
                  {dogPhotoBusy ? '강아지 사진 불러오는 중…' : '내 강아지 사진으로 설정'}
                </button>
                <p className="mb-3 text-center text-[11px] font-bold text-orange-600">
                  우리 댕댕이 등록 사진을 바로 프로필에 적용해요
                </p>

                <div className="flex gap-3 justify-center rounded-2xl bg-slate-50 p-2.5">
                  {PROFILE_THEME_AVATARS.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => selectThemeAvatar(theme.id)}
                      className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl transition-all ${theme.bg} ${
                        activeFace.avatarDraft === 'theme' && activeFace.avatarTheme === theme.id
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
                  사람 사진 업로드는 빼고, 내 강아지 사진 또는 캐릭터만 사용해요.
                </p>
              </div>
            </div>

            {/* 강아지 정보 (프로필과 함께 저장) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="mb-3">
                <h3 className="text-sm font-extrabold text-slate-800">우리 댕댕이 정보</h3>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">
                  이 페이지에서 프로필과 강아지 정보를 같이 저장해요.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  value={dogDraft.name}
                  maxLength={20}
                  onChange={(e) => setDogDraft((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="강아지 이름"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-bold text-slate-800 transition-all placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                />
                <input
                  type="text"
                  value={dogDraft.breed}
                  maxLength={30}
                  onChange={(e) => setDogDraft((prev) => ({ ...prev, breed: e.target.value }))}
                  placeholder="견종 (예: 말티즈)"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-bold text-slate-800 transition-all placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={35}
                    value={dogDraft.age}
                    onChange={(e) => setDogDraft((prev) => ({ ...prev, age: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                    placeholder="나이"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-bold text-slate-800 transition-all placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                  />
                  <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setDogDraft((prev) => ({ ...prev, gender: '남아' }))}
                      className={`rounded-xl py-2 text-xs font-extrabold transition-all ${dogDraft.gender === '남아' ? 'bg-white text-brand shadow-sm' : 'text-slate-500'}`}
                    >
                      남아
                    </button>
                    <button
                      type="button"
                      onClick={() => setDogDraft((prev) => ({ ...prev, gender: '여아' }))}
                      className={`rounded-xl py-2 text-xs font-extrabold transition-all ${dogDraft.gender === '여아' ? 'bg-white text-brand shadow-sm' : 'text-slate-500'}`}
                    >
                      여아
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 닉네임 수정 */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <label className="flex justify-between text-sm font-extrabold text-slate-800 mb-2">
                닉네임
                <span className="text-xs text-slate-400 font-medium">{activeFace.nickname.length}/10자</span>
              </label>
              <input
                type="text"
                value={activeFace.nickname}
                maxLength={10}
                onChange={(e) => setGeneral((p) => ({ ...p, nickname: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-bold text-slate-800 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
              />
            </div>

            {/* 동네·위치 */}
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

            {/* 전화번호 */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <label className="block text-sm font-extrabold text-slate-800 mb-2">전화번호</label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => setPhone(formatKoreanMobileDigits(e.target.value))}
                disabled={!user}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-bold text-slate-800 transition-all placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:opacity-60"
              />
              <p className="mt-2 text-[11px] font-medium leading-relaxed text-slate-500">
                카카오 로그인만으로는 전화번호가 넘어오지 않을 수 있어요. 연락 가능한 번호를 직접 입력한 뒤 저장해 주세요.
              </p>
            </div>

            {/* 돌봄회원 프로필은 별도 페이지에서 설정 */} 
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50 pb-safe max-w-[430px] mx-auto">
        <div className="max-w-screen-md mx-auto">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saveBusy || authLoading || profileLoading}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-market-cta text-lg font-bold text-white shadow-market transition-all hover:opacity-[0.92] active:scale-[0.98] disabled:opacity-50"
          >
            {saveBusy ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : null}
            프로필·강아지 함께 저장
          </button>
        </div>
      </div>
    </div>
  );
}
