/**
 * OAuth(Supabase·카카오) 리다이렉트 등에 쓰는 사이트 Origin.
 * 배포 시 `VITE_SITE_URL`을 실제 도메인으로 두면 www/비-www 혼선을 줄일 수 있습니다.
 */
export function getSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/** 로그인 후 돌아올 URL (보통 루트) */
export function getAuthRedirectUrl(): string {
  const o = getSiteOrigin();
  return o ? `${o}/` : '/';
}
