-- 인증 돌봄 신청서: 소개와 함께 노출할 사진 URL (dog-photos 등 공개 URL)

ALTER TABLE public.certified_guard_moms
  ADD COLUMN IF NOT EXISTS intro_photo_urls text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.certified_guard_moms.intro_photo_urls IS '신청서 소개 사진 공개 URL 배열 (최대 개수는 앱에서 제한)';
