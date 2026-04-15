-- 돌봄회원용 공개 프로필(일반 name/avatar_url 과 별도)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS care_display_name TEXT,
  ADD COLUMN IF NOT EXISTS care_avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS care_specialty TEXT;

COMMENT ON COLUMN public.profiles.care_display_name IS '돌봄 탭에서 저장한 표시 이름 (없으면 UI에서 일반 프로필을 안내용으로만 복사)';
COMMENT ON COLUMN public.profiles.care_avatar_url IS '돌봄용 아바타 URL 또는 daeng-avatar-theme:…';
COMMENT ON COLUMN public.profiles.care_specialty IS '돌봄 소개 한 줄(프로필 수정 돌봄 탭)';
