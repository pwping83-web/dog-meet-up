// src/app/pages/ChatsPage.tsx 전체 교체
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, Send, Settings2, MoreVertical } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar: string;
}

const mockChats: Chat[] = [
  { id: '1', name: '강아지엄마', lastMessage: '네 내일 오전 10시에 만나요!', timestamp: '5분 전', unreadCount: 2, avatar: '🐕' },
  { id: '2', name: '댕댕산책러버', lastMessage: '산책 장소 확인했습니다. 공원 어때요?', timestamp: '1시간 전', unreadCount: 0, avatar: '🐾' },
  { id: '3', name: '훈련전문가', lastMessage: '모임 시간 변경 가능할까요?', timestamp: '어제', unreadCount: 1, avatar: '🎓' },
  { id: '4', name: '골든러버', lastMessage: '사진 몇 장만 더 보내주실 수 있나요?', timestamp: '2일 전', unreadCount: 0, avatar: '🦮' },
];

export function ChatsPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* 글래스모피즘 헤더 */}
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

      {/* 채팅 목록 */}
      <div className="max-w-screen-md mx-auto p-4 space-y-3">
        {mockChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-5">
              <span className="text-4xl">💬</span>
            </div>
            <p className="text-slate-600 font-bold text-lg mb-2">아직 채팅이 없어요</p>
            <p className="text-sm text-slate-400 font-medium mb-8">댕친들과 첫 대화를 시작해보세요 🐾</p>
            <Link to="/sitters" className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-8 py-4 rounded-2xl font-bold shadow-md shadow-orange-500/20 active:scale-95 transition-all">
              우리 동네 댕친 찾기
            </Link>
          </div>
        ) : (
          mockChats.map((chat) => (
            <Link
              key={chat.id}
              to={`/chat/${chat.id}`}
              className="flex items-center gap-4 p-4 bg-white rounded-3xl border border-slate-100 hover:shadow-md hover:border-orange-100 active:scale-[0.98] transition-all group"
            >
              {/* 스쿼클 아바타 */}
              <div className="w-14 h-14 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:from-orange-50 group-hover:to-yellow-50 transition-colors">
                {chat.avatar}
              </div>

              {/* 내용 */}
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-extrabold text-base text-slate-800 group-hover:text-orange-600 transition-colors">{chat.name}</h3>
                  <span className="text-xs font-bold text-slate-400">{chat.timestamp}</span>
                </div>
                <p className="text-sm font-medium text-slate-500 truncate">{chat.lastMessage}</p>
              </div>

              {/* 안읽음 배지 */}
              {chat.unreadCount > 0 && (
                <div className="min-w-[1.5rem] h-6 px-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm shadow-orange-500/30">
                  <span className="text-white text-[11px] font-black tracking-tighter">
                    {chat.unreadCount}
                  </span>
                </div>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

interface Message {
  id: string;
  text: string;
  isMine: boolean;
  timestamp: string;
}

const LEGACY_DEMO_CHAT_IDS = new Set(['1', '2', '3', '4']);

const LEGACY_DEMO_MESSAGES: Message[] = [
  { id: '1', text: '안녕하세요! 내일 산책 모임 참여 가능할까요?', isMine: true, timestamp: '오전 10:23' },
  { id: '2', text: '네 안녕하세요! 물론이죠! 몇 시가 괜찮으세요?', isMine: false, timestamp: '오전 10:24' },
  { id: '3', text: '오전 10시 어떠세요? 우리 강아지 산책 시간이어서요', isMine: true, timestamp: '오전 10:25' },
  { id: '4', text: '네 좋아요! 한강공원에서 만나요 🐾', isMine: false, timestamp: '오전 10:26' },
];

const LEGACY_PEER_NAMES: Record<string, string> = {
  '1': '강아지엄마',
  '2': '댕댕산책러버',
  '3': '훈련전문가',
  '4': '골든러버',
};

export function ChatDetailPage() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const peerDisplayName =
    searchParams.get('name')?.trim() || LEGACY_PEER_NAMES[id] || '댕친';
  const meetupContext = searchParams.get('meetup')?.trim();

  const [messages, setMessages] = useState<Message[]>(() =>
    LEGACY_DEMO_CHAT_IDS.has(id) ? [...LEGACY_DEMO_MESSAGES] : [],
  );
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    setMessages(LEGACY_DEMO_CHAT_IDS.has(id) ? [...LEGACY_DEMO_MESSAGES] : []);
    setInputText('');
  }, [id]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isMine: true,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col max-w-screen-md mx-auto shadow-[0_0_40px_rgba(0,0,0,0.02)]">
      {/* 헤더 */}
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
              <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-sm flex-shrink-0">
                🐕
              </div>
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

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10 font-medium">
            첫 메시지를 내보세요 🐾
          </p>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}>
            <div className="flex flex-col gap-1 max-w-[75%]">
              <div className={`px-5 py-3 rounded-2xl ${
                  message.isMine
                    ? 'bg-gradient-to-br from-orange-500 to-yellow-500 text-white rounded-tr-sm shadow-sm shadow-orange-500/20'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm shadow-sm'
                }`}
              >
                <p className="text-[15px] font-medium leading-relaxed">{message.text}</p>
              </div>
              <p className={`text-[11px] font-bold px-1 ${message.isMine ? 'text-slate-400 text-right' : 'text-slate-400 text-left'}`}>
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 입력 영역 */}
      <div className="bg-white border-t border-slate-100 p-4 pb-safe flex-shrink-0">
        <div className="flex items-center gap-2 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="메시지 보내기..."
            className="flex-1 pl-5 pr-12 h-12 bg-slate-50/80 border-transparent focus:border-orange-500 focus:bg-white rounded-full focus:ring-4 focus:ring-orange-500/10 transition-all text-slate-900 font-medium placeholder:text-slate-400"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="absolute right-1.5 w-9 h-9 bg-orange-500 disabled:bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4 text-white ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}