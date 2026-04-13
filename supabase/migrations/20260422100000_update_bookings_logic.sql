-- guard_mom_bookings: 예약 기간(날짜) + 환불/취소 상태 + 신청자 UPDATE RLS 보완

-- 1) 예약 일자 (기존 행은 서울 기준 created_at 날짜로부터 days 일 포함 구간으로 백필)
ALTER TABLE public.guard_mom_bookings
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;

UPDATE public.guard_mom_bookings
SET
  start_date = COALESCE(
    start_date,
    (created_at AT TIME ZONE 'Asia/Seoul')::date
  ),
  end_date = COALESCE(
    end_date,
    (created_at AT TIME ZONE 'Asia/Seoul')::date + (days - 1)
  )
WHERE start_date IS NULL OR end_date IS NULL;

ALTER TABLE public.guard_mom_bookings
  ALTER COLUMN start_date SET NOT NULL,
  ALTER COLUMN end_date SET NOT NULL;

ALTER TABLE public.guard_mom_bookings
  DROP CONSTRAINT IF EXISTS guard_mom_bookings_date_range_chk;

ALTER TABLE public.guard_mom_bookings
  ADD CONSTRAINT guard_mom_bookings_date_range_chk
  CHECK (end_date >= start_date);

-- days 와 (start_date~end_date) 포함 일수 일치 (1일 예약: start = end)
ALTER TABLE public.guard_mom_bookings
  DROP CONSTRAINT IF EXISTS guard_mom_bookings_days_match_dates_chk;

ALTER TABLE public.guard_mom_bookings
  ADD CONSTRAINT guard_mom_bookings_days_match_dates_chk
  CHECK ((end_date - start_date + 1) = days);

-- 2) status CHECK: 환불 요청·완료
ALTER TABLE public.guard_mom_bookings
  DROP CONSTRAINT IF EXISTS guard_mom_bookings_status_check;

ALTER TABLE public.guard_mom_bookings
  ADD CONSTRAINT guard_mom_bookings_status_check
  CHECK (
    status IN (
      'pending_payment',
      'paid',
      'cancelled',
      'refund_requested',
      'refunded'
    )
  );

-- 3) RLS: 결제 전 취소(cancelled) + 결제 후 환불 요청(refund_requested)
--    (한 정책으로 OLD/NEW 조합을 모두 쓸 수 없어 정책 2개로 분리 — OR 로 결합됨)
DROP POLICY IF EXISTS "guard_mom_bookings_cancel_own" ON public.guard_mom_bookings;
DROP POLICY IF EXISTS "guard_mom_bookings_refund_request_own" ON public.guard_mom_bookings;

CREATE POLICY "guard_mom_bookings_cancel_own"
  ON public.guard_mom_bookings FOR UPDATE
  USING (auth.uid() = applicant_id AND status = 'pending_payment')
  WITH CHECK (auth.uid() = applicant_id AND status = 'cancelled');

CREATE POLICY "guard_mom_bookings_refund_request_own"
  ON public.guard_mom_bookings FOR UPDATE
  USING (auth.uid() = applicant_id AND status = 'paid')
  WITH CHECK (auth.uid() = applicant_id AND status = 'refund_requested');
