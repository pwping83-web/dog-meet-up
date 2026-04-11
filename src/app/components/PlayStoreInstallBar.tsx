import { useCallback, useState } from 'react';
import { X, Download } from 'lucide-react';
import { getPlayStoreUrl, openPlayStore } from '../../lib/playStore';

const DISMISS_KEY = 'daeng_play_store_bar_dismissed';

type Props = {
  /** 모바일 하단 탭 위에 맞출 때 true */
  reserveSpaceForBottomNav: boolean;
  /** 관리자 등에서 숨김 */
  hidden?: boolean;
};

export function PlayStoreInstallBar({ reserveSpaceForBottomNav, hidden }: Props) {
  const url = getPlayStoreUrl();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, []);

  if (hidden || !url || dismissed) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-[46] flex justify-center px-3 ${
        reserveSpaceForBottomNav
          ? 'bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] lg:bottom-8'
          : 'bottom-[max(1rem,env(safe-area-inset-bottom,0px))] lg:bottom-8'
      }`}
    >
      <div className="pointer-events-auto flex w-full max-w-[min(430px,calc(100vw-1.5rem))] items-stretch gap-2 rounded-2xl border border-slate-200/90 bg-white/95 p-2.5 shadow-lg backdrop-blur-md lg:max-w-md">
        <div className="flex min-w-0 flex-1 items-center gap-3 pl-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-inner">
            <Download className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-slate-900">댕댕마켓 앱</p>
            <p className="truncate text-[11px] font-medium text-slate-500">Google Play에서 설치하기</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => openPlayStore(url)}
            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-extrabold text-white shadow-sm transition-transform active:scale-[0.98] hover:bg-slate-800"
          >
            열기
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="배너 닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
