-- 관리자가 dog_profiles 행을 삭제할 수 있도록 (새로운 댕친 등 공개 목록 정리)

DROP POLICY IF EXISTS "dog_profiles_delete_admin" ON public.dog_profiles;
CREATE POLICY "dog_profiles_delete_admin"
  ON public.dog_profiles FOR DELETE TO authenticated
  USING (public.is_app_admin());
