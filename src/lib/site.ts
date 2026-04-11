/**
 * 사이트 기준 Origin (링크·메타 등). env가 있으면 우선합니다.
 * OAuth 콜백에는 `getAuthRedirectUrl()`을 쓰세요 — www/apex 혼선 방지.
 */
export function getSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/**
 * OAuth(Supabase·카카오) `redirect_to`.
 * 브라우저에서는 **반드시 `window.location.origin`** 과 같아야 PKCE·세션이 같은 Storage에 남습니다.
 * `VITE_SITE_URL`을 apex만 넣고 www로 접속하면, 로그인은 되는데 곧바로 비로그인처럼 보이는 루프가 납니다.
 */
export function getAuthRedirectUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/`;
  }
  const fromEnv = import.meta.env.VITE_SITE_URL?.trim().replace(/\/$/, '');
  return fromEnv ? `${fromEnv}/` : '/';
}
