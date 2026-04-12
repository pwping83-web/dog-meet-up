-- 전역 설정: 프로모션 모드(결제 우회) — Supabase 대시보드에서 is_promo_mode만 바꿔도 RLS·클라이언트 분기에 반영
-- 단일 행(id = 'app')

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

-- RLS 정책에서 안전하게 읽기 (SECURITY DEFINER)
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

-- 프로모 ON: 인증만 되면 공개 / 프로모 OFF: 유료 노출 기한 유효 시만 공개 (본인은 항상)
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
