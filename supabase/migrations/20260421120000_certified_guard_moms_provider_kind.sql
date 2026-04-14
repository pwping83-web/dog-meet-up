/* 인증 돌봄: 보호맘(맡기기) vs 댕집사(방문) 구분. 기존 행은 보호맘으로 간주. */

ALTER TABLE public.certified_guard_moms
  ADD COLUMN IF NOT EXISTS provider_kind TEXT NOT NULL DEFAULT 'guard_mom';

ALTER TABLE public.certified_guard_moms
  DROP CONSTRAINT IF EXISTS certified_guard_moms_provider_kind_check;

ALTER TABLE public.certified_guard_moms
  ADD CONSTRAINT certified_guard_moms_provider_kind_check
  CHECK (provider_kind IN ('guard_mom', 'dog_sitter'));

COMMENT ON COLUMN public.certified_guard_moms.provider_kind IS
  'guard_mom: 인증 보호맘(맡기기). dog_sitter: 인증 댕집사(방문). 동일 노출·인증 RPC 사용.';
