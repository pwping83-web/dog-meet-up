// src/app/pages/ProfileEditPage.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Camera,
  MapPin,
  CheckCircle2,
  ChevronDown,
  Loader2,
  X,
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
  const [phone, setPhone] = useState('');
  const [general, setGeneral] = useState<ProfileModeFace>(() => emptyFace());
  const [dogImageFile, setDogImageFile] = useState<File | null>(null);
  const [dogPreviewUrl, setDogPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setDogImageFile(null);
      setDogPreviewUrl(null);
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
      setDogPreviewUrl(typeof row?.photo_url === 'string' ? row.photo_url : null);
      setDogImageFile(null);
    }
    setProfileLoading(false);
  }, [user]);

  useEffect(() => {
    return () => {
      if (dogPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(dogPreviewUrl);
    };
  }, [dogPreviewUrl]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const activeFace = general;
  const setActiveFace = setGeneral;

  const locationVerified = userLoc.source === 'gps' || userLoc.source === 'map';
  const phoneDigits = phone.replace(/\D/g, '');
  const phoneOk = phoneDigitsOk(phoneDigits);

  const buildAvatarUrlForSave = async (face: ProfileModeFace): Promise<string | null> => {
    if (face.avatarDraft === 'theme') {
      return encodeProfileAvatarTheme(face.avatarTheme);
    }
    return face.committedAvatarUrl;
  };

  const handleDogImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 선택할 수 있어요.');
      return;
    }
    setDogImageFile(file);
    setDogPreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const clearDogImage = () => {
    setDogImageFile(null);
    setDogDraft((prev) => ({ ...prev, photoUrl: null }));
    setDogPreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const handleSave = async () => {
    if (!user) {
      alert('로그인 후 저장할 수 있어요.');
      navigate('/login');
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
      let dogPhotoUrl = dogDraft.photoUrl?.trim() ?? '';
      if (dogImageFile) {
        const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(
          (dogImageFile.name.split('.').pop() || '').toLowerCase(),
        )
          ? (dogImageFile.name.split('.').pop() || 'jpg').toLowerCase()
          : 'jpg';
        const path = `profiles/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;
        const { error: upErr } = await supabase.storage.from('dog-photos').upload(path, dogImageFile);
        if (upErr) {
          alert(upErr.message || '강아지 사진 업로드에 실패했어요.');
          return;
        }
        const { data: pub } = supabase.storage.from('dog-photos').getPublicUrl(path);
        dogPhotoUrl = pub.publicUrl;
      }

      let avatar_url: string | null;
      try {
        avatar_url = await buildAvatarUrlForSave(activeFace);
      } catch (e) {
        const msg = (e as Error).message;
        alert(msg);
        return;
      }
      if (dogPhotoUrl) {
        avatar_url = dogPhotoUrl;
      }

      const nickOut = (activeFace.nickname.trim() || displayNameFromUser(user)).slice(0, 10);

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
          photo_url: dogPhotoUrl || null,
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
      setDogDraft((prev) => ({ ...prev, photoUrl: dogPhotoUrl || prev.photoUrl }));
      setDogImageFile(null);
      setDogPreviewUrl(dogPhotoUrl || dogPreviewUrl);

      alert('강아지 프로필과 보호자 정보를 함께 저장했어요! 💾');
      navigate('/my');
    } finally {
      setSaveBusy(false);
    }
  };

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

            {/* 강아지 정보 (사진+정보) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="mb-3">
                <h3 className="text-sm font-extrabold text-slate-800">우리 댕댕이 정보</h3>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">
                  강아지 사진·정보와 보호자 연락처·위치를 한 번에 저장해요.
                </p>
              </div>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleDogImageChange} />
              <div className="mb-4 flex justify-center">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className="relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-[2rem] border-4 border-dashed border-orange-200 bg-orange-50"
                >
                  {dogPreviewUrl ? (
                    <>
                      <ImageWithFallback
                        src={dogPreviewUrl}
                        fallbackSrc={virtualDogPhotoForSeed(`profile-edit-${user?.id ?? 'anon'}`)}
                        alt="강아지 사진 미리보기"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          clearDogImage();
                        }}
                        className="absolute right-1.5 top-1.5 rounded-full bg-black/55 p-1 text-white"
                        aria-label="사진 삭제"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center text-orange-500">
                      <Camera className="mx-auto h-6 w-6" aria-hidden />
                      <p className="mt-1 text-[11px] font-extrabold">사진 선택</p>
                    </div>
                  )}
                </div>
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

            {/* 현재 위치 */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-extrabold text-slate-800">현재 위치</label>
                {locationVerified ? (
                  <span className="flex items-center gap-1 rounded-lg border border-brand/20 bg-brand/10 px-2 py-1 text-[11px] font-extrabold text-brand">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 위치 맞춤
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400">지도·GPS는 아래에서</span>
                )}
              </div>
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
