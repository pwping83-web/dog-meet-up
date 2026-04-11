import { useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router';
import { Home, Wrench, User, Compass } from 'lucide-react';
import { Header } from '../components/Header';
import { DevPageNavigator } from '../components/DevPageNavigator';
import { PlayStoreInstallBar } from '../components/PlayStoreInstallBar';
import { InstallPwaFab } from '../components/InstallPwaFab';

export function Root() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isAdminPage = location.pathname === '/admin';
  const isExplorePage = location.pathname === '/explore';
  const hasOwnNav = isHomePage || isExplorePage; // 자체 네비게이션을 가진 페이지

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '댕댕마켓 - 우리 동네 댕친 찾기';
    
    // 기존 파비콘 제거
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    existingLinks.forEach(link => link.remove());
    
    // 오렌지/옐로우 그라데이션 배경에 흰색 발자국 SVG
    const faviconSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#F97316;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#EAB308;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#grad)"/>
        <g transform="translate(6,6)" fill="white">
          <ellipse cx="7" cy="4.5" rx="2.5" ry="3"/>
          <ellipse cx="13" cy="4.5" rx="2.5" ry="3"/>
          <ellipse cx="3.5" cy="10" rx="2" ry="2.5"/>
          <ellipse cx="16.5" cy="10" rx="2" ry="2.5"/>
          <path d="M10 10c-3 0-5.5 2-6 5-.3 2 .5 4 3 4.5 1.5.3 3-.5 3-2 0 1.5 1.5 2.3 3 2 2.5-.5 3.3-2.5 3-4.5-.5-3-3-5-6-5z"/>
        </g>
      </svg>
    `;
    const faviconURL = 'data:image/svg+xml,' + encodeURIComponent(faviconSVG);
    
    // SVG 파비콘 (모던 브라우저)
    const svgLink = document.createElement('link');
    svgLink.type = 'image/svg+xml';
    svgLink.rel = 'icon';
    svgLink.href = faviconURL;
    svgLink.setAttribute('data-app-favicon', '1');
    document.head.appendChild(svgLink);

    const appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    appleLink.href = faviconURL;
    appleLink.setAttribute('data-app-favicon', '1');
    document.head.appendChild(appleLink);

    const shortcutLink = document.createElement('link');
    shortcutLink.rel = 'shortcut icon';
    shortcutLink.href = faviconURL;
    shortcutLink.setAttribute('data-app-favicon', '1');
    document.head.appendChild(shortcutLink);

    return () => {
      document.querySelectorAll('link[data-app-favicon="1"]').forEach((el) => el.remove());
    };
  }, []);

  // 하단 네비게이션이 필요없는 페이지들 (LandingPage가 자체 네비게이션 포함)
  const hideBottomNav = isHomePage || isAdminPage || hasOwnNav;
  const showPrimaryNav = !hideBottomNav;

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
      active ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50'
    }`;

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center lg:items-start lg:py-6 lg:px-4">
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-2xl relative flex flex-col overflow-hidden lg:max-w-7xl lg:min-h-[calc(100dvh-3rem)] lg:flex-row lg:rounded-2xl lg:shadow-xl lg:overflow-hidden">
        {showPrimaryNav && (
          <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
            <div className="px-4 pt-6 pb-4 border-b border-slate-100">
              <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-yellow-600">
                댕댕마켓
              </span>
              <p className="text-xs text-slate-500 mt-1">우리 동네 댕친 찾기</p>
            </div>
            <nav className="flex flex-col gap-0.5 p-3 flex-1">
              <Link to="/" className={navLinkClass(location.pathname === '/')}>
                <Home className="w-5 h-5 shrink-0" />
                홈
              </Link>
              <Link to="/explore" className={navLinkClass(location.pathname === '/explore')}>
                <Compass className="w-5 h-5 shrink-0" />
                탐색
              </Link>
              <Link
                to="/sitters"
                className={navLinkClass(location.pathname.startsWith('/sitter'))}
              >
                <Wrench className="w-5 h-5 shrink-0" />
                댕집사
              </Link>
              <Link to="/my" className={navLinkClass(location.pathname === '/my')}>
                <User className="w-5 h-5 shrink-0" />
                내 정보
              </Link>
            </nav>
          </aside>
        )}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {!hasOwnNav && !isAdminPage && <Header />}
          <main className="relative min-h-0 flex-1 overflow-x-hidden">
            <Outlet />
          </main>

          {showPrimaryNav && (
            <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white lg:hidden max-w-[430px] mx-auto w-full">
              <div className="flex items-center justify-around">
                <Link
                  to="/"
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2 ${
                    location.pathname === '/' ? 'text-orange-600' : 'text-gray-500'
                  }`}
                >
                  <Home className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">홈</span>
                </Link>
                <Link
                  to="/explore"
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2 ${
                    location.pathname === '/explore' ? 'text-orange-600' : 'text-gray-500'
                  }`}
                >
                  <Compass className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">탐색</span>
                </Link>
                <Link
                  to="/sitters"
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2 ${
                    location.pathname.startsWith('/sitter') ? 'text-orange-600' : 'text-gray-500'
                  }`}
                >
                  <Wrench className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">댕집사</span>
                </Link>
                <Link
                  to="/my"
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2 ${
                    location.pathname === '/my' ? 'text-orange-600' : 'text-gray-500'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">내정보</span>
                </Link>
              </div>
            </nav>
          )}
        </div>

        <InstallPwaFab hidden={isAdminPage} />
        <PlayStoreInstallBar
          hidden={isAdminPage}
          reserveSpaceForBottomNav={showPrimaryNav}
        />
        <DevPageNavigator />
      </div>
    </div>
  );
}