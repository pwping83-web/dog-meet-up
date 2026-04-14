-- 인증 해제 시 listing_visible_until 도 비워 공개 목록·유료 노출 잔존으로 남지 않게 함

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
  SET
    certified_at = CASE WHEN p_certified THEN NOW() ELSE NULL END,
    listing_visible_until = CASE WHEN p_certified THEN cg.listing_visible_until ELSE NULL END
  WHERE cg.id = p_guard_mom_id
  RETURNING cg.id, cg.certified_at;
END;
$$;
