import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Home, MapPin, PlusCircle, MessageCircle, User } from 'lucide-react';
import { useUserLocation } from '../../contexts/UserLocationContext';
import { LocationPickerModal } from './LocationPickerModal';

/** 탐색(/explore)·모임 상세(/meetup/*) 등에서 공통 하단 바 — 글쓰기(+) 유지 */
export function CommunityBottomNav() {
  const location = useLocation();
  const { shortLabel: locationShortLabel } = useUserLocation();
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const { pathname } = location;
  const homeActive = pathname === '/explore' || pathname.startsWith('/meetup/');

  return (
    <>
      <LocationPickerModal open={locationPickerOpen} onClose={() => setLocationPickerOpen(false)} />
      <nav
        className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-orange-50 bg-white/95 pb-[max(0px,env(safe-area-inset-bottom))] backdrop-blur-xl max-md:border-slate-200/80"
        aria-label="하단 메뉴"
      >
        <div className="flex h-[3.75rem] items-center justify-around px-1 max-md:h-16 max-md:px-2 md:h-14">
          <Link
            to="/explore"
            className={`flex flex-col items-center gap-1 max-md:gap-1 ${homeActive ? 'text-orange-600' : 'text-slate-400'}`}
          >
            <Home className="h-6 w-6 max-md:h-6 max-md:w-6 md:h-5 md:w-5" />
            <span className="text-[11px] max-md:text-xs md:text-[9px]" style={{ fontWeight: 800 }}>
              홈
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setLocationPickerOpen(true)}
            className="flex flex-col items-center gap-1 text-slate-400 max-md:gap-1 active:opacity-80"
            aria-label={`위치·동네 설정. 현재 ${locationShortLabel}`}
          >
            <MapPin className="h-6 w-6 max-md:h-6 max-md:w-6 md:h-5 md:w-5" />
            <span className="text-[11px] max-md:text-xs md:text-[9px]" style={{ fontWeight: 800 }}>
              위치
            </span>
          </button>
          <Link
            to="/create-meetup"
            className="group -mt-1 flex flex-shrink-0 items-center justify-center max-md:-mt-0.5"
            aria-label="글 올리기 · 모이자·만나자·돌봄 맡기기"
            title="글 올리기 · 모이자·만나자·돌봄 맡기기"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.15rem] border-[3px] border-white bg-gradient-to-br from-orange-500 to-yellow-400 shadow-lg shadow-orange-400/45 transition-all group-active:scale-90 max-md:h-[3.65rem] max-md:w-[3.65rem] md:h-12 md:w-12 md:rounded-2xl">
              <PlusCircle className="h-7 w-7 text-white max-md:h-7 max-md:w-7 md:h-6 md:w-6" />
            </div>
          </Link>
          <Link to="/chats" className="flex flex-col items-center gap-1 text-slate-400 max-md:gap-1">
            <MessageCircle className="h-6 w-6 max-md:h-6 max-md:w-6 md:h-5 md:w-5" />
            <span className="text-[11px] max-md:text-xs md:text-[9px]" style={{ fontWeight: 800 }}>
              댕팅
            </span>
          </Link>
          <Link to="/my" className="flex flex-col items-center gap-1 text-slate-400 max-md:gap-1">
            <User className="h-6 w-6 max-md:h-6 max-md:w-6 md:h-5 md:w-5" />
            <span className="text-[11px] max-md:text-xs md:text-[9px]" style={{ fontWeight: 800 }}>
              내댕댕
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}
