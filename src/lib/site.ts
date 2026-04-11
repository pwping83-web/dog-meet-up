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
 * 로그인 직후 루트만 보면 “입장 안 된 것 같음”을 줄이기 위해 **탐색(/explore)** 으로 돌아옵니다.
 */
export function getAuthRedirectUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/explore`;
  }
  const fromEnv = import.meta.env.VITE_SITE_URL?.trim().replace(/\/$/, '');
  return fromEnv ? `${fromEnv}/explore` : '/explore';
}
