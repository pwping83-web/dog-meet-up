/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** OAuth 리다이렉트용 공개 사이트 URL (예: https://myapp.vercel.app). 비우면 window.location.origin 사용 */
  readonly VITE_SITE_URL?: string;
  readonly VITE_KAKAO_MAP_APP_KEY?: string;
  /** Google Play 앱 페이지 전체 URL */
  readonly VITE_PLAY_STORE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
