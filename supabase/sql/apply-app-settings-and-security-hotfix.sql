-- Supabase SQL Editor용: app_settings가 없을 때 발생하는 42P01 오류를 피하려면
-- 이 파일 전체를 위에서부터 한 번에 실행하세요.
-- (이미 app_settings가 있는 DB라면 CREATE TABLE/INSERT는 스킵·무해합니다.)

-- ── A. 전역 설정 테이블 + 공개 SELECT (마이그레이션 20260420120000과 동일) ──
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY CHECK (id = 'app'),
  is_promo_mode BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.app_settings (id, is_promo_mode)
VALUES ('app', TRUE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_select_public" ON public.app_settings;
CREATE POLICY "app_settings_select_public"
  ON public.app_settings FOR SELECT
  USING (TRUE);

-- RLS·다른 정책에서 안전하게 읽기
CREATE OR REPLACE FUNCTION public.app_is_promo_mode()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_promo_mode FROM public.app_settings WHERE id = 'app' LIMIT 1),
    TRUE
  );
$$;

GRANT EXECUTE ON FUNCTION public.app_is_promo_mode() TO anon, authenticated;

-- certified_guard_moms 가 있을 때만 프로모 연동 SELECT 정책 갱신
DROP POLICY IF EXISTS "certified_guard_moms_select" ON public.certified_guard_moms;
CREATE POLICY "certified_guard_moms_select"
  ON public.certified_guard_moms FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      certified_at IS NOT NULL
      AND (
        public.app_is_promo_mode()
        OR (
          listing_visible_until IS NOT NULL
          AND listing_visible_until > NOW()
        )
      )
    )
  );

-- ── B. 관리자만 app_settings UPDATE (재미나이 보안 스니펫) ──
DROP POLICY IF EXISTS "app_settings_update_admin" ON public.app_settings;
CREATE POLICY "app_settings_update_admin"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- ── C. billing_orders: 클라이언트가 status 를 임의 변경하지 못하게 UPDATE 정책 제거 ──
DROP POLICY IF EXISTS "billing_orders_update_own" ON public.billing_orders;
