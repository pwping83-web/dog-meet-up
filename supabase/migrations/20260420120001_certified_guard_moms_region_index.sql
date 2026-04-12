-- 하이퍼로컬 1단계: 시·구 텍스트 조회·필터용 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_certified_guard_moms_region_si_gu
  ON public.certified_guard_moms (region_si, region_gu);
