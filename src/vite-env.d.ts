/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** Vite `define` — Vercel에서 빌드할 때 전체 Git SHA (로컬 dev는 빈 문자열) */
declare const __APP_DEPLOY_COMMIT__: string

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** OAuth 리다이렉트용 공개 사이트 URL (예: https://myapp.vercel.app). 비우면 window.location.origin 사용 */
  readonly VITE_SITE_URL?: string;
  readonly VITE_KAKAO_MAP_APP_KEY?: string;
  /** 카카오 로그인 OAuth scope (공백 구분). 비우면 profile_nickname profile_image */
  readonly VITE_KAKAO_AUTH_SCOPES?: string;
  /** Google Play 앱 페이지 전체 URL */
  readonly VITE_PLAY_STORE_URL?: string;
  /** true/1 이면 PWA·스토어 설치 유도 UI 표시 (출시 전에는 비워두기) */
  readonly VITE_SHOW_APP_INSTALL?: string;
  /** 비우면 기본 한시적 무료. 유료 전환 시 false 또는 0, RLS 는 20260415100001 마이그레이션으로 복원 */
  readonly VITE_PROMO_FREE_LISTINGS?: string;
  /** 전화 데모(000000) 폴백: 익명 로그인이 꺼져 있을 때 사용할 이메일 계정(클라이언트에 노출됨—전용 데모 계정만) */
  readonly VITE_PHONE_DEMO_EMAIL?: string;
  readonly VITE_PHONE_DEMO_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
