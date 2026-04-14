-- 1:1 대화: 참가자(발신·수신)가 자신이 속한 메시지 행 삭제 가능 (전체 삭제 UI)

DROP POLICY IF EXISTS "messages_delete_participants" ON public.messages;
CREATE POLICY "messages_delete_participants"
  ON public.messages FOR DELETE
  TO authenticated
  USING (sender_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid()));

GRANT DELETE ON public.messages TO authenticated;
