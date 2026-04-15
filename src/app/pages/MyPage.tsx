import {
  User,
  MessageCircle,
  ChevronRight,
  Shield,
  Home,
  Search,
  LogOut,
  MapPin,
  ChevronDown,
  PlusCircle,
  BadgeCheck,
  PencilLine,
  Bell,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useState, useEffect } from 'react';
import { PawTabIcon } from '../components/icons/PawTabIcon';
import { useAuth } from '../../contexts/AuthContext';
import { useUserLocation } from '../../contexts/UserLocationContext';
import { LocationPickerModal } from '../components/LocationPickerModal';
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
  const { fullLabel, locationBasedEnabled } = useUserLocation();
  const [locationOpen, setLocationOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [profileNameFromProfile, setProfileNameFromProfile] = useState<string | null>(null);
  const [profilePhone, setProfilePhone] = useState('');
  /** 인증 보호맘·댕집사 프로필 */
  const [carePreview, setCarePreview] = useState<{
    providerKind: string;
    regionSi: string;
    regionGu: string;
    intro: string;
    certified: boolean;
    introPhotoUrls: string[];
  } | null>(null);
  const [certifiedCareTick, setCertifiedCareTick] = useState(0);

  /** 프로필 저장 후 auth.updateUser 시 user.updated_at이 바뀌므로 여기서 profiles를 다시 읽음 */
  useEffect(() => {
    if (!user?.id) {
      setProfileAvatarUrl(null);
      setProfileNameFromProfile(null);
      setProfilePhone('');
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, name, phone')
        .eq('id', user.id)
        .maybeSingle();
      if (!cancelled) {
        setProfileAvatarUrl(data?.avatar_url?.trim() ?? null);
        setProfileNameFromProfile(data?.name?.trim() ?? null);
        if (data?.phone?.trim()) {
          const d = data.phone.replace(/\D/g, '').slice(0, 11);
          const fmt = d.length <= 3 ? d : d.length <= 7 ? `${d.slice(0,3)}-${d.slice(3)}` : `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
          setProfilePhone(fmt);
        } else {
          setProfilePhone('');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.updated_at, location.key]);

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

  // 인증 보호맘·댕집사 미리보기 로드
  useEffect(() => {
    const onCareChanged = () => setCertifiedCareTick((t) => t + 1);
    window.addEventListener('daeng-certified-guard-moms-changed', onCareChanged);
    return () => window.removeEventListener('daeng-certified-guard-moms-changed', onCareChanged);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setCarePreview(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from('certified_guard_moms')
        .select('provider_kind, region_si, region_gu, intro, certified_at, intro_photo_urls')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        const certified =
          data.certified_at != null &&
          String(data.certified_at).trim() !== '' &&
          !Number.isNaN(new Date(data.certified_at as string).getTime());
        setCarePreview({
          providerKind: String(data.provider_kind ?? 'guard_mom'),
          regionSi: String(data.region_si ?? '').trim(),
          regionGu: String(data.region_gu ?? '').trim(),
          intro: String(data.intro ?? '').trim(),
          certified,
          introPhotoUrls: Array.isArray(data.intro_photo_urls)
            ? (data.intro_photo_urls as string[]).filter((u) => typeof u === 'string' && u.trim())
            : [],
        });
      } else {
        setCarePreview(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, location.key, certifiedCareTick]);

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
        <div className="mx-auto flex h-14 max-w-screen-md items-center justify-between gap-3 px-4">
          <h1 className="text-lg font-extrabold text-white">내댕댕</h1>
          <Link
            to="/notifications"
            className="relative shrink-0 rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
            aria-label="알림 설정"
          >
            <Bell className="h-5 w-5" aria-hidden />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500" aria-hidden />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-screen-md space-y-5 px-4 py-6">
        
        {/* 프로필 카드 — 읽기 전용 요약. 수정은 /profile/edit 에서 */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            {/* 아바타 */}
            <Link
              to="/profile/edit"
              aria-label="강아지 프로필 수정"
              className="group relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-soft to-brand-muted shadow-inner transition-transform active:scale-[0.97]"
            >
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
              <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/50 via-transparent to-transparent pb-1 opacity-0 transition-opacity group-hover:opacity-100">
                <PencilLine className="h-3.5 w-3.5 text-white drop-shadow" aria-hidden />
              </span>
            </Link>

            {/* 이름 + 요약 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="min-w-0 flex-1 truncate text-xl font-extrabold text-slate-800">{profileName}</h2>
                {user?.id ? (
                  <Link
                    to="/profile/edit"
                    className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-extrabold text-slate-700 shadow-sm transition-colors hover:border-brand/35 hover:bg-brand-soft hover:text-brand"
                  >
                    <PencilLine className="h-3.5 w-3.5" aria-hidden />
                    수정
                  </Link>
                ) : null}
              </div>

              {/* 위치 — 탭하면 빠르게 동네 변경 */}
              <button
                type="button"
                onClick={() => setLocationOpen(true)}
                className="mt-2 flex w-full items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-left transition-colors hover:bg-slate-100"
              >
                <MapPin className={`h-3.5 w-3.5 shrink-0 ${locationBasedEnabled ? 'text-brand' : 'text-slate-400'}`} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-600">{fullLabel}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
              </button>

              {/* 전화번호 — 읽기 전용 */}
              {profilePhone ? (
                <p className="mt-1.5 flex items-center gap-1.5 px-1 text-xs font-semibold text-slate-500">
                  📞 {profilePhone}
                </p>
              ) : (
                <p className="mt-1.5 px-1 text-[11px] font-semibold text-slate-400">
                  연락처 미입력 — 수정에서 추가하세요
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 2 · 인증 보호맘 · 댕집사 + 추가 동네 — 하나의 카드 */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          {carePreview ? (
            /* ── 등록 완료 ── */
            <div className="flex gap-4">
              <Link
                to="/guard-mom/register"
                className="relative block h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 shadow-inner"
              >
                {carePreview.introPhotoUrls[0] ? (
                  <ImageWithFallback
                    src={carePreview.introPhotoUrls[0]}
                    fallbackSrc={virtualDogPhotoForSeed(`care-preview-${user?.id ?? 'x'}`)}
                    alt="소개 사진"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-4xl" aria-hidden>
                    {carePreview.providerKind === 'dog_sitter' ? '🏠' : '🤱'}
                  </span>
                )}
                {carePreview.certified && (
                  <span className="absolute bottom-0 right-0 flex items-center justify-center rounded-tl-xl bg-orange-500 p-1 shadow">
                    <BadgeCheck className="h-3.5 w-3.5 text-white" aria-hidden />
                  </span>
                )}
              </Link>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <p className="text-[11px] font-extrabold text-slate-500">
                    {carePreview.providerKind === 'dog_sitter' ? '인증 댕집사' : '인증 보호맘'}
                  </p>
                  <p className="truncate text-base font-extrabold text-slate-900">
                    {[carePreview.regionSi, carePreview.regionGu].filter(Boolean).join(' ') || '지역 미설정'}
                  </p>
                </div>
                {carePreview.certified ? (
                  <div className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-2.5 py-1.5">
                    <BadgeCheck className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
                    <span className="text-xs font-black text-orange-700">인증 완료</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                    <span className="text-[11px] font-bold text-slate-500">운영자 인증 검토 중</span>
                  </div>
                )}
                {carePreview.intro ? (
                  <p className="line-clamp-2 text-[11px] font-medium leading-snug text-slate-500">
                    {carePreview.intro}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    to="/guard-mom/register"
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800"
                  >
                    <PawTabIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    프로필 수정
                  </Link>
                  {carePreview.certified && (
                    <Link
                      to="/sitters"
                      className="inline-flex items-center gap-1 rounded-xl bg-market-cta px-3 py-2 text-xs font-extrabold text-white shadow-sm"
                    >
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      목록 보기
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── 미등록: 신청 버튼 ── */
            <>
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
              <Link
                to="/guard-mom/register"
                className="flex items-center justify-between gap-2 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3.5 text-sm font-extrabold text-brand shadow-sm active:scale-[0.99]"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <PawTabIcon className="h-4 w-4 shrink-0" aria-hidden />
                  신청하기
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </Link>
            </>
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