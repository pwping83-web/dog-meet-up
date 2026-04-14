-- 1:1 채팅 메시지 (ChatsPage / ChatDetailPage → public.messages)
-- 적용 전 오류: Could not find the table 'public.messages' in the schema cache

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sender_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  request_id uuid NULL,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  CONSTRAINT messages_no_self_message CHECK (sender_id <> receiver_id)
);

CREATE INDEX IF NOT EXISTS messages_sender_created ON public.messages (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_receiver_created ON public.messages (receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_room ON public.messages (sender_id, receiver_id, created_at DESC);

COMMENT ON TABLE public.messages IS '1:1 user chat; RLS = sender or receiver only.';

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
CREATE POLICY "messages_select_participants"
  ON public.messages FOR SELECT
  TO authenticated
  USING (sender_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "messages_insert_as_sender" ON public.messages;
CREATE POLICY "messages_insert_as_sender"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "messages_update_receiver_read" ON public.messages;
CREATE POLICY "messages_update_receiver_read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (receiver_id = (SELECT auth.uid()))
  WITH CHECK (receiver_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.messages_enforce_read_only_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.receiver_id IS DISTINCT FROM OLD.receiver_id
     OR NEW.content IS DISTINCT FROM OLD.content
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.request_id IS DISTINCT FROM OLD.request_id
     OR NEW.id IS DISTINCT FROM OLD.id
  THEN
    RAISE EXCEPTION 'messages: only "read" may be updated';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_messages_read_only_update ON public.messages;
CREATE TRIGGER tr_messages_read_only_update
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.messages_enforce_read_only_update();

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;

-- Supabase Realtime (postgres_changes 구독)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables pt
    WHERE pt.pubname = 'supabase_realtime'
      AND pt.schemaname = 'public'
      AND pt.tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
