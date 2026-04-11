import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, MapPin, Clock, User, Star, ShieldCheck } from 'lucide-react';
import { mockMeetups, mockJoinRequests, mockDogSitters } from '../data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { calculateDistance, formatDistance } from '../utils/distance';
import { Link } from 'react-router';
import { useState } from 'react';

export function MeetupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meetup = mockMeetups.find((r) => r.id === id);
  const joinRequests = mockJoinRequests.filter((q) => q.meetupId === id);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  if (!meetup) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500" style={{ fontWeight: 500 }}>🐕 모임을 찾을 수 없습니다</p>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(meetup.createdAt, { addSuffix: true, locale: ko });

  const statusText = { pending: '모집중', 'in-progress': '진행중', completed: '완료' };
  const statusColor = {
    pending: 'bg-orange-100 text-orange-700',
    'in-progress': 'bg-emerald-100 text-emerald-700',
    completed: 'bg-slate-100 text-slate-600',
  };

  const sortedRequests = [...joinRequests].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const recommendedSitters = mockDogSitters
    .filter((sitter) => sitter.specialties.includes(meetup.category))
    .map((sitter) => ({ ...sitter, distance: calculateDistance(meetup.district, sitter.district) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  const handleAccept = (requestId: string) => {
    setSelectedRequestId(requestId);
    setTimeout(() => {
      alert('🐾 참여 확정! 댕친과 즐거운 시간 보내세요!');
      navigate('/my');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 글래스모피즘 헤더 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center h-14 px-2 max-w-screen-md mx-auto">
          <button type="button" onClick={() => navigate('/explore')} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors" aria-label="메인으로">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="ml-2 text-slate-800 text-lg" style={{ fontWeight: 700 }}>모임 상세 🐾</span>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto px-5 py-6">
        {/* 1. 모임 정보 */}
        <div className="mb-10">
          {meetup.images && meetup.images.length > 0 && (
            <div className="aspect-[4/3] bg-slate-100 rounded-[2rem] overflow-hidden mb-6 shadow-sm">
              <img src={meetup.images[0]} alt={meetup.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-3 py-1.5 rounded-xl ${statusColor[meetup.status]}`} style={{ fontWeight: 800 }}>
              {statusText[meetup.status]}
            </span>
            <span className="text-xs text-slate-400" style={{ fontWeight: 700 }}>{meetup.category}</span>
          </div>

          <h1 className="text-2xl text-slate-900 mb-4 leading-tight tracking-tight" style={{ fontWeight: 800 }}>
            {meetup.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-slate-500 mb-6" style={{ fontWeight: 500 }}>
            <div className="flex items-center gap-1.5"><User className="w-4 h-4" /><span>{meetup.userName}</span></div>
            <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /><span>{meetup.district}</span></div>
            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /><span>{timeAgo}</span></div>
          </div>

          <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 text-slate-700 leading-relaxed" style={{ fontWeight: 500 }}>
            {meetup.description}
          </div>
        </div>

        {/* 2. 받은 참여 신청 */}
        {joinRequests.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl text-slate-900" style={{ fontWeight: 800 }}>🐾 참여 신청</h2>
              <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-xl text-sm" style={{ fontWeight: 700 }}>
                총 {joinRequests.length}명
              </span>
            </div>
            
            <div className="space-y-4">
              {sortedRequests.map((request, index) => {
                const sitter = mockDogSitters.find(r => r.name === request.dogSitterName);
                const isFirst = index === 0;
                const isSelected = selectedRequestId === request.id;

                return (
                  <div key={request.id} className={`relative rounded-3xl p-5 transition-all ${isSelected ? 'border-2 border-emerald-500 bg-emerald-50 shadow-sm' : isFirst ? 'border-2 border-orange-500 bg-orange-50/30 shadow-md shadow-orange-500/10' : 'border border-slate-200 bg-white hover:border-orange-200 hover:shadow-sm'}`}>
                      
                      {isFirst && !isSelected && (
                        <div className="absolute -top-3 right-5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-[10px] px-3 py-1 rounded-full shadow-sm" style={{ fontWeight: 800 }}>
                          🐾 첫 신청
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${isFirst ? 'bg-orange-500 text-white shadow-inner' : 'bg-slate-100 text-slate-500'}`} style={{ fontWeight: 900 }}>
                            🐕
                          </div>
                          <div>
                            <h3 className="text-slate-800 text-lg flex items-center gap-1" style={{ fontWeight: 800 }}>
                              {request.dogSitterName} <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            </h3>
                            {sitter && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5" style={{ fontWeight: 500 }}>
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="text-amber-600" style={{ fontWeight: 700 }}>{sitter.rating}</span>
                                <span>({sitter.reviewCount})</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl tracking-tight ${isFirst ? 'text-orange-600' : 'text-slate-800'}`} style={{ fontWeight: 900 }}>
                            {request.estimatedCost}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5" style={{ fontWeight: 500 }}>{request.estimatedDuration} 소요</div>
                        </div>
                      </div>

                      <div className="bg-white/60 backdrop-blur-sm border border-slate-100 rounded-2xl p-4 mb-4 text-sm text-slate-600" style={{ fontWeight: 500 }}>
                        "{request.message}"
                      </div>

                      {!isSelected && meetup.status === 'pending' && (
                        <div className="flex gap-3">
                          <Link to={`/sitter/${sitter?.id}`} className="flex-1 py-3.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-2xl text-center text-slate-600 transition-colors" style={{ fontWeight: 700 }}>
                            프로필 보기
                          </Link>
                          <button onClick={() => handleAccept(request.id)} className={`flex-[2] py-3.5 rounded-2xl text-white transition-all active:scale-[0.98] ${isFirst ? 'bg-gradient-to-r from-orange-500 to-yellow-500 shadow-md shadow-orange-500/20' : 'bg-slate-800 hover:bg-slate-900'}`} style={{ fontWeight: 700 }}>
                            함께하기 🐾
                          </button>
                        </div>
                      )}

                      {isSelected && (
                        <div className="bg-emerald-500 text-white py-3.5 rounded-2xl text-center flex items-center justify-center gap-2" style={{ fontWeight: 800 }}>
                          ✓ 수락 완료되었습니다
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. 추천 댕친 */}
        {recommendedSitters.length > 0 && meetup.status === 'pending' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl text-slate-900" style={{ fontWeight: 800 }}>🐾 근처 댕친들</h2>
            </div>
            
            <div className="space-y-4">
              {recommendedSitters.map((sitter, index) => {
                const hasJoined = joinRequests.some(q => q.dogSitterName === sitter.name);
                const isVeryClose = sitter.distance < 2;
                
                return (
                  <div key={sitter.id} className={`rounded-3xl p-5 transition-all ${hasJoined ? 'border border-emerald-200 bg-emerald-50/30' : 'border border-slate-200 bg-white hover:border-orange-200 hover:shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${index === 0 ? 'bg-gradient-to-br from-orange-100 to-yellow-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`} style={{ fontWeight: 900 }}>
                          {index + 1}위
                        </div>
                        <div>
                          <h3 className="text-slate-800 text-base" style={{ fontWeight: 800 }}>{sitter.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1" style={{ fontWeight: 500 }}>
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-amber-600" style={{ fontWeight: 700 }}>{sitter.rating}</span>
                            <span>• {sitter.experience}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 ${isVeryClose ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-500'}`} style={{ fontWeight: 700 }}>
                        <MapPin className="w-3 h-3" />
                        {formatDistance(sitter.distance)}
                      </div>
                    </div>

                    {hasJoined ? (
                      <div className="bg-emerald-50 text-emerald-600 py-3 rounded-2xl text-center text-sm border border-emerald-100" style={{ fontWeight: 700 }}>
                        ✓ 이미 신청한 댕친입니다
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Link to={`/sitter/${sitter.id}`} className="flex-1 py-3 border border-slate-200 bg-white hover:bg-slate-50 rounded-2xl text-center text-sm text-slate-600 transition-colors" style={{ fontWeight: 700 }}>
                          프로필
                        </Link>
                        <button onClick={() => alert(`${sitter.name}님에게 초대 보냄!`)} className={`flex-1 py-3 rounded-2xl text-sm text-white transition-all active:scale-[0.98] ${isVeryClose ? 'bg-orange-500 shadow-md shadow-orange-500/20' : 'bg-slate-800'}`} style={{ fontWeight: 700 }}>
                          초대하기
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Backward compatibility
export { MeetupDetailPage as RequestDetailPage };