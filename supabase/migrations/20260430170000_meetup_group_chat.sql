-- 모임 단체 채팅: 모임당 방 1개, 로그인 사용자 자가 입장, 주최자는 방 생성 시 자동 멤버

CREATE TABLE IF NOT EXISTS public.meetup_chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  meetup_id text NOT NULL REFERENCES public.meetups (id) ON DELETE CASCADE,
  CONSTRAINT meetup_chat_rooms_meetup_unique UNIQUE (meetup_id)
);

CREATE TABLE IF NOT EXISTS public.meetup_chat_members (
  room_id uuid NOT NULL REFERENCES public.meetup_chat_rooms (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS meetup_chat_members_user_idx ON public.meetup_chat_members (user_id);

CREATE TABLE IF NOT EXISTS public.meetup_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  room_id uuid NOT NULL REFERENCES public.meetup_chat_rooms (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  content text NOT NULL,
  CONSTRAINT meetup_chat_messages_content_nonempty CHECK (length(trim(content)) > 0)
);

CREATE INDEX IF NOT EXISTS meetup_chat_messages_room_created_idx
  ON public.meetup_chat_messages (room_id, created_at DESC);

COMMENT ON TABLE public.meetup_chat_rooms IS '모임당 단체 채팅 방 1개';
COMMENT ON TABLE public.meetup_chat_members IS '방 멤버; 본인만 INSERT';
COMMENT ON TABLE public.meetup_chat_messages IS '단체방 메시지; 멤버만 SELECT/INSERT';

-- 방 생성 시 모임 주최자를 멤버로 넣음 (RLS 우회)
CREATE OR REPLACE FUNCTION public.meetup_chat_room_after_insert_add_host()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.meetup_chat_members (room_id, user_id)
  SELECT NEW.id, m.user_id
  FROM public.meetups m
  WHERE m.id = NEW.meetup_id
  ON CONFLICT (room_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_meetup_chat_room_after_insert_add_host ON public.meetup_chat_rooms;
CREATE TRIGGER tr_meetup_chat_room_after_insert_add_host
  AFTER INSERT ON public.meetup_chat_rooms
  FOR EACH ROW
  EXECUTE PROCEDURE public.meetup_chat_room_after_insert_add_host();

ALTER TABLE public.meetup_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_chat_messages ENABLE ROW LEVEL SECURITY;

-- 방: 모임이 있으면 로그인 사용자 조회·생성 가능
DROP POLICY IF EXISTS "meetup_chat_rooms_select_auth" ON public.meetup_chat_rooms;
CREATE POLICY "meetup_chat_rooms_select_auth"
  ON public.meetup_chat_rooms FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meetups m WHERE m.id = meetup_chat_rooms.meetup_id));

DROP POLICY IF EXISTS "meetup_chat_rooms_insert_auth" ON public.meetup_chat_rooms;
CREATE POLICY "meetup_chat_rooms_insert_auth"
  ON public.meetup_chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.meetups m WHERE m.id = meetup_id));

-- 멤버: SELECT는 본인 행만(같은 테이블 EXISTS는 RLS 무한 재귀 42P17 유발)
DROP POLICY IF EXISTS "meetup_chat_members_select_same_room" ON public.meetup_chat_members;
CREATE POLICY "meetup_chat_members_select_same_room"
  ON public.meetup_chat_members FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "meetup_chat_members_insert_self" ON public.meetup_chat_members;
CREATE POLICY "meetup_chat_members_insert_self"
  ON public.meetup_chat_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (SELECT 1 FROM public.meetup_chat_rooms r WHERE r.id = room_id)
  );

-- 메시지: 멤버만
DROP POLICY IF EXISTS "meetup_chat_messages_select_member" ON public.meetup_chat_messages;
CREATE POLICY "meetup_chat_messages_select_member"
  ON public.meetup_chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.meetup_chat_members m
      WHERE m.room_id = meetup_chat_messages.room_id
        AND m.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "meetup_chat_messages_insert_member" ON public.meetup_chat_messages;
CREATE POLICY "meetup_chat_messages_insert_member"
  ON public.meetup_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.meetup_chat_members m
      WHERE m.room_id = meetup_chat_messages.room_id
        AND m.user_id = (SELECT auth.uid())
    )
  );

GRANT SELECT, INSERT ON public.meetup_chat_rooms TO authenticated;
GRANT SELECT, INSERT ON public.meetup_chat_members TO authenticated;
GRANT SELECT, INSERT ON public.meetup_chat_messages TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables pt
    WHERE pt.pubname = 'supabase_realtime'
      AND pt.schemaname = 'public'
      AND pt.tablename = 'meetup_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meetup_chat_messages;
  END IF;
END $$;
