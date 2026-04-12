-- 보호맘: 주인 집까지 와서 강아지를 픽업해 갈 수 있음
ALTER TABLE public.certified_guard_moms
  ADD COLUMN IF NOT EXISTS offers_daeng_pickup BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.certified_guard_moms.offers_daeng_pickup IS
  '댕댕 픽업: 맡기기 시 보호맘이 주인 집까지 와서 픽업 가능 여부';
