import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, Send, Settings2, MoreVertical, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AiDoumiButton } from '../components/AiDoumiButton';
import { supabase } from '../../lib/supabase';
import { isAuthUserUuid } from '../../lib/profileIds';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar: string;
}

interface Message {
  id: string;
  text: string;
  isMine: boolean;
  timestamp: string;
}

type DbMessage = {
  id: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
};

function formatTime(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '방금';
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export function ChatsPage() {
  const { user, loading: authLoading } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // 이전 로컬 데모 채팅 스토리지 정리
    try {
      localStorage.removeItem('daeng-chat-threads-v1');
    } catch {
      /* ignore */
    }
  }, []);

  const loadChats = useCallback(async () => {
    if (!user?.id) {
      setChats([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from('messages')
      .select('id, created_at, sender_id, receiver_id, content, read')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      setErr(error.message);
      setChats([]);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as DbMessage[];
    const byPeer = new Map<string, { last: DbMessage; unread: number }>();
    for (const m of rows) {
      const peerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      const prev = byPeer.get(peerId);
      if (!prev) {
        byPeer.set(peerId, { last: m, unread: m.receiver_id === user.id && !m.read ? 1 : 0 });
      } else {
        byPeer.set(peerId, {
          last: prev.last,
          unread: prev.unread + (m.receiver_id === user.id && !m.read ? 1 : 0),
        });
      }
    }
    const peerIds = [...byPeer.keys()];
    let nameById: Record<string, string> = {};
    if (peerIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id,name').in('id', peerIds);
      nameById = Object.fromEntries((profiles ?? []).map((p) => [String(p.id), String(p.name ?? '').trim()]));
    }
    const nextChats: Chat[] = peerIds
      .map((peerId) => {
        const grouped = byPeer.get(peerId)!;
        return {
          id: peerId,
          name: nameById[peerId] || '댕친',
          lastMessage: grouped.last.content || '대화를 시작해 보세요 🐾',
          timestamp: formatTime(grouped.last.created_at),
          unreadCount: grouped.unread,
          avatar: '🐕',
        };
      })
      .sort((a, b) => {
        const aTs = byPeer.get(a.id)?.last.created_at ?? '';
        const bTs = byPeer.get(b.id)?.last.created_at ?? '';
        return new Date(bTs).getTime() - new Date(aTs).getTime();
      });
    setChats(nextChats);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`chat-list-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new as Partial<DbMessage>;
          if (row.sender_id === user.id || row.receiver_id === user.id) {
            void loadChats();
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, loadChats]);

  /** Realtime 누락/지연 대비: 목록은 짧은 주기 재동기화 */
  useEffect(() => {
    if (!user?.id) return;
    const timer = window.setInterval(() => {
      void loadChats();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [user?.id, loadChats]);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50">
        <div className="max-w-screen-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 -ml-2">
            <Link to="/explore" className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors" aria-label="메인으로">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-lg font-extrabold text-slate-800">채팅</h1>
          </div>
          <button className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors">
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-screen-md space-y-3 p-4">
        {authLoading || loading ? (
          <div className="flex justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" aria-label="불러오는 중" />
          </div>
        ) : !user ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-700">로그인 후 채팅을 사용할 수 있어요</p>
            <Link to="/login" className="mt-4 inline-block text-sm font-extrabold text-orange-600 underline">
              로그인하기
            </Link>
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
            채팅 목록을 불러오지 못했어요: {err}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center sm:py-24">
            <div className="mb-6 flex size-[5.75rem] items-center justify-center rounded-[2rem] bg-orange-50 shadow-inner ring-1 ring-orange-100/80" aria-hidden>
              <span className="text-5xl leading-none sm:text-6xl">💬</span>
            </div>
            <h2 className="max-w-md text-xl font-black tracking-tight text-slate-900 sm:text-2xl">아직 댕친과 나눈 대화가 없어요 🥺</h2>
            <p className="mt-3 max-w-sm text-sm font-semibold leading-relaxed text-slate-500">
              댕친 프로필을 연 뒤 채팅을 시작해 보세요.
            </p>
            <Link to="/explore" className="mt-10 w-full max-w-sm rounded-2xl bg-orange-500 px-8 py-4 text-center text-base font-extrabold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 active:scale-[0.98]">
              우리 동네 모임 둘러보기
            </Link>
          </div>
        ) : (
          chats.map((chat) => (
            <Link
              key={chat.id}
              to={`/chat/${chat.id}?name=${encodeURIComponent(chat.name)}`}
              className="flex items-center gap-4 p-4 bg-white rounded-3xl border border-slate-100 hover:shadow-md hover:border-orange-100 active:scale-[0.98] transition-all group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:from-orange-50 group-hover:to-yellow-50 transition-colors">
                {chat.avatar}
              </div>
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-extrabold text-base text-slate-800 group-hover:text-orange-600 transition-colors">{chat.name}</h3>
                  <span className="text-xs font-bold text-slate-400">{chat.timestamp}</span>
                </div>
                <p className="text-sm font-medium text-slate-500 truncate">{chat.lastMessage}</p>
              </div>
              {chat.unreadCount > 0 && (
                <div className="min-w-[1.5rem] h-6 px-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm shadow-orange-500/30">
                  <span className="text-white text-[11px] font-black tracking-tighter">{chat.unreadCount}</span>
                </div>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export function ChatDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fallbackName = searchParams.get('name')?.trim() || '댕친';
  const meetupContext = searchParams.get('meetup')?.trim();

  const [peerName, setPeerName] = useState(fallbackName);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const peerDisplayName = useMemo(() => peerName || fallbackName || '댕친', [peerName, fallbackName]);

  const loadMessages = useCallback(async () => {
    if (!user?.id || !id) {
      setMessages([]);
      setLoading(false);
      return;
    }
    const peerId = id.trim();
    if (!isAuthUserUuid(peerId)) {
      setErr('채팅 주소가 올바르지 않아요. 프로필·글에서 다시 열어 주세요.');
      setMessages([]);
      setLoading(false);
      return;
    }
    if (user.id === peerId) {
      setErr('자기 자신과는 채팅할 수 없어요.');
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from('messages')
      .select('id, created_at, sender_id, receiver_id, content, read')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(1000);
    if (error) {
      setErr(error.message);
      setMessages([]);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as DbMessage[];
    setMessages(
      rows.map((m) => ({
        id: m.id,
        text: m.content,
        isMine: m.sender_id === user.id,
        timestamp: formatTime(m.created_at),
      })),
    );
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', peerId)
      .eq('receiver_id', user.id)
      .eq('read', false);
    setLoading(false);
  }, [user?.id, id]);

  useEffect(() => {
    if (!id || !isAuthUserUuid(id.trim())) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.from('profiles').select('name').eq('id', id.trim()).maybeSingle();
      if (!cancelled) {
        const n = typeof data?.name === 'string' ? data.name.trim() : '';
        if (n) setPeerName(n);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    void loadMessages();
    setInputText('');
  }, [loadMessages]);

  useEffect(() => {
    if (!user?.id || !id || !isAuthUserUuid(id.trim())) return;
    const peerId = id.trim();
    const channel = supabase
      .channel(`chat-room-${user.id}-${peerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new as DbMessage;
          const isThisRoom =
            (row.sender_id === user.id && row.receiver_id === peerId) ||
            (row.sender_id === peerId && row.receiver_id === user.id);
          if (!isThisRoom) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                text: row.content,
                isMine: row.sender_id === user.id,
                timestamp: formatTime(row.created_at),
              },
            ];
          });
          if (row.sender_id === peerId) {
            void supabase.from('messages').update({ read: true }).eq('id', row.id);
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, id]);

  /** Realtime 누락/지연 대비: 채팅방은 더 촘촘히 재동기화 */
  useEffect(() => {
    if (!user?.id || !id || !isAuthUserUuid(id.trim())) return;
    const timer = window.setInterval(() => {
      void loadMessages();
    }, 2500);
    return () => window.clearInterval(timer);
  }, [user?.id, id, loadMessages]);

  const handleSend = async () => {
    if (!user?.id || !id || !inputText.trim()) return;
    const peerId = id.trim();
    if (!isAuthUserUuid(peerId)) {
      alert('보낼 수 없는 채팅 주소예요.');
      return;
    }
    if (user.id === peerId) {
      alert('자기 자신에게는 메시지를 보낼 수 없어요.');
      return;
    }
    const text = inputText.trim();
    setInputText('');
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: peerId,
        content: text,
        read: false,
      })
      .select('id, created_at, sender_id, receiver_id, content, read')
      .maybeSingle();
    if (error) {
      setErr(error.message);
      alert(`메시지를 보내지 못했어요.\n${error.message}`);
      setInputText(text);
      return;
    }
    if (data) {
      setErr(null);
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [
          ...prev,
          {
            id: data.id,
            text: data.content,
            isMine: true,
            timestamp: formatTime(data.created_at),
          },
        ];
      });
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col max-w-screen-md mx-auto shadow-[0_0_40px_rgba(0,0,0,0.02)]">
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-100 flex-shrink-0 z-10">
        <div className="px-2 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/chats'))}
              className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"
              aria-label="뒤로"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-sm flex-shrink-0">🐕</div>
              <h1 className="font-extrabold text-slate-800 text-base truncate">{peerDisplayName}</h1>
            </div>
          </div>
          <button className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {meetupContext && (
        <div className="flex-shrink-0 px-4 py-2 bg-orange-50/90 border-b border-orange-100 text-xs text-orange-900 font-medium">
          모임 글: <span className="font-extrabold">{meetupContext}</span>
        </div>
      )}

      {err && (
        <div className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
          채팅 오류: {err}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {authLoading || loading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-10 font-medium">첫 메시지를 내보세요 🐾</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}>
              <div className="flex flex-col gap-1 max-w-[75%]">
                <div className={`px-5 py-3 rounded-2xl ${
                  message.isMine
                    ? 'bg-gradient-to-br from-orange-500 to-yellow-500 text-white rounded-tr-sm shadow-sm shadow-orange-500/20'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm shadow-sm'
                }`}>
                  <p className="text-[15px] font-medium leading-relaxed">{message.text}</p>
                </div>
                <p className={`text-[11px] font-bold px-1 ${message.isMine ? 'text-slate-400 text-right' : 'text-slate-400 text-left'}`}>
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-white border-t border-slate-100 p-4 pb-safe flex-shrink-0">
        {user && (
          <div className="mb-2 flex justify-start">
            <AiDoumiButton
              task="chat_reply"
              className="text-[10px]"
              payload={{
                peerName: peerDisplayName,
                transcript: messages
                  .slice(-12)
                  .map((m) => `${m.isMine ? '나' : peerDisplayName}: ${m.text}`)
                  .join('\n'),
              }}
              onDone={(r) => {
                if (!r.ok) {
                  alert(r.error);
                  return;
                }
                setInputText((prev) => (prev.trim() ? `${prev.trim()}\n${r.text}` : r.text));
              }}
            >
              답장 초안
            </AiDoumiButton>
          </div>
        )}
        <div className="flex items-center gap-2 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="메시지 보내기..."
            className="flex-1 pl-5 pr-12 h-12 bg-slate-50/80 border-transparent focus:border-orange-500 focus:bg-white rounded-full focus:ring-4 focus:ring-orange-500/10 transition-all text-slate-900 font-medium placeholder:text-slate-400"
          />
          <button
            onClick={() => void handleSend()}
            disabled={!inputText.trim() || !user || !id || !isAuthUserUuid(id.trim()) || user.id === id.trim()}
            className="absolute right-1.5 w-9 h-9 bg-orange-500 disabled:bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4 text-white ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}