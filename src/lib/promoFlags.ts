/**
 * 한시적 무료: 인증 보호맘 목록 노출 + 교배 글 노출 결제 없이 동작.
 * 기본값은 무료(변수 미설정). 유료 전환: VITE_PROMO_FREE_LISTINGS=false 및 RLS 복원 SQL 실행.
 * @see supabase/migrations/20260415100001_paid_guard_mom_listing_select.sql (유료 복원용)
 */
export function isPromoFreeListings(): boolean {
  const v = import.meta.env.VITE_PROMO_FREE_LISTINGS;
  if (v === undefined || v === '') return true;
  if (v === 'false' || v === '0') return false;
  return v === 'true' || v === '1';
}

/**
 * 인증 보호맘 탭에서 DB 결과가 비었을 때 목업 카드를 채울지.
 * 기본: 개발 서버에서만 true(로컬 UI 확인용). 운영 빌드는 false.
 * 운영에서도 데모가 필요하면 VITE_SHOW_CERTIFIED_GUARD_MOM_DEMOS=true
 */
export function showCertifiedGuardMomDemosWhenEmpty(): boolean {
  const v = import.meta.env.VITE_SHOW_CERTIFIED_GUARD_MOM_DEMOS;
  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0') return false;
  return Boolean(import.meta.env.DEV);
}
