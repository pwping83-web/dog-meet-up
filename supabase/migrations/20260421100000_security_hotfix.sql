-- 보안 핫픽스: billing_orders 클라이언트 UPDATE 차단 + app_settings 관리자 UPDATE 허용
-- 결제 상태 변경은 Stripe Webhook(Edge Function, service_role)만 RLS 우회로 가능.

-- 1. 결제 테이블(billing_orders) — 일반 authenticated의 UPDATE 정책 제거
--    (정책이 없으면 UPDATE는 거부; service_role은 RLS를 우회함)
DROP POLICY IF EXISTS "billing_orders_update_own" ON public.billing_orders;

-- 2. 전역 설정(app_settings) — 관리자 대시보드에서 프로모션 등 갱신 가능하도록
DROP POLICY IF EXISTS "app_settings_update_admin" ON public.app_settings;
CREATE POLICY "app_settings_update_admin"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());
