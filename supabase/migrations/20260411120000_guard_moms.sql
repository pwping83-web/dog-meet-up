-- 인증 보호맘: 프로필 + 유료 노출 기간 + 일당 예약(결제)

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

-- 일반 사용자는 인증·노출 기간 중인 프로필만 목록에서 조회. 본인은 항상 조회 가능.
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

-- JWT로 오는 일반 사용자 업데이트에서는 인증·노출 시각 변경 불가 (서비스 롤·대시보드는 auth.uid() 없음으로 통과)
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
