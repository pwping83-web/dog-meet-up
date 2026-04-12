-- 앱 관리자(is_app_admin)가 certified_guard_moms.certified_at 을 갱신할 수 있도록
-- (기존 트리거는 JWT 업데이트 시 인증·노출 시각을 모두 잠궈 관리자도 변경 불가였음)

CREATE OR REPLACE FUNCTION public.certified_guard_moms_protect_privileged()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND auth.uid() IS NOT NULL AND NOT public.is_app_admin() THEN
    NEW.certified_at := OLD.certified_at;
    NEW.listing_visible_until := OLD.listing_visible_until;
  END IF;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "certified_guard_moms_update_admin" ON public.certified_guard_moms;
CREATE POLICY "certified_guard_moms_update_admin"
  ON public.certified_guard_moms FOR UPDATE
  TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());
