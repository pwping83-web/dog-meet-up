-- 유료 전환 복원: 노출 기한이 남은 인증 보호맘만 타인에게 공개
DROP POLICY IF EXISTS "certified_guard_moms_select" ON public.certified_guard_moms;
CREATE POLICY "certified_guard_moms_select"
  ON public.certified_guard_moms FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      certified_at IS NOT NULL
      AND listing_visible_until IS NOT NULL
      AND listing_visible_until > NOW()
    )
  );
