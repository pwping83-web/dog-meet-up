import { useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router';
import { Home, User, Search } from 'lucide-react';
import { Header } from '../components/Header';
import { PawTabIcon } from '../components/icons/PawTabIcon';
import { DevPageNavigator } from '../components/DevPageNavigator';
import { PlayStoreInstallBar } from '../components/PlayStoreInstallBar';
import { InstallPwaFab } from '../components/InstallPwaFab';

/** 나중에 스토어/PWA 출시 시 .env 에 VITE_SHOW_APP_INSTALL=true 설정 */
const showAppInstallPromo =
  import.meta.env.VITE_SHOW_APP_INSTALL === 'true' ||
  import.meta.env.VITE_SHOW_APP_INSTALL === '1';

export function Root() {
  const location = useLocation();

  const isHomePage = location.pathname === '/';
  const isAdminPage = location.pathname === '/admin';
  const isExplorePage = location.pathname === '/explore';
  const hasOwnNav = isHomePage || isExplorePage; // 자체 네비게이션을 가진 페이지

  // 페이지 타이틀 (파비콘은 public/favicon.svg + index.html 링크로 통일)
  useEffect(() => {
    document.title = '댕댕마켓 - 우리 동네 댕친 · 여행·출장 때 맡기기';
  }, []);

  // 하단 네비게이션이 필요없는 페이지들 (LandingPage가 자체 네비게이션 포함)
  const hideBottomNav = isHomePage || isAdminPage || hasOwnNav;
  const showPrimaryNav = !hideBottomNav;

  return (
    <div className="flex min-h-[100dvh] justify-center bg-[#ECECF0]">
      <div className="relative flex min-h-[100dvh] w-full max-w-[min(100%,480px)] flex-col overflow-hidden bg-white shadow-2xl">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {!hasOwnNav && !isAdminPage && <Header />}
          <main className="relative min-h-0 flex-1 overflow-x-hidden">
            <Outlet />
          </main>

          {showPrimaryNav && (
            <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-slate-200/90 bg-white/95 backdrop-blur-md">
              <div className="flex items-center justify-around">
                <Link
                  to="/explore"
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2 ${
                    location.pathname === '/explore' ? 'text-brand' : 'text-gray-500'
                  }`}
                >
                  <Home className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">홈</span>
                </Link>
                <Link
                  to="/search"
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2 ${
                    location.pathname === '/search' ? 'text-brand' : 'text-gray-500'
                  }`}
                >
                  <Search className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">탐색</span>
                </Link>
                <Link
                  to="/sitters"
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2 ${
                    location.pathname.startsWith('/sitter') || location.pathname.startsWith('/guard-mom')
                      ? 'text-brand'
                      : 'text-gray-500'
                  }`}
                  aria-label="모임과 유료 돌봄"
                >
                  <PawTabIcon className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">모임·돌봄</span>
                </Link>
                <Link
                  to="/my"
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2 ${
                    location.pathname === '/my' ? 'text-brand' : 'text-gray-500'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">내정보</span>
                </Link>
              </div>
            </nav>
          )}
        </div>

        {showAppInstallPromo && (
          <>
            <InstallPwaFab hidden={isAdminPage} />
            <PlayStoreInstallBar
              hidden={isAdminPage}
              reserveSpaceForBottomNav={showPrimaryNav}
            />
          </>
        )}

        <DevPageNavigator />
      </div>
    </div>
  );
}