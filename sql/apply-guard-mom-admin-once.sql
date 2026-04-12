-- ═══════════════════════════════════════════════════════════════════
-- 인증 보호맘 · 관리자 한 번에 적용 (Supabase SQL Editor → 전체 복사 → Run 한 번)
-- 개별 파일: migrations/20260416130000 → 161200 → 161400 순 (300이 먼저여야 is_app_admin 존재)
-- 이 스크립트는 신규 프로젝트에도 안전한 순서로 묶었습니다. 여러 번 실행해도 됩니다.
-- ═══════════════════════════════════════════════════════════════════

-- ─── 161300: 관리자 이메일 (카카오 메타데이터 email 포함) ───
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

-- ─── 161200: 트리거(일반 사용자만 certified_at 잠금) + 관리자 UPDATE 정책 ───
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

-- ─── 161400: RPC admin_set_guard_mom_certified ───
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
