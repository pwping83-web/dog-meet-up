// src/app/pages/MyPage.tsx 전체 교체
import type { ComponentType } from 'react';
import {
  User,
  FileText,
  MessageCircle,
  Settings,
  ChevronRight,
  Play,
  Shield,
  Bell,
  Heart,
  Power,
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
  const [isRepairer, setIsRepairer] = useState(true); 
  const [isActive, setIsActive] = useState(true); 
  const [dogMbtiType, setDogMbtiType] = useState<DogMbtiType | null>(null);
  const [extraCareRegions, setExtraCareRegions] = useState(() => readExtraCareRegions());
  const [extraCity, setExtraCity] = useState('');
  const [extraDistrict, setExtraDistrict] = useState('');
  const [extraHint, setExtraHint] = useState<string | null>(null);

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

  const menuItems: Array<{
    icon: ComponentType<{ className?: string }>;
    label: string;
    to: string;
    disabled?: boolean;
    replace?: boolean;
  }> = [
    { icon: User, label: '프로필 수정', to: '/profile/edit' },
    { icon: PawTabIcon, label: '인증 돌봄 · 인증 보호맘', to: '/sitters?view=care&care=guard' },
    ...(user && isAppAdmin(user)
      ? [{ icon: Shield, label: '관리자 페이지', to: '/admin' as const }]
      : []),
    { icon: Settings, label: '설정', to: '#', disabled: true },
    { icon: Bell, label: '알림 설정', to: '/notifications', replace: true },
  ];

  const supportItems = [
    { icon: MessageCircle, label: '고객센터', to: '/customer-service' },
    { icon: Power, label: '회원 탈퇴', to: '/delete-account' },
  ];

  const handleToggleActive = () => setIsActive(!isActive);

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

  const profileName = user ? displayNameFromUser(user) : '로그인 후 이용';

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <LocationPickerModal open={locationOpen} onClose={() => setLocationOpen(false)} />

      <header className="sticky top-0 z-50 bg-market-header shadow-market-lg">
        <div className="mx-auto flex h-14 max-w-screen-md items-center justify-between px-4">
          <h1 className="text-lg font-extrabold text-white">내댕댕</h1>
          <Link
            to="/notifications"
            className="rounded-full p-2 text-white/90 transition-colors hover:bg-white/15"
            aria-label="알림 설정"
          >
            <Settings className="h-6 w-6" />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-screen-md space-y-5 px-4 py-6">
        
        {/* 프로필 섹션 · 동네 = UserLocation (헤더와 동일 저장소) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-soft to-brand-muted shadow-inner">
              <User className="h-7 w-7 text-brand" />
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

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
              <MapPin className="h-5 w-5 text-amber-700" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-extrabold text-slate-900">인증 돌봄 · 거리 기준</h3>
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-600">
                위에서 저장한 <strong className="text-slate-800">기본 동네</strong>와 아래 <strong className="text-slate-800">추가 동네</strong> 중
                가까운 쪽으로 「모임·돌봄」 인증 돌봄 목록 거리를 계산해요.
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
                  className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/50 pl-3 pr-1 py-1 text-[11px] font-bold text-slate-800"
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
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            <Link
              to="/guard-mom/register"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 py-3 text-sm font-extrabold text-brand shadow-sm active:scale-[0.99]"
            >
              <PawTabIcon className="h-4 w-4 shrink-0" aria-hidden />
              인증 보호맘 등록
            </Link>
            <Link
              to="/billing"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-extrabold text-slate-800 active:scale-[0.99]"
            >
              <PawTabIcon className="h-4 w-4 shrink-0 text-brand" aria-hidden />
              인증 돌봄 · 목록 노출
            </Link>
          </div>
        </div>

        {/* 강아지 MBTI 섹션 */}
        {dogMbtiType ? (
          <div className="rounded-3xl border-2 border-brand/25 bg-gradient-to-br from-brand-soft via-white to-brand-muted p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{dogMbtiResults[dogMbtiType].emoji}</div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{dogMbtiResults[dogMbtiType].name}</h3>
                  <p className="text-sm font-bold text-brand">{dogMbtiType.toUpperCase()} 타입</p>
                </div>
              </div>
              <Link
                to="/dog-mbti-test"
                className="rounded-xl bg-white/60 p-2 transition-colors hover:bg-white"
              >
                <Sparkles className="h-5 w-5 text-brand" />
              </Link>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {dogMbtiResults[dogMbtiType].description}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {dogMbtiResults[dogMbtiType].traits.map((trait) => (
                <span
                  key={trait}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-brand"
                >
                  {trait}
                </span>
              ))}
            </div>
            <Link
              to="/create-dog"
              className="block w-full rounded-xl bg-market-cta py-3 text-center text-sm font-bold text-white shadow-market transition-all hover:opacity-[0.92]"
            >
              프로필 업데이트하기 🐾
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-brand/30 bg-gradient-to-br from-brand-soft to-brand-muted p-6 text-center">
            <div className="text-5xl mb-4">🐕</div>
            <h3 className="font-black text-lg text-slate-900 mb-2">우리 강아지 성격은?</h3>
            <p className="text-sm text-slate-600 mb-5">
              MBTI 테스트로 우리 강아지에게<br />
              딱 맞는 친구를 찾아보세요!
            </p>
            <Link
              to="/dog-mbti-test"
              className="inline-block rounded-xl bg-market-cta px-6 py-3 text-sm font-bold text-white shadow-market-lg transition-all hover:opacity-[0.92] active:scale-95"
            >
              강아지 MBTI 테스트 시작 🎯
            </Link>
          </div>
        )}

        {/* 인증 돌봄(댕집사): 주인 집 방문 돌봄 의뢰 — 모임 글과 무관 */}
        {isRepairer && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
                  <Heart className="h-6 w-6 fill-brand text-brand" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">인증 돌봄(댕집사)</h3>
                  <p className="mt-0.5 text-xs font-bold text-slate-500">
                    {isActive
                      ? '주인 집 방문 돌봄·산책 의뢰를 받고 있어요'
                      : '방문 돌봄 의뢰 받기를 쉬는 중이에요'}
                  </p>
                </div>
              </div>
              
              {/* iOS 스타일 토글 스위치 */}
              <button
                onClick={handleToggleActive}
                className={`relative h-8 w-14 rounded-full transition-all duration-300 ${isActive ? 'bg-market-cta shadow-inner' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* 활동 상태 뱃지 */}
            <div
              className={`rounded-2xl border px-4 py-3.5 text-sm transition-colors ${isActive ? 'border-brand/20 bg-brand/10' : 'border border-slate-100 bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${isActive ? 'animate-pulse bg-yellow-300' : 'bg-slate-400'}`} />
                <div>
                  <p className={`font-bold ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>
                    {isActive ? '지금 방문 돌봄 의뢰를 받을 수 있어요 🐕' : '방문 돌봄 접수를 잠시 멈췄어요'}
                  </p>
                </div>
              </div>
            </div>

            {/* 통계 그리드 */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
              <div className="text-center bg-slate-50 py-3 rounded-2xl">
                <p className="text-xl font-black text-brand">12</p>
                <p className="mt-1 text-[10px] font-bold text-slate-400">들어온 돌봄</p>
              </div>
              <div className="text-center bg-slate-50 py-3 rounded-2xl">
                <p className="text-xl font-black text-brand">8</p>
                <p className="mt-1 text-[10px] font-bold text-slate-400">완료 돌봄</p>
              </div>
              <div className="text-center bg-slate-50 py-3 rounded-2xl">
                <p className="text-xl font-black text-amber-500">4.8</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">평균 평점</p>
              </div>
            </div>

            <Link
              to="/sitter/r1"
              className="mt-4 block w-full rounded-2xl border-2 border-brand/30 bg-brand-soft py-3.5 text-center text-sm font-bold text-brand shadow-sm underline decoration-brand decoration-2 underline-offset-4 transition-colors hover:border-brand/40 hover:bg-brand/10"
            >
              내 프로필 미리보기
            </Link>
          </div>
        )}

        <div>
          <p className="mb-2 px-1 text-xs font-extrabold text-slate-500">내 활동</p>
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <Link
              to="/my/meetups"
              className="group flex items-center justify-between border-b border-slate-100 p-4 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 transition-all group-hover:bg-brand/15">
                  <FileText className="h-[18px] w-[18px] text-brand" />
                </div>
                <span className="text-sm font-bold text-slate-900">모이자·만나자 글</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand">
                  3건
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            </Link>
            <Link
              to="/my/join-requests"
              className="group flex items-center justify-between border-b border-slate-100 p-4 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 transition-all group-hover:bg-brand/15">
                  <MessageCircle className="h-[18px] w-[18px] text-brand" />
                </div>
                <span className="text-sm font-bold text-slate-900">받은 참여 신청</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand">
                  5건
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            </Link>
            <Link
              to="/billing"
              className="group flex items-center justify-between p-4 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 transition-all group-hover:bg-brand/15">
                  <PawTabIcon className="h-[18px] w-[18px] text-brand" />
                </div>
                <span className="text-sm font-bold text-slate-900">인증 돌봄 · 목록 노출</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </Link>
          </div>
        </div>

        <div>
          <p className="mb-2 px-1 text-xs font-extrabold text-slate-500">설정</p>
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            {menuItems.map((item, index) => (
              <Link
                key={item.label}
                to={item.to}
                replace={item.replace === true}
                className={`group flex w-full items-center justify-between p-4 transition-colors hover:bg-slate-50 ${
                  index !== menuItems.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-all group-hover:bg-brand/10">
                    <item.icon className="h-[18px] w-[18px] text-slate-600 transition-colors group-hover:text-brand" />
                  </div>
                  <span className="text-sm font-bold text-slate-900">{item.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 px-1 text-xs font-extrabold text-slate-500">고객지원</p>
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            {supportItems.map((item, index) => (
              <Link
                key={item.label}
                to={item.to}
                className={`group flex w-full items-center justify-between p-4 transition-colors hover:bg-slate-50 ${
                  index !== supportItems.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      item.label === '회원 탈퇴' ? 'bg-red-50' : 'bg-slate-100 group-hover:bg-brand/10'
                    }`}
                  >
                    <item.icon
                      className={`h-[18px] w-[18px] ${
                        item.label === '회원 탈퇴'
                          ? 'text-red-500'
                          : 'text-slate-600 group-hover:text-brand'
                      } transition-colors`}
                    />
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      item.label === '회원 탈퇴' ? 'text-red-500' : 'text-slate-900'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </Link>
            ))}
          </div>
        </div>

        {user && (
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {loggingOut ? '로그아웃 중…' : '로그아웃'}
          </button>
        )}

        {/* 인증 돌봄(댕집사) 등록 배너 */}
        {!isRepairer && (
          <Link
            to="/become-sitter"
            className="group relative block overflow-hidden rounded-3xl bg-market-header p-6 text-white shadow-market-lg transition-all active:scale-[0.99]"
          >
            <div className="relative z-10">
              <h3 className="mb-1.5 flex items-center gap-2 text-xl font-extrabold">
                인증 돌봄(댕집사)로 활동하기 <Play className="h-4 w-4 fill-white" />
              </h3>
              <p className="mb-5 text-sm font-medium text-white/85">
                돈 받고 산책·돌봄을 제공하는 돌보미로 등록해 보세요.
              </p>
              <div className="inline-block rounded-xl bg-white/20 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-md transition-colors group-hover:bg-white group-hover:text-brand">
                지금 1분 만에 신청하기
              </div>
            </div>
            {/* 배경 장식 */}
            <Heart className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 transform -rotate-12 fill-white" />
          </Link>
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

          <Link to="/create-meetup" className="-mt-2 flex flex-col items-center group">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.15rem] border-[3px] border-white bg-market-header shadow-lg shadow-orange-400/45 transition-all group-active:scale-95 group-hover:shadow-orange-400/55">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="mt-1 text-[10px] font-bold text-slate-500">글쓰기</span>
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