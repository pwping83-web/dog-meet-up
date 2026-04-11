// src/app/pages/MyPage.tsx 전체 교체
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
  CreditCard,
  LogOut,
  MapPin,
  ChevronDown,
  Navigation,
  Loader2,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useState, useEffect } from 'react';
import { dogMbtiResults, DogMbtiType } from '../data/dogMbtiData';
import { useAuth } from '../../contexts/AuthContext';
import { useUserLocation } from '../../contexts/UserLocationContext';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { displayNameFromUser } from '../../lib/ensurePublicProfile';
import { isAppAdmin } from '../../lib/appAdmin';

export function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const {
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
    icon: typeof User;
    label: string;
    to: string;
    disabled?: boolean;
    replace?: boolean;
  }> = [
    { icon: User, label: '프로필 수정', to: '/profile/edit' },
    ...(user && isAppAdmin(user)
      ? [{ icon: Shield, label: '관리자 페이지', to: '/admin' as const }]
      : []),
    { icon: Settings, label: '설정', to: '#', disabled: true },
    { icon: Bell, label: '알림', to: '/notifications', replace: true },
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
          '위치를 가져오지 못했습니다. 브라우저에서 위치 권한을 허용했는지, 카카오맵 키(VITE_KAKAO_MAP_APP_KEY)가 있는지 확인해 주세요.',
      );
    } finally {
      setGpsBusy(false);
    }
  };

  const profileName = user ? displayNameFromUser(user) : '로그인 후 이용';

  return (
    <div className="min-h-screen bg-slate-50/80 pb-24">
      <LocationPickerModal open={locationOpen} onClose={() => setLocationOpen(false)} />

      {/* 헤더 */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50">
        <div className="px-4 h-14 flex items-center justify-center max-w-screen-md mx-auto">
          <h1 className="text-lg font-extrabold text-slate-800">내댕댕</h1>
        </div>
      </header>

      <div className="max-w-screen-md mx-auto px-4 py-6 space-y-5">
        
        {/* 프로필 섹션 · 동네 = UserLocation (헤더와 동일 저장소) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-yellow-50 border border-slate-100 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
              <User className="w-7 h-7 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h2 className="font-extrabold text-xl text-slate-800 mb-1 truncate">{profileName}</h2>
                <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-800">위치 기반</p>
                    <p className="text-[10px] font-medium text-slate-500">GPS·동네 맞춤</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={locationBasedEnabled}
                    onClick={() => setLocationBasedEnabled(!locationBasedEnabled)}
                    className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300 ${
                      locationBasedEnabled ? 'bg-orange-600 shadow-inner' : 'bg-slate-300'
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
                    className={`h-4 w-4 shrink-0 ${locationBasedEnabled ? 'text-orange-600' : 'text-slate-400'}`}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">{fullLabel}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
                {!locationBasedEnabled && regionFullLabel && (
                  <p className="mt-1 text-[10px] font-medium text-slate-400">
                    저장된 동네: {regionFullLabel} (켜면 이 동네로 다시 표시돼요)
                  </p>
                )}
                <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                  {locationBasedEnabled
                    ? '탭해서 지도·시·구로 동네를 바꿀 수 있어요'
                    : '위치 기반을 켜면 동네·GPS 설정을 쓸 수 있어요'}
                </p>
              </div>
              <button
                type="button"
                disabled={gpsBusy || !locationBasedEnabled}
                onClick={() => void handleGpsRefresh()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 py-3 text-sm font-extrabold text-orange-800 transition-colors hover:bg-orange-100 disabled:opacity-60"
              >
                {gpsBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                  <Navigation className="h-4 w-4 shrink-0" />
                )}
                {gpsBusy ? '현재 위치 확인 중…' : '현재 위치로 동네 맞추기'}
              </button>
            </div>
          </div>
        </div>

        {/* 강아지 MBTI 섹션 */}
        {dogMbtiType ? (
          <div className="bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-50 rounded-3xl p-6 border-2 border-orange-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{dogMbtiResults[dogMbtiType].emoji}</div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">{dogMbtiResults[dogMbtiType].name}</h3>
                  <p className="text-sm font-bold text-orange-600">{dogMbtiType.toUpperCase()} 타입</p>
                </div>
              </div>
              <Link
                to="/dog-mbti-test"
                className="p-2 bg-white/50 rounded-xl hover:bg-white transition-colors"
              >
                <Sparkles className="w-5 h-5 text-orange-500" />
              </Link>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {dogMbtiResults[dogMbtiType].description}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {dogMbtiResults[dogMbtiType].traits.map((trait) => (
                <span key={trait} className="px-3 py-1.5 bg-white text-orange-600 rounded-lg text-xs font-bold">
                  {trait}
                </span>
              ))}
            </div>
            <Link
              to="/create-dog"
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 rounded-xl font-bold text-sm text-center block hover:shadow-lg transition-all"
            >
              프로필 업데이트하기 🐾
            </Link>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-3xl p-6 border-2 border-dashed border-orange-200 text-center">
            <div className="text-5xl mb-4">🐕</div>
            <h3 className="font-black text-lg text-slate-900 mb-2">우리 강아지 성격은?</h3>
            <p className="text-sm text-slate-600 mb-5">
              MBTI 테스트로 우리 강아지에게<br />
              딱 맞는 친구를 찾아보세요!
            </p>
            <Link
              to="/dog-mbti-test"
              className="inline-block bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all"
            >
              강아지 MBTI 테스트 시작 🎯
            </Link>
          </div>
        )}

        {/* 댕집사 활동 상태 (댕집사일 경우) */}
        {isRepairer && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-orange-600 fill-orange-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">댕집사 활동</h3>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">
                    {isActive ? '모임 요청을 받고 있어요' : '현재 휴식 중입니다'}
                  </p>
                </div>
              </div>
              
              {/* iOS 스타일 토글 스위치 */}
              <button
                onClick={handleToggleActive}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${isActive ? 'bg-orange-600 shadow-inner' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* 활동 상태 뱃지 */}
            <div className={`px-4 py-3.5 rounded-2xl text-sm transition-colors ${isActive ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                <div>
                  <p className={`font-bold ${isActive ? 'text-emerald-800' : 'text-slate-600'}`}>
                    {isActive ? '지금 활동중이에요! 🎉' : '휴식중이에요 😴'}
                  </p>
                </div>
              </div>
            </div>

            {/* 통계 그리드 */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
              <div className="text-center bg-slate-50 py-3 rounded-2xl">
                <p className="text-xl font-black text-orange-600">12</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">받은 요청</p>
              </div>
              <div className="text-center bg-slate-50 py-3 rounded-2xl">
                <p className="text-xl font-black text-emerald-600">8</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">완료 모임</p>
              </div>
              <div className="text-center bg-slate-50 py-3 rounded-2xl">
                <p className="text-xl font-black text-amber-500">4.8</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">평균 평점</p>
              </div>
            </div>

            <Link
              to="/sitter/r1"
              className="mt-4 block w-full rounded-2xl border-2 border-orange-300 bg-orange-50 py-3.5 text-center text-sm font-bold text-orange-700 shadow-sm transition-colors hover:border-orange-400 hover:bg-orange-100 underline decoration-orange-600 decoration-2 underline-offset-4"
            >
              내 프로필 미리보기
            </Link>
          </div>
        )}

        {/* 내 활동 메뉴 */}
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-500">내 활동</h3>
          </div>
          <Link to="/my/meetups" className="flex items-center justify-between p-5 border-b border-slate-50 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all"><FileText className="w-4 h-4 text-slate-600" /></div>
              <span className="text-slate-800 font-bold text-sm">내 모임</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md font-bold">3건</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </Link>
          <Link to="/my/join-requests" className="flex items-center justify-between p-5 border-b border-slate-50 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all"><MessageCircle className="w-4 h-4 text-slate-600" /></div>
              <span className="text-slate-800 font-bold text-sm">받은 참여 신청</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md font-bold">5건</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </Link>
          <Link to="/billing" className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all"><CreditCard className="w-4 h-4 text-slate-600" /></div>
              <span className="text-slate-800 font-bold text-sm">결제 · 프리미엄 (Stripe)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </Link>
        </div>

        {/* 설정 메뉴 */}
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          {menuItems.map((item, index) => (
            <Link
              key={item.label}
              to={item.to}
              replace={item.replace === true}
              className={`w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group ${index !== menuItems.length - 1 ? 'border-b border-slate-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-slate-400 group-hover:text-orange-600 transition-colors" />
                <span className="text-slate-700 font-bold text-sm">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
          ))}
        </div>

        {/* 지원/탈퇴 메뉴 */}
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          {supportItems.map((item, index) => (
            <Link key={item.label} to={item.to} className={`w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group ${index !== supportItems.length - 1 ? 'border-b border-slate-50' : ''}`}>
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${item.label === '회원 탈퇴' ? 'text-red-400 group-hover:text-red-600' : 'text-slate-400 group-hover:text-orange-600'} transition-colors`} />
                <span className={`font-bold text-sm ${item.label === '회원 탈퇴' ? 'text-red-500' : 'text-slate-700'}`}>{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
          ))}
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

        {/* 댕집사 신청 배너 (아닐 때만 노출) */}
        {!isRepairer && (
          <Link to="/become-sitter" className="block relative overflow-hidden bg-gradient-to-br from-orange-500 to-yellow-500 rounded-3xl p-6 text-white active:scale-95 transition-all shadow-lg shadow-orange-500/30 group">
            <div className="relative z-10">
              <h3 className="font-extrabold text-xl mb-1.5 flex items-center gap-2">
                댕집사로 활동하기 <Play className="w-4 h-4 fill-white" />
              </h3>
              <p className="text-sm font-medium text-orange-50 mb-5">
                이웃 댕댕이들과 즐거운 시간을 함께하세요.
              </p>
              <div className="bg-white/20 backdrop-blur-md text-white px-5 py-2.5 rounded-xl font-bold inline-block group-hover:bg-white group-hover:text-orange-600 transition-colors text-sm">
                지금 1분 만에 신청하기
              </div>
            </div>
            {/* 배경 장식 */}
            <Heart className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 transform -rotate-12 fill-white" />
          </Link>
        )}
        
      </div>

      {/* Bottom tab navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-orange-50 z-50 pb-safe max-w-[430px] mx-auto">
        <div className="flex items-center justify-around h-16 max-w-screen-md mx-auto px-2">
          <Link
            to="/explore"
            className={`flex flex-col items-center gap-1 transition-colors ${
              location.pathname === '/explore' ? 'text-orange-600' : 'text-slate-400 hover:text-orange-600'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-bold">홈</span>
          </Link>
          <Link to="/search" className="flex flex-col items-center gap-1 text-slate-400 hover:text-orange-600 transition-colors">
            <Search className="w-6 h-6" />
            <span className="text-[10px] font-bold">검색</span>
          </Link>
          
          {/* Central write button */}
          <Link to="/create-meetup" className="flex flex-col items-center -mt-2 group">
            <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 group-active:scale-95 transition-all">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-slate-500 mt-1">글쓰기</span>
          </Link>
          
          <Link to="/chats" className="flex flex-col items-center gap-1 text-slate-400 hover:text-orange-600 transition-colors">
            <MessageCircle className="w-6 h-6" />
            <span className="text-[10px] font-bold">채팅</span>
          </Link>
          <Link to="/my" className="flex flex-col items-center gap-1 text-orange-600">
            <User className="w-6 h-6" />
            <span className="text-[10px] font-bold">내댕댕</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}