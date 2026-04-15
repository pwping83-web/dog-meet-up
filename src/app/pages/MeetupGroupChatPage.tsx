import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { fetchLatestDogPhotoUrlByOwnerIds } from '../../lib/chatDogPhotos';
import { isGroupChatMeetupCategory } from '../utils/meetupCategory';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { virtualDogPhotoForSeed } from '../data/virtualDogPhotos';

function formatTs(ts: string) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

type DbGroupMsg = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
};

export function MeetupGroupChatPage() {
  const { id: meetupId = '' } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [meetupTitle, setMeetupTitle] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    { id: string; text: string; senderId: string; senderName: string; isMine: boolean; ts: string }[]
  >([]);
  const [dogByUser, setDogByUser] = useState<Record<string, string>>({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(
    async (rid: string, silent?: boolean) => {
      if (!user?.id) return;
      if (!silent) setLoading(true);
      const { data, error } = await supabase
        .from('meetup_chat_messages')
        .select('id, content, sender_id, created_at')
        .eq('room_id', rid)
        .order('created_at', { ascending: true })
        .limit(500);
      if (error) {
        if (!silent) setErr(error.message);
        if (!silent) setLoading(false);
        return;
      }
      const rows = (data ?? []) as DbGroupMsg[];
      const senderIds = [...new Set(rows.map((r) => r.sender_id))];
      let names: Record<string, string> = {};
      if (senderIds.length) {
        const { data: profs } = await supabase.from('profiles').select('id, name').in('id', senderIds);
        names = Object.fromEntries((profs ?? []).map((p) => [String(p.id), String(p.name ?? '').trim() || '댕친']));
      }
      const dogMap = await fetchLatestDogPhotoUrlByOwnerIds(senderIds);
      const merged: Record<string, string> = {};
      for (const sid of senderIds) {
        merged[sid] = dogMap[sid] ?? virtualDogPhotoForSeed(`grp-dog-${sid}`);
      }
      setDogByUser((prev) => ({ ...prev, ...merged }));

      setMessages(
        rows.map((r) => ({
          id: r.id,
          text: r.content,
          senderId: r.sender_id,
          senderName: r.sender_id === user.id ? '나' : names[r.sender_id] ?? '댕친',
          isMine: r.sender_id === user.id,
          ts: formatTs(r.created_at),
        })),
      );
      if (!silent) setLoading(false);
      setErr(null);
    },
    [user?.id],
  );

  const ensureRoomAndJoin = useCallback(async (): Promise<string | null> => {
    const mid = meetupId.trim();
    if (!mid || !user?.id) return null;
    const { data: meetup, error: mErr } = await supabase
      .from('meetups')
      .select('id, title, category')
      .eq('id', mid)
      .maybeSingle();
    if (mErr || !meetup) {
      setErr(mErr?.message ?? '모임을 찾을 수 없어요.');
      return null;
    }
    if (!isGroupChatMeetupCategory(String(meetup.category ?? ''))) {
      setErr('모이자·만나자 글에서만 단톡을 사용할 수 있어요.');
      return null;
    }
    setMeetupTitle(String(meetup.title ?? '').trim() || '모임');

    const { data: existing } = await supabase.from('meetup_chat_rooms').select('id').eq('meetup_id', mid).maybeSingle();
    let rid = existing?.id as string | undefined;
    if (!rid) {
      const { data: inserted, error: insErr } = await supabase.from('meetup_chat_rooms').insert({ meetup_id: mid }).select('id').maybeSingle();
      if (insErr) {
        const { data: again } = await supabase.from('meetup_chat_rooms').select('id').eq('meetup_id', mid).maybeSingle();
        rid = again?.id as string | undefined;
        if (!rid) {
          setErr(insErr.message);
          return null;
        }
      } else {
        rid = inserted?.id as string | undefined;
      }
    }
    if (!rid) return null;

    const { error: memErr } = await supabase.from('meetup_chat_members').insert({ room_id: rid, user_id: user.id });
    if (memErr && !String(memErr.message).includes('duplicate') && memErr.code !== '23505') {
      setErr(memErr.message);
      return null;
    }
    return rid;
  }, [meetupId, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setErr(null);
      const rid = await ensureRoomAndJoin();
      if (cancelled) return;
      if (!rid) {
        setLoading(false);
        return;
      }
      setRoomId(rid);
      await loadMessages(rid);
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id, meetupId, ensureRoomAndJoin, loadMessages]);

  useEffect(() => {
    if (!user?.id || !roomId) return;
    const ch = supabase
      .channel(`meetup-grp-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'meetup_chat_messages', filter: `room_id=eq.${roomId}` },
        () => {
          void loadMessages(roomId, true);
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
          return;
        }
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsRealtimeConnected(false);
          void loadMessages(roomId, true);
        }
      });
    return () => {
      setIsRealtimeConnected(false);
      void supabase.removeChannel(ch);
    };
  }, [user?.id, roomId, loadMessages]);

  // Realtime 지연/끊김 대비: 짧은 주기 폴링 백업
  useEffect(() => {
    if (!user?.id || !roomId) return;
    const timer = window.setInterval(() => {
      void loadMessages(roomId, true);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [user?.id, roomId, loadMessages]);

  // 앱 복귀 시 최신 메시지 즉시 동기화
  useEffect(() => {
    if (!user?.id || !roomId) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void loadMessages(roomId, true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user?.id, roomId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const handleSend = async () => {
    const t = input.trim();
    if (!t || !user?.id || !roomId || sending) return;
    setSending(true);
    const { error } = await supabase.from('meetup_chat_messages').insert({
      room_id: roomId,
      sender_id: user.id,
      content: t,
    });
    setSending(false);
    if (error) {
      alert(error.message);
      return;
    }
    setInput('');
    void loadMessages(roomId, true);
  };

  if (!meetupId.trim()) {
    return <p className="p-6 text-sm text-slate-500">잘못된 주소예요.</p>;
  }

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-screen-md p-6">
        <p className="text-sm font-bold text-slate-700">로그인 후 이용해 주세요.</p>
        <Link to="/login" className="mt-3 inline-block text-sm font-extrabold text-orange-600 underline">
          로그인
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-screen max-w-screen-md flex-col bg-slate-50 shadow-[0_0_40px_rgba(0,0,0,0.02)]">
      <header className="z-10 flex-shrink-0 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-2 px-2">
          <button
            type="button"
            onClick={() => navigate(`/meetup/${meetupId}`)}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-50"
            aria-label="모임으로"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-orange-600">모임 단톡</p>
            <h1 className="truncate text-sm font-extrabold text-slate-800">{meetupTitle || '…'}</h1>
          </div>
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${isRealtimeConnected ? 'bg-emerald-400' : 'bg-slate-300'}`}
            aria-label={isRealtimeConnected ? '실시간 연결됨' : '실시간 재연결 중'}
            title={isRealtimeConnected ? '실시간 연결됨' : '실시간 재연결 중'}
          />
        </div>
      </header>
      {err && (
        <div className="mx-3 mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
          {err}
        </div>
      )}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" aria-label="불러오는 중" />
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex gap-2 ${m.isMine ? 'justify-end' : 'justify-start'}`}>
              {!m.isMine && (
                <div className="h-8 w-8 shrink-0 self-end overflow-hidden rounded-full border border-slate-100 bg-white shadow-sm">
                  <ImageWithFallback
                    src={dogByUser[m.senderId] ?? virtualDogPhotoForSeed(`g-${m.senderId}`)}
                    fallbackSrc={virtualDogPhotoForSeed(`g-${m.senderId}`)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="max-w-[78%]">
                {!m.isMine && <p className="mb-0.5 px-1 text-[10px] font-bold text-slate-500">{m.senderName}</p>}
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm font-medium ${
                    m.isMine
                      ? 'rounded-tr-sm bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-sm'
                      : 'rounded-tl-sm border border-slate-100 bg-white text-slate-800 shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
                <p className={`mt-0.5 px-1 text-[10px] font-semibold text-slate-400 ${m.isMine ? 'text-right' : ''}`}>
                  {m.ts}
                </p>
              </div>
              {m.isMine && user && (
                <div className="h-8 w-8 shrink-0 self-end overflow-hidden rounded-full border border-orange-100 bg-orange-50 shadow-sm">
                  <ImageWithFallback
                    src={dogByUser[user.id] ?? virtualDogPhotoForSeed(`g-me-${user.id}`)}
                    fallbackSrc={virtualDogPhotoForSeed(`g-me-${user.id}`)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex-shrink-0 border-t border-slate-100 bg-white p-3 pb-safe">
        <div className="relative flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="메시지…"
            disabled={!roomId || sending}
            className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-4 pr-12 text-sm font-medium text-slate-900 placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!input.trim() || !roomId || sending}
            className="absolute right-1 flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm transition-colors disabled:bg-slate-300"
            aria-label="보내기"
          >
            <Send className="ml-0.5 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
