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
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/90 shadow-[0_2px_12px_rgba(94,67,255,0.06)] backdrop-blur-xl transition-all">
      <LocationPickerModal open={locationOpen} onClose={() => setLocationOpen(false)} />
      <div className="mx-auto w-full max-w-[min(100%,480px)] px-4 pt-[env(safe-area-inset-top)] sm:px-5">
        <div className="flex min-h-[56px] items-center gap-2 py-1.5 sm:gap-3">
          {/* 동네명이 길어도 로고·알림과 겹치지 않도록: 왼쪽만 flex-1 + truncate, 로고/우측은 고정 폭 */}
          <div className="min-w-0 flex-1 overflow-hidden">
            <button
              type="button"
              title={fullLabel}
              onClick={() => setLocationOpen(true)}
              className={`flex w-full max-w-full min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 shadow-inner transition-colors sm:px-3 ${
                locationBasedEnabled
                  ? 'bg-slate-100/80 hover:bg-slate-200/80'
                  : 'bg-slate-200/70 hover:bg-slate-200'
              }`}
            >
              <MapPin
                className={`h-4 w-4 shrink-0 ${locationBasedEnabled ? 'text-brand' : 'text-slate-500'}`}
              />
              <span className="min-w-0 flex-1 truncate text-left text-sm font-extrabold tracking-tight text-slate-800">
                {shortLabel}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            </button>
          </div>

          <div className="shrink-0">
            <Link
              to="/explore"
              className="relative z-10 block whitespace-nowrap rounded-lg bg-white/90 px-1.5 py-0.5 text-base font-black tracking-tight sm:text-lg"
              aria-label="홈으로 이동"
            >
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">댕댕마켓</span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-0.5 sm:gap-1">
            <Link
              to="/notifications"
              className="relative rounded-full p-2 text-slate-400 transition-all hover:bg-orange-50 hover:text-brand"
              aria-label="알림 설정"
            >
              <Bell className="h-5 w-5" aria-hidden />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500" aria-hidden />
            </Link>
            
            {user && isAppAdmin(user) && (
              <Link
                to="/admin"
                className="rounded-full p-2 text-slate-400 transition-all hover:bg-orange-50 hover:text-brand"
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