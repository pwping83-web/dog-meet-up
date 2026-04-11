import { useState } from 'react';
import { Link } from 'react-router';
import { MapPin, Shield, ChevronDown, Bell } from 'lucide-react';
import { useUserLocation } from '../../contexts/UserLocationContext';
import { useAuth } from '../../contexts/AuthContext';
import { isAppAdmin } from '../../lib/appAdmin';
import { LocationPickerModal } from './LocationPickerModal';

export function Header() {
  const { user } = useAuth();
  const { shortLabel, fullLabel, locationBasedEnabled } = useUserLocation();
  const [locationOpen, setLocationOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all">
      <LocationPickerModal open={locationOpen} onClose={() => setLocationOpen(false)} />
      <div className="mx-auto w-full max-w-[min(100%,480px)] px-4 pt-[env(safe-area-inset-top)]">
        <div className="relative flex min-h-[56px] items-center justify-between py-1">
          
          {/* 좌측: 지역 선택 (카카오맵 / GPS / 수동) */}
          <div className="flex items-center min-w-0 max-w-[45%]">
            <button
              type="button"
              title={fullLabel}
              onClick={() => setLocationOpen(true)}
              className={`flex min-w-0 items-center gap-1.5 rounded-full px-3 py-1.5 shadow-inner transition-colors ${
                locationBasedEnabled
                  ? 'bg-slate-100/80 hover:bg-slate-200/80'
                  : 'bg-slate-200/70 hover:bg-slate-200'
              }`}
            >
              <MapPin
                className={`h-4 w-4 shrink-0 ${locationBasedEnabled ? 'text-orange-600' : 'text-slate-500'}`}
              />
              <span className="truncate text-sm font-extrabold tracking-tight text-slate-800">
                {shortLabel}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            </button>
          </div>

          {/* 중앙: 앱 타이틀 (절대 위치로 정중앙 고정) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-yellow-600 tracking-tight">
              댕댕마켓
            </h1>
          </div>
          
          {/* 우측: 유틸리티 아이콘 */}
          <div className="flex items-center gap-1">
            <Link
              to="/notifications"
              className="relative rounded-full p-2 text-slate-400 transition-all hover:bg-orange-50 hover:text-orange-600"
              aria-label="알림 설정"
            >
              <Bell className="h-5 w-5" aria-hidden />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500" aria-hidden />
            </Link>
            
            {user && isAppAdmin(user) && (
              <Link
                to="/admin"
                className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all"
                aria-label="관리자"
              >
                <Shield className="w-5 h-5" />
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}