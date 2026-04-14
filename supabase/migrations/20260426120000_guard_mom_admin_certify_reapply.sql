/* 관리자 인증 RPC가 certified_at 을 못 바꾸는 경우: 초기 guard_moms 트리거가
   auth.uid() 가 있으면 무조건 certified_at 을 OLD 로 되돌림 → 161200 내용이 DB에 없으면 발생.
   이 파일은 is_app_admin + 트리거(관리자 예외) + RLS + RPC 를 한 번에 idempotent 재적용합니다. */

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = auth.uid()
      AND (
        lower(trim(coalesce(u.email, ''))) = 'pwping83@gmail.com'
        OR lower(trim(coalesce(u.raw_user_meta_data->>'email', ''))) = 'pwping83@gmail.com'
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_app_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated;

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

DROP TRIGGER IF EXISTS trg_certified_guard_moms_protect ON public.certified_guard_moms;
CREATE TRIGGER trg_certified_guard_moms_protect
  BEFORE UPDATE ON public.certified_guard_moms
  FOR EACH ROW
  EXECUTE PROCEDURE public.certified_guard_moms_protect_privileged();

DROP POLICY IF EXISTS "certified_guard_moms_update_admin" ON public.certified_guard_moms;
CREATE POLICY "certified_guard_moms_update_admin"
  ON public.certified_guard_moms FOR UPDATE
  TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

CREATE OR REPLACE FUNCTION public.admin_set_guard_mom_certified(p_guard_mom_id uuid, p_certified boolean)
RETURNS TABLE(id uuid, certified_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  UPDATE public.certified_guard_moms cg
  SET certified_at = CASE WHEN p_certified THEN NOW() ELSE NULL END
  WHERE cg.id = p_guard_mom_id
  RETURNING cg.id, cg.certified_at;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_guard_mom_certified(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_guard_mom_certified(uuid, boolean) TO authenticated;
