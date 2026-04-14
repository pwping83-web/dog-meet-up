// src/app/pages/MyPage.tsx 전체 교체
import {
  User,
  MessageCircle,
  ChevronRight,
  Shield,
  Home,
  Search,
  Sparkles,
  LogOut,
  MapPin,
  ChevronDown,
  Navigation,
  Loader2,
  CheckCircle2,
  Plus,
  PlusCircle,
  PawPrint,
  BadgeCheck,
  Bell,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useState, useEffect, useMemo } from 'react';
import { PawTabIcon } from '../components/icons/PawTabIcon';
import { dogMbtiResults, DogMbtiType } from '../data/dogMbtiData';
import { useAuth } from '../../contexts/AuthContext';
import { useUserLocation } from '../../contexts/UserLocationContext';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { RegionSelector } from '../components/RegionSelector';
import { formatRegion } from '../data/regions';
import { readExtraCareRegions, writeExtraCareRegions } from '../../lib/extraCareRegions';
import { displayNameFromUser } from '../../lib/ensurePublicProfile';
import { isAppAdmin } from '../../lib/appAdmin';
import { supabase } from '../../lib/supabase';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { profileAvatarAlt, profileAvatarVisual } from '../../lib/profileAvatar';
import { virtualDogPhotoForSeed } from '../data/virtualDogPhotos';
export function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const {
    location: userLoc,
    fullLabel,
    applyGpsLocation,
    locationBasedEnabled,
    setLocationBasedEnabled,
    regionFullLabel,
  } = useUserLocation();
  const [locationOpen, setLocationOpen] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [dogMbtiType, setDogMbtiType] = useState<DogMbtiType | null>(null);
  const [extraCareRegions, setExtraCareRegions] = useState(() => readExtraCareRegions());
  const [extraCity, setExtraCity] = useState('');
  const [extraDistrict, setExtraDistrict] = useState('');
  const [extraHint, setExtraHint] = useState<string | null>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [profileNameFromProfile, setProfileNameFromProfile] = useState<string | null>(null);
  /** 첫 댕댕이 프로필 썸네일(마이 섹션 2) */
  const [dogPreview, setDogPreview] = useState<{ photo: string | null; name: string } | null>(null);

  /** 프로필 저장 후 auth.updateUser 시 user.updated_at이 바뀌므로 여기서 profiles를 다시 읽음 */
  useEffect(() => {
    if (!user?.id) {
      setProfileAvatarUrl(null);
      setProfileNameFromProfile(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, name')
        .eq('id', user.id)
        .maybeSingle();
      if (!cancelled) {
        setProfileAvatarUrl(data?.avatar_url?.trim() ?? null);
        setProfileNameFromProfile(data?.name?.trim() ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.updated_at, location.key]);

  useEffect(() => {
    if (!user?.id) {
      setDogPreview(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from('dog_profiles')
        .select('name, photo_url')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setDogPreview({
          photo: typeof data.photo_url === 'string' ? data.photo_url.trim() || null : null,
          name: typeof data.name === 'string' ? data.name.trim() : '',
        });
      } else {
        setDogPreview(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, location.key]);

  const referenceDistrictsForExtras = useMemo(() => {
    const primary = userLoc.district?.trim();
    const fromExtras = extraCareRegions.map((e) => e.district.trim()).filter(Boolean);
    return Array.from(new Set([primary, ...fromExtras].filter(Boolean) as string[]));
  }, [userLoc.district, extraCareRegions]);

  const addExtraCareRegion = () => {
    setExtraHint(null);
    if (!extraCity.trim() || !extraDistrict.trim()) {
      setExtraHint('추가할 시·구를 모두 선택해 주세요.');
      return;
    }
    const d = extraDistrict.trim();
    if (referenceDistrictsForExtras.includes(d)) {
      setExtraHint('이미 기준에 포함된 동네예요.');
      return;
    }
    const next = [
      ...extraCareRegions,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, city: extraCity.trim(), district: d },
    ];
    writeExtraCareRegions(next);
    setExtraCareRegions(next);
    setExtraCity('');
    setExtraDistrict('');
  };

  const removeExtraCareRegion = (id: string) => {
    const next = extraCareRegions.filter((e) => e.id !== id);
    writeExtraCareRegions(next);
    setExtraCareRegions(next);
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      navigate('/');
    } catch (e) {
      console.error(e);
      alert('로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoggingOut(false);
    }
  };

  // MBTI 로드
  useEffect(() => {
    const savedMbti = localStorage.getItem('dogMbtiType') as DogMbtiType | null;
    if (savedMbti) {
      setDogMbtiType(savedMbti);
    }
  }, []);

  const handleGpsRefresh = async () => {
    setGpsBusy(true);
    try {
      await applyGpsLocation();
    } catch (e) {
      console.error(e);
      alert(
        (e as Error)?.message ||
          '위치를 가져오지 못했습니다. 브라우저·기기에서 위치 권한을 허용했는지 확인해 주세요.',
      );
    } finally {
      setGpsBusy(false);
    }
  };

  const profileName = user
    ? (profileNameFromProfile?.trim() || displayNameFromUser(user))
    : '로그인 후 이용';
  const headerAvatar = profileAvatarVisual(profileAvatarUrl);

  return (
    <div className="min-h-screen bg-slate-50">
      <LocationPickerModal open={locationOpen} onClose={() => setLocationOpen(false)} />

      <header className="sticky top-0 z-50 bg-market-header shadow-market-lg">
        <div className="mx-auto flex h-14 max-w-screen-md items-center justify-between px-4">
          <h1 className="text-lg font-extrabold text-white">내댕댕</h1>
          <div className="flex items-center gap-1">
            <Link
              to="/profile/edit"
              className="rounded-full p-2 text-white/90 transition-colors hover:bg-white/15"
              aria-label="프로필 수정"
            >
              <User className="h-6 w-6" />
            </Link>
            <Link
              to="/notifications"
              className="rounded-full p-2 text-white/90 transition-colors hover:bg-white/15"
              aria-label="알림"
            >
              <Bell className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-screen-md space-y-5 px-4 py-6">
        
        {/* 프로필 섹션 · 동네 = UserLocation (헤더와 동일 저장소) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-soft to-brand-muted shadow-inner">
              {headerAvatar.kind === 'image' ? (
                <ImageWithFallback
                  src={headerAvatar.src}
                  fallbackSrc={virtualDogPhotoForSeed(`my-page-avatar-${user?.id ?? 'x'}`)}
                  alt={profileAvatarAlt(profileAvatarUrl, profileName)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className={`flex h-full w-full items-center justify-center text-2xl ${headerAvatar.bg} ${headerAvatar.border} border-2`}
                  aria-hidden
                >
                  {headerAvatar.emoji}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h2 className="font-extrabold text-xl text-slate-800 mb-1 truncate">{profileName}</h2>
                <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-800">위치 기반</p>
                    <p className="text-[10px] font-medium leading-snug text-slate-500">
                      켜면 우리 동네 기준, 끄면 전국. 켜고 동네를 맞추면 내 주변 글이 보여요.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={locationBasedEnabled}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setLocationBasedEnabled(!locationBasedEnabled);
                    }}
                    className={`relative z-10 h-8 w-14 shrink-0 cursor-pointer rounded-full transition-colors duration-300 ${
                      locationBasedEnabled ? 'bg-market-cta shadow-inner' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                        locationBasedEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <button
                  type="button"
                  title={fullLabel}
                  onClick={() => setLocationOpen(true)}
                  className="flex w-full max-w-full items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-slate-100"
                >
                  <MapPin
                    className={`h-4 w-4 shrink-0 ${locationBasedEnabled ? 'text-brand' : 'text-slate-400'}`}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">{fullLabel}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
                {!locationBasedEnabled && regionFullLabel && (
                  <p className="mt-1 text-[10px] font-medium text-slate-400">
                    저장된 동네: {regionFullLabel} · 켜면 이 기준으로 다시 보여요
                  </p>
                )}
                <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                  {locationBasedEnabled ? '탭해서 동네를 바꿀 수 있어요' : '위치 기반을 켜면 내 주변 글을 볼 수 있어요'}
                </p>
                {locationBasedEnabled &&
                  userLoc.lat != null &&
                  userLoc.lng != null &&
                  (userLoc.source === 'gps' || userLoc.source === 'map') && (
                    <p className="mt-2 flex items-center gap-1.5 rounded-xl border border-brand/20 bg-brand/10 px-3 py-2 text-[11px] font-bold text-slate-800">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                      현재 위치로 동네가 맞춰져 있어요 (위치 인증)
                    </p>
                  )}
              </div>
              <button
                type="button"
                disabled={gpsBusy || !locationBasedEnabled}
                onClick={() => void handleGpsRefresh()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand/25 bg-brand-soft py-3 text-sm font-extrabold text-brand transition-colors hover:bg-brand/15 disabled:pointer-events-none disabled:opacity-50"
              >
                {gpsBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                  <Navigation className="h-4 w-4 shrink-0" />
                )}
                {gpsBusy ? '현재 위치 확인 중…' : '현재 위치로 동네 다시 맞추기'}
              </button>
            </div>
          </div>
        </div>

        {/* 2 · 강아지 프로필(사진) · MBTI */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex gap-4">
            <Link
              to="/create-dog"
              className="relative block h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-soft to-brand-muted shadow-inner"
            >
              {dogPreview?.photo ? (
                <ImageWithFallback
                  src={dogPreview.photo}
                  fallbackSrc={virtualDogPhotoForSeed(`my-dog-${user?.id ?? 'x'}`)}
                  alt={dogPreview.name ? `${dogPreview.name} 사진` : '강아지 사진'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-4xl" aria-hidden>
                  🐕
                </span>
              )}
            </Link>
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="text-[11px] font-extrabold text-slate-500">강아지 프로필</p>
                <p className="truncate text-base font-extrabold text-slate-900">
                  {dogPreview?.name || '사진·이름 등록'}
                </p>
              </div>
              {dogMbtiType ? (
                <div className="flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/10 px-2.5 py-2">
                  <span className="text-xl" aria-hidden>
                    {dogMbtiResults[dogMbtiType].emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-slate-900">{dogMbtiResults[dogMbtiType].name}</p>
                    <p className="text-[10px] font-bold text-brand">{dogMbtiType.toUpperCase()}</p>
                  </div>
                  <Link
                    to="/dog-mbti-test"
                    className="ml-auto shrink-0 rounded-lg bg-white/80 p-1.5 text-brand shadow-sm"
                    aria-label="MBTI 다시 하기"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <p className="text-[11px] font-semibold text-slate-500">MBTI로 성격 타입을 맞춰 보세요.</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  to="/create-dog"
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800"
                >
                  <PawPrint className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                  사진·프로필
                </Link>
                <Link
                  to="/dog-mbti-test"
                  className="inline-flex items-center gap-1 rounded-xl bg-market-cta px-3 py-2 text-xs font-extrabold text-white shadow-sm"
                >
                  MBTI {dogMbtiType ? '업데이트' : '시작'}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 3 · 인증 보호맘 · 댕집사 신청·등록 */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-start gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50">
              <BadgeCheck className="h-5 w-5 text-orange-600" aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-slate-900">인증 보호맘 · 댕집사</h3>
              <p className="mt-0.5 text-[10px] font-semibold leading-snug text-slate-500">
                신청 후 운영자 인증을 거쳐 노출돼요.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link
              to="/guard-mom/register"
              className="flex items-center justify-between gap-2 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3.5 text-sm font-extrabold text-brand shadow-sm active:scale-[0.99]"
            >
              <span className="flex items-center gap-2 min-w-0">
                <PawTabIcon className="h-4 w-4 shrink-0" aria-hidden />
                인증 보호맘 등록
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </Link>
            <Link
              to="/profile/edit"
              className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-extrabold text-slate-800 active:scale-[0.99]"
            >
              <span className="flex items-center gap-2 min-w-0">
                <PawTabIcon className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                댕집사·돌봄 신청
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* 4 · 인증 돌봄 거리 기준 */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
              <MapPin className="h-5 w-5 text-amber-700" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-extrabold text-slate-900">인증 돌봄 · 거리 기준</h3>
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-600">
                위에서 저장한 <strong className="text-slate-800">기본 동네</strong>와 아래{' '}
                <strong className="text-slate-800">추가 동네</strong> 중 가까운 쪽으로 「모임·돌봄」 인증 돌봄 목록
                거리를 계산해요.
              </p>
            </div>
          </div>
          <p className="mb-2 text-xs font-extrabold text-slate-800">추가 동네</p>
          <RegionSelector
            selectedCity={extraCity}
            selectedDistrict={extraDistrict}
            onCityChange={setExtraCity}
            onDistrictChange={setExtraDistrict}
            placeholder="추가할 시·구 선택"
          />
          <button
            type="button"
            onClick={addExtraCareRegion}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 py-2.5 text-xs font-extrabold text-amber-950 active:scale-[0.99]"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            이 동네 추가
          </button>
          {extraHint && <p className="mt-2 text-xs font-bold text-red-600">{extraHint}</p>}
          {extraCareRegions.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {extraCareRegions.map((ex) => (
                <li
                  key={ex.id}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/50 py-1 pl-3 pr-1 text-[11px] font-bold text-slate-800"
                >
                  {formatRegion(ex.city, ex.district)}
                  <button
                    type="button"
                    onClick={() => removeExtraCareRegion(ex.id)}
                    className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-amber-900"
                    aria-label={`${formatRegion(ex.city, ex.district)} 제거`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {user && isAppAdmin(user) && (
          <Link
            to="/admin"
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-extrabold text-slate-800 shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-brand" aria-hidden />
              관리자 페이지
            </span>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </Link>
        )}

        {user && (
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-4 text-sm font-bold text-slate-600 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {loggingOut ? '로그아웃 중…' : '로그아웃'}
          </button>
        )}
        
      </div>

      {/* Bottom tab navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[430px] border-t border-slate-200/80 bg-white/95 pb-safe backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-screen-md items-center justify-around px-2">
          <Link
            to="/explore"
            className={`flex flex-col items-center gap-1 transition-colors ${
              location.pathname === '/explore' ? 'text-brand' : 'text-slate-400 hover:text-brand'
            }`}
          >
            <Home className="h-6 w-6" />
            <span className="text-[10px] font-bold">홈</span>
          </Link>
          <Link
            to="/search"
            className={`flex flex-col items-center gap-1 transition-colors ${
              location.pathname === '/search' ? 'text-brand' : 'text-slate-400 hover:text-brand'
            }`}
          >
            <Search className="h-6 w-6" />
            <span className="text-[10px] font-bold">검색</span>
          </Link>

          <Link
            to="/create-meetup"
            className="group -mt-1 flex flex-shrink-0 items-center justify-center max-md:-mt-0.5"
            aria-label="글 올리기 · 모이자·만나자·돌봄 맡기기"
            title="글 올리기 · 모이자·만나자·돌봄 맡기기"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.15rem] border-[3px] border-white bg-gradient-to-br from-orange-500 to-yellow-400 shadow-lg shadow-orange-400/45 transition-all group-active:scale-90 max-md:h-[3.65rem] max-md:w-[3.65rem]">
              <PlusCircle className="h-7 w-7 text-white max-md:h-7 max-md:w-7" />
            </div>
          </Link>

          <Link
            to="/chats"
            className={`flex flex-col items-center gap-1 transition-colors ${
              location.pathname.startsWith('/chat') ? 'text-brand' : 'text-slate-400 hover:text-brand'
            }`}
          >
            <MessageCircle className="h-6 w-6" />
            <span className="text-[10px] font-bold">채팅</span>
          </Link>
          <Link to="/my" className="flex flex-col items-center gap-1 text-brand">
            <User className="h-6 w-6" />
            <span className="text-[10px] font-bold">내댕댕</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}