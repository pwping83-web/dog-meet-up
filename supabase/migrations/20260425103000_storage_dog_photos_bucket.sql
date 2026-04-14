/* Storage: dog-photos 공개 버킷 + 인증 사용자 업로드 (profiles, care-intro, user-avatars 등) */

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
  USING (bucket_id = 'dog-photos');

DROP POLICY IF EXISTS "dog_photos_auth_delete" ON storage.objects;
CREATE POLICY "dog_photos_auth_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'dog-photos');
