import { Link } from 'react-router';
import { Bell } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/90 shadow-[0_2px_12px_rgba(94,67,255,0.06)] backdrop-blur-xl transition-all">
      <div className="mx-auto w-full max-w-[min(100%,480px)] px-4 pt-[env(safe-area-inset-top)] sm:px-5">
        <div className="grid min-h-[56px] grid-cols-3 items-center gap-x-2 py-1.5 sm:gap-x-3">
          <div className="min-w-0" aria-hidden />

          <div className="flex justify-center px-1">
            <Link
              to="/explore"
              className="relative z-10 block whitespace-nowrap rounded-lg bg-white/90 px-2 py-0.5 text-base font-black tracking-tight sm:text-lg"
              aria-label="홈으로 이동"
            >
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">댕댕마켓</span>
            </Link>
          </div>

          <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-1.5">
            <Link
              to="/notifications"
              className="relative shrink-0 rounded-full p-2 text-slate-400 transition-all hover:bg-orange-50 hover:text-brand"
              aria-label="알림 설정"
            >
              <Bell className="h-5 w-5" aria-hidden />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
