/** Google Play 스토어 앱 페이지 URL (예: https://play.google.com/store/apps/details?id=com.example.app) */
export function getPlayStoreUrl(): string | undefined {
  const u = import.meta.env.VITE_PLAY_STORE_URL;
  if (typeof u !== 'string') return undefined;
  const t = u.trim();
  return t.length > 0 ? t : undefined;
}

export function openPlayStore(url: string) {
  const u = url.trim();
  if (!u) return;
  window.open(u, '_blank', 'noopener,noreferrer');
}
