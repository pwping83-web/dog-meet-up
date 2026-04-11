import { Link } from 'react-router';
import { ArrowLeft, MessageCircle, Clock, User } from 'lucide-react';
import { mockJoinRequests, mockMeetups } from '../data/mockData';

export function MyJoinRequestsPage() {
  const myMeetupIds = mockMeetups.filter(req => req.userId === 'user1').map(req => req.id);
  const myJoinRequests = mockJoinRequests.filter(jr => myMeetupIds.includes(jr.meetupId));

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      <header className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-slate-100 z-50">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-md mx-auto">
          <Link to="/my" className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg text-slate-800" style={{ fontWeight: 800 }}>받은 참여 신청</h1>
        </div>
      </header>

      <div className="max-w-screen-md mx-auto p-4">
        <div className="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-3xl p-6 mb-6 text-white shadow-lg shadow-orange-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-orange-100 mb-1" style={{ fontWeight: 700 }}>총 받은 신청</p>
              <p className="text-4xl" style={{ fontWeight: 900 }}>{myJoinRequests.length}건</p>
            </div>
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-8 h-8" />
            </div>
          </div>
          <p className="text-xs text-orange-100" style={{ fontWeight: 500 }}>
            💡 여러 신청을 비교하고 최적의 댕친을 선택하세요
          </p>
        </div>

        {myJoinRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-5">
              <MessageCircle className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-600 text-lg mb-2" style={{ fontWeight: 700 }}>받은 신청이 없어요</p>
            <p className="text-sm text-slate-400 mb-6 text-center" style={{ fontWeight: 500 }}>
              모임을 만들면<br />
              이웃 댕친들이 참여 신청을 보내드려요
            </p>
            <Link to="/create-meetup" className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-2xl text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all" style={{ fontWeight: 700 }}>
              모임 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myJoinRequests.map((jr) => {
              const meetup = mockMeetups.find(r => r.id === jr.meetupId);
              
              return (
                <div 
                  key={jr.id}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all"
                >
                  <Link to={`/meetup/${jr.meetupId}`} className="block mb-4 pb-4 border-b border-slate-100">
                    <p className="text-xs text-slate-400 mb-1" style={{ fontWeight: 700 }}>모임</p>
                    <h3 className="text-sm text-slate-800 hover:text-orange-600 transition-colors" style={{ fontWeight: 700 }}>
                      {meetup?.title}
                    </h3>
                  </Link>

                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-yellow-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <Link to={`/sitter/${jr.dogSitterId}`} className="text-base text-slate-800 hover:text-orange-600 transition-colors" style={{ fontWeight: 800 }}>
                        {jr.dogSitterName}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500" style={{ fontWeight: 500 }}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(jr.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                    <p className="text-sm text-slate-700 leading-relaxed" style={{ fontWeight: 500 }}>
                      {jr.message}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 text-center">
                      <p className="text-xs text-orange-600 mb-1" style={{ fontWeight: 700 }}>참여 메시지</p>
                      <p className="text-xl text-orange-700" style={{ fontWeight: 900 }}>{jr.estimatedCost}</p>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-center">
                      <p className="text-xs text-emerald-600 mb-1" style={{ fontWeight: 700 }}>가능 일정</p>
                      <p className="text-xl text-emerald-700" style={{ fontWeight: 900 }}>{jr.estimatedDuration}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                    <Link 
                      to="/chats"
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-2xl text-sm text-center transition-colors"
                      style={{ fontWeight: 700 }}
                    >
                      💬 채팅하기
                    </Link>
                    <button className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 rounded-2xl text-sm shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all" style={{ fontWeight: 700 }}>
                      ✅ 신청 수락
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Backward compatibility
export { MyJoinRequestsPage as MyQuotesPage };