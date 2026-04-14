-- 모이자·만나자·돌봄 글 저장용 테이블 (폰 간 동기화)

CREATE TABLE IF NOT EXISTS public.meetups (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  user_name text NOT NULL DEFAULT '댕댕이 집사',
  title text NOT NULL,
  category text NOT NULL,
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  district text NOT NULL DEFAULT '',
  images text[] NOT NULL DEFAULT '{}',
  estimated_cost text NULL,
  listing_visible_until timestamptz NULL,
  status text NOT NULL DEFAULT 'pending',
  CONSTRAINT meetups_status_check CHECK (status IN ('pending', 'in-progress', 'completed'))
);

CREATE INDEX IF NOT EXISTS meetups_created_at_idx ON public.meetups (created_at DESC);
CREATE INDEX IF NOT EXISTS meetups_district_idx ON public.meetups (district);
CREATE INDEX IF NOT EXISTS meetups_user_id_idx ON public.meetups (user_id);

CREATE OR REPLACE FUNCTION public.meetups_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_meetups_touch_updated_at ON public.meetups;
CREATE TRIGGER tr_meetups_touch_updated_at
  BEFORE UPDATE ON public.meetups
  FOR EACH ROW
  EXECUTE PROCEDURE public.meetups_touch_updated_at();

ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meetups_select_all" ON public.meetups;
CREATE POLICY "meetups_select_all"
  ON public.meetups FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "meetups_insert_own" ON public.meetups;
CREATE POLICY "meetups_insert_own"
  ON public.meetups FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "meetups_update_own" ON public.meetups;
CREATE POLICY "meetups_update_own"
  ON public.meetups FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "meetups_delete_own" ON public.meetups;
CREATE POLICY "meetups_delete_own"
  ON public.meetups FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

GRANT SELECT ON public.meetups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetups TO authenticated;
