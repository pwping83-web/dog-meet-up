import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

export const DAENG_AUTH_RETURN_KEY = 'daeng_auth_return';
export const DAENG_AUTH_RETURN_TS = 'daeng_auth_return_ts';
const MAX_AGE_MS = 30 * 60 * 1000;

export function setAuthReturnPath(path: string) {
  try {
    sessionStorage.setItem(DAENG_AUTH_RETURN_KEY, path);
    sessionStorage.setItem(DAENG_AUTH_RETURN_TS, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/** 로그인 세션이 잡힌 뒤, 최근에 저장한 복귀 경로가 있으면 이동 */
export function AuthReturnRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (loading || !user) return;
    if (pathname === '/login' || pathname === '/signup') return;
    let path: string | null = null;
    let tsRaw: string | null = null;
    try {
      path = sessionStorage.getItem(DAENG_AUTH_RETURN_KEY);
      tsRaw = sessionStorage.getItem(DAENG_AUTH_RETURN_TS);
    } catch {
      /* ignore */
    }
    if (!path || !path.startsWith('/') || path.startsWith('//')) return;
    const ts = tsRaw ? Number(tsRaw) : 0;
    if (ts && Date.now() - ts > MAX_AGE_MS) {
      try {
        sessionStorage.removeItem(DAENG_AUTH_RETURN_KEY);
        sessionStorage.removeItem(DAENG_AUTH_RETURN_TS);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      sessionStorage.removeItem(DAENG_AUTH_RETURN_KEY);
      sessionStorage.removeItem(DAENG_AUTH_RETURN_TS);
    } catch {
      /* ignore */
    }
    navigate(path, { replace: true });
  }, [user, loading, navigate, pathname]);

  return null;
}
