-- 과금(Stripe) 연동용 테이블 및 RLS
-- Supabase SQL Editor에서 실행하거나: supabase db push

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

-- Edge Functions > Secrets 예시:
-- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
-- STRIPE_PRICE_PREMIUM_MONTHLY, STRIPE_PRICE_MEETUP_BOOST,
-- PUBLIC_SITE_URL (프론트 배포 Origin, 끝 슬래시 없음),
-- SUPABASE_SERVICE_ROLE_KEY (stripe-webhook 전용)
-- 배포: supabase functions deploy create-checkout-session stripe-webhook --project-ref <ref>
-- Stripe Dashboard > Webhooks: https://<ref>.supabase.co/functions/v1/stripe-webhook
