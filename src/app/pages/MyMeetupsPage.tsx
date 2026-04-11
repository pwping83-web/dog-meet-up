import { Link } from 'react-router';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { mockMeetups } from '../data/mockData';

export function MyMeetupsPage() {
  const myMeetups = mockMeetups.filter(req => req.userId === 'user1');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-100" style={{ fontWeight: 700 }}>⏱️ 대기중</span>;
      case 'in-progress':
        return <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-100" style={{ fontWeight: 700 }}>🐾 진행중</span>;
      case 'completed':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-100" style={{ fontWeight: 700 }}>✅ 완료</span>;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '신청 대기중';
      case 'in-progress': return '모임 진행중';
      case 'completed': return '모임 완료됨';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      <header className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-slate-100 z-50">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-md mx-auto">
          <Link to="/my" className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg text-slate-800" style={{ fontWeight: 800 }}>내 모임</h1>
        </div>
      </header>

      <div className="max-w-screen-md mx-auto p-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
            <p className="text-2xl text-orange-600 mb-1" style={{ fontWeight: 900 }}>{myMeetups.length}</p>
            <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>전체</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
            <p className="text-2xl text-amber-600 mb-1" style={{ fontWeight: 900 }}>
              {myMeetups.filter(r => r.status === 'pending').length}
            </p>
            <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>대기중</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
            <p className="text-2xl text-emerald-600 mb-1" style={{ fontWeight: 900 }}>
              {myMeetups.filter(r => r.status === 'completed').length}
            </p>
            <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>완료</p>
          </div>
        </div>

        {myMeetups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-5">
              <MessageCircle className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-600 text-lg mb-2" style={{ fontWeight: 700 }}>작성한 모임이 없어요</p>
            <p className="text-sm text-slate-400 mb-6" style={{ fontWeight: 500 }}>우리 동네 댕친 모임을 만들어보세요</p>
            <Link to="/create-meetup" className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-2xl text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all" style={{ fontWeight: 700 }}>
              모임 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myMeetups.map((meetup) => (
              <Link key={meetup.id} to={`/meetup/${meetup.id}`} className="block group">
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all active:scale-[0.98]">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-base text-slate-800 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors" style={{ fontWeight: 800 }}>
                        {meetup.title}
                      </h3>
                      <p className="text-xs text-slate-500 mb-3" style={{ fontWeight: 500 }}>
                        {meetup.district} · {new Date(meetup.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    {getStatusBadge(meetup.status)}
                  </div>

                  {meetup.images && meetup.images.length > 0 && (
                    <div className="mb-4">
                      <img src={meetup.images[0]} alt={meetup.title} className="w-full h-40 object-cover rounded-2xl" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-400 mb-1" style={{ fontWeight: 700 }}>일정</p>
                      <p className="text-lg text-orange-600" style={{ fontWeight: 800 }}>
                        {meetup.estimatedCost || '참여 신청'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-1" style={{ fontWeight: 700 }}>상태</p>
                      <p className="text-sm text-slate-700" style={{ fontWeight: 700 }}>
                        {getStatusText(meetup.status)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Backward compatibility
export { MyMeetupsPage as MyRequestsPage };