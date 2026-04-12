-- 만나자 「교배」 신청 글 7일 목록 노출 권한 (결제 후 user_entitlements 갱신)
ALTER TABLE public.user_entitlements
  ADD COLUMN IF NOT EXISTS breeding_listing_until TIMESTAMPTZ;

COMMENT ON COLUMN public.user_entitlements.breeding_listing_until IS
  '교배 카테고리 글 목록 노출 만료 시각. Stripe breeding_post_listing_7d 웹훅에서 연장.';
