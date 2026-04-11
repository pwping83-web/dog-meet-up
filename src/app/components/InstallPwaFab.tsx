import { useCallback, useEffect, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandalonePwa(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

const DISMISS_KEY = 'daeng_pwa_install_dismissed';

type Props = {
  hidden?: boolean;
};

/** PWA 설치 유도: Chrome/Edge는 원클릭 prompt, iOS는 안내 시트 */
export function InstallPwaFab({ hidden }: Props) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHelp, setIosHelp] = useState(false);
  const [genericHelp, setGenericHelp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined' || isStandalonePwa()) return;
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
    setIosHelp(false);
    setGenericHelp(false);
  }, []);

  const runInstall = useCallback(async () => {
    if (!deferred) return;
    setBusy(true);
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* ignore */
    } finally {
      setDeferred(null);
      setBusy(false);
    }
  }, [deferred]);

  const onFabClick = useCallback(() => {
    if (deferred) {
      void runInstall();
      return;
    }
    if (isIos()) {
      setIosHelp(true);
      return;
    }
    setGenericHelp(true);
  }, [deferred, runInstall]);

  if (hidden || typeof window === 'undefined' || isStandalonePwa() || dismissed) {
    return null;
  }

  return (
    <>
      <div className="pointer-events-none fixed right-3 top-14 z-[52] sm:right-6 sm:top-16">
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={onFabClick}
            disabled={busy}
            className="flex items-center gap-2 rounded-full border border-orange-200/90 bg-white/95 py-2.5 pl-3.5 pr-4 text-sm font-extrabold text-orange-700 shadow-lg backdrop-blur-md transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <Download className="h-4 w-4 shrink-0" />
            {deferred ? (busy ? '설치 중…' : '앱 설치') : '앱으로 쓰기'}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-500 shadow backdrop-blur"
          >
            나중에
          </button>
        </div>
      </div>

      {(iosHelp || genericHelp) && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <h3 className="text-lg font-black text-slate-900">
                {iosHelp ? '홈 화면에 추가' : '브라우저에서 설치'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIosHelp(false);
                  setGenericHelp(false);
                }}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {iosHelp ? (
              <ol className="list-decimal space-y-3 pl-5 text-sm font-medium text-slate-700">
                <li className="pl-1">
                  Safari 하단의 <Share2 className="mx-1 inline h-4 w-4 align-text-bottom text-orange-500" />
                  <strong> 공유</strong> 버튼을 누릅니다.
                </li>
                <li className="pl-1">
                  아래로 스크롤해 <strong>홈 화면에 추가</strong>를 선택합니다.
                </li>
                <li className="pl-1">
                  <strong>추가</strong>를 누르면 아이콘이 홈에 생깁니다.
                </li>
              </ol>
            ) : (
              <ul className="space-y-2 text-sm font-medium text-slate-700">
                <li>
                  <strong>Chrome / Edge</strong>: 주소창 오른쪽 설치 아이콘 또는 메뉼(⋮) →{' '}
                  <strong>댕댕마켓 설치</strong> / <strong>앱 설치</strong>
                </li>
                <li>
                  <strong>Samsung Internet</strong>: 메뉴 → <strong>페이지 추가</strong> →{' '}
                  <strong>홈 화면에 추가</strong>
                </li>
                <li className="text-xs text-slate-500">
                  프로덕션 빌드 후 HTTPS로 배포하면 설치 메뉴가 더 잘 보입니다.
                </li>
              </ul>
            )}

            <button
              type="button"
              onClick={() => {
                setIosHelp(false);
                setGenericHelp(false);
              }}
              className="mt-5 w-full rounded-2xl bg-slate-900 py-3 text-sm font-extrabold text-white"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
