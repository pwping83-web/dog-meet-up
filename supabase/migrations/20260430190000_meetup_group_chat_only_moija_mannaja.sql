-- 단체 채팅은 모이자·만나자 카테고리만 허용 (돌봄 맡기기 제외)

DROP POLICY IF EXISTS "meetup_chat_rooms_select_auth" ON public.meetup_chat_rooms;
CREATE POLICY "meetup_chat_rooms_select_auth"
  ON public.meetup_chat_rooms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.meetups m
      WHERE m.id = meetup_chat_rooms.meetup_id
        AND btrim(coalesce(m.category, '')) IN (
          '공원·장소 모임',
          '산책·놀이',
          '카페·체험',
          '훈련·사회화',
          '1:1 만남',
          '교배',
          '실종'
        )
    )
  );

DROP POLICY IF EXISTS "meetup_chat_rooms_insert_auth" ON public.meetup_chat_rooms;
CREATE POLICY "meetup_chat_rooms_insert_auth"
  ON public.meetup_chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.meetups m
      WHERE m.id = meetup_id
        AND btrim(coalesce(m.category, '')) IN (
          '공원·장소 모임',
          '산책·놀이',
          '카페·체험',
          '훈련·사회화',
          '1:1 만남',
          '교배',
          '실종'
        )
    )
  );
