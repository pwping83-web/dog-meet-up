-- 한시적 무료: 인증만 된 보호맘은 listing_visible_until 없이도 목록에 공개
-- (프론트 VITE_PROMO_FREE_LISTINGS=true 와 함께 사용)
-- 유료 전환 시: migrations/20260415100001_paid_guard_mom_listing_select.sql 실행

DROP POLICY IF EXISTS "certified_guard_moms_select" ON public.certified_guard_moms;
CREATE POLICY "certified_guard_moms_select"
  ON public.certified_guard_moms FOR SELECT
  USING (
    user_id = auth.uid()
    OR (certified_at IS NOT NULL)
  );
