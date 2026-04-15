-- 신청 취소: 본인 certified_guard_moms 행 삭제 (기존 RLS에 DELETE 정책 없음 → 0건 삭제·오류 없음 → 앱에서 취소 실패로 보임)

DROP POLICY IF EXISTS "certified_guard_moms_delete_own" ON public.certified_guard_moms;
CREATE POLICY "certified_guard_moms_delete_own"
  ON public.certified_guard_moms FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
