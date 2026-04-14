-- 일부 프로젝트에서 20260422100000 이 적용 전이라 guard_mom_bookings 에 start_date/end_date 가 없을 때 보정

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
    (created_at AT TIME ZONE 'Asia/Seoul')::date + GREATEST(days - 1, 0)
  )
WHERE start_date IS NULL OR end_date IS NULL;
