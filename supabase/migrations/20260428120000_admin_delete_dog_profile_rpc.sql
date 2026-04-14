-- 관리자 전용 dog_profiles 삭제 RPC (SECURITY DEFINER → RLS 우회)
-- RLS 정책 방식이 환경에 따라 적용 안 될 수 있어 RPC로 대체합니다.

CREATE OR REPLACE FUNCTION public.admin_delete_dog_profile(p_dog_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'admin_delete_dog_profile: 관리자만 호출할 수 있어요.';
  END IF;

  DELETE FROM public.dog_profiles WHERE id = p_dog_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_dog_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_dog_profile(uuid) TO authenticated;
