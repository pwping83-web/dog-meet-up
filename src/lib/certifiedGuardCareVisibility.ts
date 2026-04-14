/** 관리자가 `certified_at` 을 채운 유효 행인지 */
export function isCertifiedGuardMomPublicRow(row: { certified_at?: string | null }): boolean {
  const t = row.certified_at;
  if (t == null || String(t).trim() === '') return false;
  return !Number.isNaN(new Date(t as string).getTime());
}

/**
 * 인증 돌봄 탭 노출: 반드시 인증된 뒤, (프로모 무료) 또는 (유료 노출 기간 내).
 * 이전 (promoFree && certified) || paid 만으로는 인증 해제 후에도 paid 만으로 노출될 수 있음.
 */
export function careProviderListedInFeed(
  row: { certified_at?: string | null; listing_visible_until?: string | null },
  promoFree: boolean,
): boolean {
  if (!isCertifiedGuardMomPublicRow(row)) return false;
  if (promoFree) return true;
  const until = row.listing_visible_until;
  if (until == null || String(until).trim() === '') return false;
  return new Date(until as string).getTime() > Date.now();
}
