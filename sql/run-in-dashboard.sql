-- ═══════════════════════════════════════════════════════════════════
-- 여기부터만 Supabase「SQL 편집기」에 붙여넣으세요. (PostgreSQL 문법만 가능)
-- open-supabase-sql.bat 내용(@echo, start 등)은 절대 붙이지 마세요 → 오류 납니다.
-- ═══════════════════════════════════════════════════════════════════
-- 댕댕마켓 · 한 번에 실행
-- 대시보드: SQL 편집기 → 새 쿼리 → 아래 CREATE부터 끝까지 복사 → Run
-- 프로젝트 ref: silbyvmcuymjewurkrfn

-- 과금(Stripe) 연동용 테이블 및 RLS
-- Supabase SQL Editor에서 이 파일을 실행하거나: supabase db push

-- 결제 건(Checkout 세션과 1:1에 가깝게 추적)
CREATE TABLE IF NOT EXISTS public.billing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  product_key TEXT NOT NULL,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_subtotal INTEGER,
  currency TEXT NOT NULL DEFAULT 'krw',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_billing_orders_user ON public.billing_orders (user_id, created_at DESC);

-- 프리미엄 등 권한 만료 시각 (웹훅에서 service role로 갱신)
CREATE TABLE IF NOT EXISTS public.user_entitlements (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  premium_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.billing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_orders_select_own" ON public.billing_orders;
CREATE POLICY "billing_orders_select_own"
  ON public.billing_orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "billing_orders_insert_own" ON public.billing_orders;
CREATE POLICY "billing_orders_insert_own"
  ON public.billing_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "billing_orders_update_own" ON public.billing_orders;
CREATE POLICY "billing_orders_update_own"
  ON public.billing_orders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_entitlements_select_own" ON public.user_entitlements;
CREATE POLICY "user_entitlements_select_own"
  ON public.user_entitlements FOR SELECT
  USING (auth.uid() = user_id);

-- ─── 인증 보호맘 (프로필 + 유료 노출 + 일당 예약) ───
-- (전체 본문은 supabase/migrations/20260411120000_guard_moms.sql 과 동일)

CREATE TABLE IF NOT EXISTS public.certified_guard_moms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  intro TEXT NOT NULL DEFAULT '',
  region_si TEXT NOT NULL DEFAULT '',
  region_gu TEXT NOT NULL DEFAULT '',
  per_day_fee_krw INTEGER NOT NULL DEFAULT 20000
    CHECK (per_day_fee_krw >= 1000 AND per_day_fee_krw <= 500000),
  certified_at TIMESTAMPTZ,
  listing_visible_until TIMESTAMPTZ
);

ALTER TABLE public.certified_guard_moms
  ADD COLUMN IF NOT EXISTS offers_daeng_pickup BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_certified_guard_moms_visible
  ON public.certified_guard_moms (listing_visible_until DESC)
  WHERE certified_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.guard_mom_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  guard_mom_id UUID NOT NULL REFERENCES public.certified_guard_moms (id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  days INTEGER NOT NULL CHECK (days >= 1 AND days <= 30),
  message TEXT NOT NULL DEFAULT '',
  per_day_fee_snapshot INTEGER NOT NULL,
  total_krw INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'paid', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_guard_mom_bookings_applicant
  ON public.guard_mom_bookings (applicant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guard_mom_bookings_mom
  ON public.guard_mom_bookings (guard_mom_id, created_at DESC);

ALTER TABLE public.certified_guard_moms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guard_mom_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "certified_guard_moms_select" ON public.certified_guard_moms;
CREATE POLICY "certified_guard_moms_select"
  ON public.certified_guard_moms FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      certified_at IS NOT NULL
      AND listing_visible_until IS NOT NULL
      AND listing_visible_until > NOW()
    )
  );

DROP POLICY IF EXISTS "certified_guard_moms_insert_own" ON public.certified_guard_moms;
CREATE POLICY "certified_guard_moms_insert_own"
  ON public.certified_guard_moms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "certified_guard_moms_update_own" ON public.certified_guard_moms;
CREATE POLICY "certified_guard_moms_update_own"
  ON public.certified_guard_moms FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "guard_mom_bookings_select" ON public.guard_mom_bookings;
CREATE POLICY "guard_mom_bookings_select"
  ON public.guard_mom_bookings FOR SELECT
  USING (
    applicant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.certified_guard_moms g
      WHERE g.id = guard_mom_id AND g.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "guard_mom_bookings_insert" ON public.guard_mom_bookings;
CREATE POLICY "guard_mom_bookings_insert"
  ON public.guard_mom_bookings FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "guard_mom_bookings_cancel_own" ON public.guard_mom_bookings;
CREATE POLICY "guard_mom_bookings_cancel_own"
  ON public.guard_mom_bookings FOR UPDATE
  USING (auth.uid() = applicant_id AND status = 'pending_payment')
  WITH CHECK (auth.uid() = applicant_id AND status = 'cancelled');

CREATE OR REPLACE FUNCTION public.certified_guard_moms_protect_privileged()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND auth.uid() IS NOT NULL THEN
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

CREATE OR REPLACE FUNCTION public.certified_guard_moms_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_certified_guard_moms_touch ON public.certified_guard_moms;
CREATE TRIGGER trg_certified_guard_moms_touch
  BEFORE UPDATE ON public.certified_guard_moms
  FOR EACH ROW
  EXECUTE PROCEDURE public.certified_guard_moms_touch_updated_at();

-- ─── 관리자: 돌봄·결제 전체 조회 (appAdmin.ts 의 APP_ADMIN_EMAIL 과 동일 이메일) ───
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

-- 만나자 「교배」 글 7일 목록 노출 (결제 → stripe-webhook에서 breeding_listing_until 연장)
ALTER TABLE public.user_entitlements
  ADD COLUMN IF NOT EXISTS breeding_listing_until TIMESTAMPTZ;
