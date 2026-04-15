-- 단체 채팅 나가기: 본인 멤버십 DELETE 허용

DROP POLICY IF EXISTS "meetup_chat_members_delete_self" ON public.meetup_chat_members;
CREATE POLICY "meetup_chat_members_delete_self"
  ON public.meetup_chat_members FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

GRANT DELETE ON public.meetup_chat_members TO authenticated;
