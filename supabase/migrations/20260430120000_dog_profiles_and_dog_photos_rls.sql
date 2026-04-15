-- 댕댕이 등록: dog_profiles / storage(dog-photos) 에서
-- "new row violates row-level security policy" 가 나는 경우 대비 (정책 누락·UPDATE WITH CHECK 등)

-- ─── public.dog_profiles ───
ALTER TABLE public.dog_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dog_profiles_select_all" ON public.dog_profiles;
CREATE POLICY "dog_profiles_select_all"
  ON public.dog_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "dog_profiles_insert_own" ON public.dog_profiles;
CREATE POLICY "dog_profiles_insert_own"
  ON public.dog_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = owner_id);

DROP POLICY IF EXISTS "dog_profiles_update_own" ON public.dog_profiles;
CREATE POLICY "dog_profiles_update_own"
  ON public.dog_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "dog_profiles_delete_own" ON public.dog_profiles;
CREATE POLICY "dog_profiles_delete_own"
  ON public.dog_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "dog_profiles_delete_admin" ON public.dog_profiles;
CREATE POLICY "dog_profiles_delete_admin"
  ON public.dog_profiles FOR DELETE
  TO authenticated
  USING (public.is_app_admin());

-- ─── storage: dog-photos (DogCreatePage 업로드) ───
INSERT INTO storage.buckets (id, name, public)
VALUES ('dog-photos', 'dog-photos', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "dog_photos_public_read" ON storage.objects;
CREATE POLICY "dog_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dog-photos');

DROP POLICY IF EXISTS "dog_photos_auth_insert" ON storage.objects;
CREATE POLICY "dog_photos_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'dog-photos');

DROP POLICY IF EXISTS "dog_photos_auth_update" ON storage.objects;
CREATE POLICY "dog_photos_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'dog-photos')
  WITH CHECK (bucket_id = 'dog-photos');

DROP POLICY IF EXISTS "dog_photos_auth_delete" ON storage.objects;
CREATE POLICY "dog_photos_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'dog-photos');
