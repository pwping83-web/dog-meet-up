-- meetup_chat_members SELECT가 같은 테이블을 EXISTS로 조회해 42P17 무한 재귀 발생
-- 앱은 meetup_chat_members를 user_id = auth.uid()로만 조회함 → 본인 행만 허용으로 충분

DROP POLICY IF EXISTS "meetup_chat_members_select_same_room" ON public.meetup_chat_members;
CREATE POLICY "meetup_chat_members_select_same_room"
  ON public.meetup_chat_members FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
