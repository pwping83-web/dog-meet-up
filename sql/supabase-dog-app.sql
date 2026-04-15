-- 댕댕마켓 앱이 기대하는 테이블·스토리지 (Supabase SQL 편집기에서 실행)
-- 이미 있으면 IF NOT EXISTS / DROP POLICY IF EXISTS 로 안전하게 반복 실행 가능

-- ─── 1) 사용자 공개 프로필 (카카오 로그인 후 upsert 등) ───
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT,
  region_si TEXT,
  region_gu TEXT,
  avatar_url TEXT,
  is_repairer BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS care_display_name TEXT,
  ADD COLUMN IF NOT EXISTS care_avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS care_specialty TEXT;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ─── 2) 강아지 프로필 (탐색·등록 페이지) ───
CREATE TABLE IF NOT EXISTS public.dog_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  owner_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  breed TEXT,
  age INT,
  gender TEXT,
  photo_url TEXT,
  city TEXT,
  district TEXT
);

CREATE INDEX IF NOT EXISTS idx_dog_profiles_created ON public.dog_profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dog_profiles_owner ON public.dog_profiles (owner_id);

ALTER TABLE public.dog_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dog_profiles_select_all" ON public.dog_profiles;
CREATE POLICY "dog_profiles_select_all"
  ON public.dog_profiles FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "dog_profiles_insert_own" ON public.dog_profiles;
CREATE POLICY "dog_profiles_insert_own"
  ON public.dog_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = owner_id);

DROP POLICY IF EXISTS "dog_profiles_update_own" ON public.dog_profiles;
CREATE POLICY "dog_profiles_update_own"
  ON public.dog_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "dog_profiles_delete_own" ON public.dog_profiles;
CREATE POLICY "dog_profiles_delete_own"
  ON public.dog_profiles FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- ─── 3) Storage: dog-photos 버킷 (DogCreatePage 업로드) ───
INSERT INTO storage.buckets (id, name, public)
VALUES ('dog-photos', 'dog-photos', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "dog_photos_public_read" ON storage.objects;
CREATE POLICY "dog_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dog-photos');

DROP POLICY IF EXISTS "dog_photos_auth_insert" ON storage.objects;
CREATE POLICY "dog_photos_auth_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dog-photos');

DROP POLICY IF EXISTS "dog_photos_auth_update" ON storage.objects;
CREATE POLICY "dog_photos_auth_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'dog-photos')
  WITH CHECK (bucket_id = 'dog-photos');

DROP POLICY IF EXISTS "dog_photos_auth_delete" ON storage.objects;
CREATE POLICY "dog_photos_auth_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'dog-photos');
