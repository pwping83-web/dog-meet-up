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
