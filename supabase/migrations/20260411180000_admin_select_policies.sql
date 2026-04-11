-- 관리자 계정이 앱에서 전체 돌봄(보호맘)·결제 행을 조회할 수 있도록 RLS 추가
-- 이메일은 src/lib/appAdmin.ts 의 APP_ADMIN_EMAIL 과 반드시 동일하게 유지하세요.

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
      AND lower(trim(coalesce(u.email, ''))) = 'pwping83@gmail.com'
  );
$$;

REVOKE ALL ON FUNCTION public.is_app_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated;

DROP POLICY IF EXISTS "certified_guard_moms_select_admin" ON public.certified_guard_moms;
CREATE POLICY "certified_guard_moms_select_admin"
  ON public.certified_guard_moms FOR SELECT
  TO authenticated
  USING (public.is_app_admin());

DROP POLICY IF EXISTS "billing_orders_select_admin" ON public.billing_orders;
CREATE POLICY "billing_orders_select_admin"
  ON public.billing_orders FOR SELECT
  TO authenticated
  USING (public.is_app_admin());

DROP POLICY IF EXISTS "guard_mom_bookings_select_admin" ON public.guard_mom_bookings;
CREATE POLICY "guard_mom_bookings_select_admin"
  ON public.guard_mom_bookings FOR SELECT
  TO authenticated
  USING (public.is_app_admin());
