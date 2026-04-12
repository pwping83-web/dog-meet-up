-- 관리자 인증: RLS·다중 UPDATE 정책 이슈 없이 certified_at 갱신 (SECURITY DEFINER → 테이블 소유자 권한으로 UPDATE, RLS 우회)
-- 앱: supabase.rpc('admin_set_guard_mom_certified', { p_guard_mom_id, p_certified })

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
