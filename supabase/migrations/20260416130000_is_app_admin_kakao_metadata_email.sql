-- 카카오 등 OAuth: auth.users.email 이 비어 있고 raw_user_meta_data.email 만 있는 경우 관리자 판별

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = auth.uid()
      AND (
        lower(trim(coalesce(u.email, ''))) = 'pwping83@gmail.com'
        OR lower(trim(coalesce(u.raw_user_meta_data->>'email', ''))) = 'pwping83@gmail.com'
      )
  );
$$;
