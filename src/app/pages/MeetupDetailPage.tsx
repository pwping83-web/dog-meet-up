import { useParams, useNavigate, useLocation, Link } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPin, Clock, User, Star, ShieldCheck, Flag } from 'lucide-react';
import { mockMeetups, mockJoinRequests, mockDogSitters } from '../data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { calculateDistance, formatDistance } from '../utils/distance';
import { getMergedMeetups } from '../../lib/userMeetupsStore';
import { useAuth } from '../../contexts/AuthContext';
import { setAuthReturnPath } from '../components/AuthReturnRedirect';
import {
  getBreedingLeakInNonBreedingPost,
  shouldSuggestBreedingMislabelReport,
} from '../utils/breedingContentGuard';
import { AiDoumiButton } from '../components/AiDoumiButton';
import { MEETUP_DETAIL_FOOTNOTE } from '../../lib/platformLegalCopy';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { meetupCoverImageUrl, resolveDogSitterPortraitUrl, virtualDogPhotoForSeed } from '../data/virtualDogPhotos';

export function MeetupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [meetupFeedTick, setMeetupFeedTick] = useState(0);
  useEffect(() => {
    const onMeetups = () => setMeetupFeedTick((t) => t + 1);
    window.addEventListener('daeng-user-meetups-changed', onMeetups);
    return () => window.removeEventListener('daeng-user-meetups-changed', onMeetups);
  }, []);

  const meetup = useMemo(
    () => (id ? getMergedMeetups(mockMeetups).find((r) => r.id === id) : undefined),
    [id, meetupFeedTick, location.key],
  );
  const joinRequests = mockJoinRequests.filter((q) => q.meetupId === id);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [joinAiSummary, setJoinAiSummary] = useState<string | null>(null);

  if (!meetup) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500" style={{ fontWeight: 500 }}>🐕 모임을 찾을 수 없습니다</p>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(meetup.createdAt, { addSuffix: true, locale: ko });

  const breedingMislabelHint = shouldSuggestBreedingMislabelReport(
    meetup.category,
    meetup.title,
    meetup.description,
  );
  const breedingLeakLabel = getBreedingLeakInNonBreedingPost(meetup.title, meetup.description);

  const statusText = { pending: '모집중', 'in-progress': '진행중', completed: '완료' };
  const statusColor = {
    pending: 'bg-orange-100 text-orange-700',
    'in-progress': 'bg-orange-100 text-orange-700',
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

  const requireLoginForAction = () => {
    if (authLoading) return false;
    if (!user) {
      setAuthReturnPath(`${location.pathname}${location.search}`);
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleAccept = (requestId: string) => {
    if (!requireLoginForAction()) return;
    setSelectedRequestId(requestId);
    setTimeout(() => {
      alert('🐾 참여 확정! 댕친과 즐거운 시간 보내세요!');
      navigate('/my');
    }, 500);
  };

  const handleInvite = (sitter: { id: string; name: string }) => {
    if (!requireLoginForAction()) return;
    const params = new URLSearchParams({
      name: sitter.name,
      meetup: meetup.title,
      mid: meetup.id,
    });
    navigate(`/chat/${encodeURIComponent(sitter.id)}?${params.toString()}`);
  };

  const openReport = () => {
    if (!requireLoginForAction()) return;
    setReportOpen(true);
  };

  const submitReport = (reason: string) => {
    setReportOpen(false);
    console.info('[댕댕마켓] 글 신고 접수(데모)', { meetupId: meetup.id, reason });
    alert(
      '신고가 접수되었습니다. 검토 후 필요하면 조치할 예정이에요. 이용에 도움 주셔서 감사합니다 🐾',
    );
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 글래스모피즘 헤더 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center h-14 px-2 max-w-screen-md mx-auto">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/explore'))}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="뒤로"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="ml-2 text-slate-800 text-lg" style={{ fontWeight: 700 }}>만남 상세 🐾</span>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto px-5 py-6">
        {!authLoading && !user && (
          <p className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-amber-950">
            글은 모두 볼 수 있어요. <strong className="font-extrabold">함께하기</strong>·<strong className="font-extrabold">채팅하기</strong>는{' '}
            <Link
              to="/login"
              onClick={() => setAuthReturnPath(`${location.pathname}${location.search}`)}
              className="font-extrabold text-brand underline underline-offset-2"
            >
              로그인
            </Link>
            후에만 가능해요.
          </p>
        )}

        {/* 1. 모임 정보 */}
        <div className="mb-10">
          <div className="aspect-[4/3] bg-slate-100 rounded-[2rem] overflow-hidden mb-6 shadow-sm">
            <ImageWithFallback
              src={meetupCoverImageUrl(meetup)}
              fallbackSrc={virtualDogPhotoForSeed(`meetup-detail-fallback-${meetup.id}`)}
              alt={meetup.title}
              className="h-full w-full object-cover"
            />
          </div>

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

          <p className="mt-3 text-[11px] font-medium leading-relaxed text-slate-500">{MEETUP_DETAIL_FOOTNOTE}</p>

          {breedingMislabelHint && (
            <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-950">
              자동 검사: 이 글 주제(<strong className="font-extrabold">{meetup.category}</strong>)에는 보통{' '}
              {breedingLeakLabel ? (
                <span className="font-extrabold">{breedingLeakLabel}</span>
              ) : (
                '교배·번식'
              )}{' '}
              표현이 어울리지 않을 수 있어요. 위반으로 보이면 아래에서 신고해 주세요.
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openReport}
              disabled={authLoading}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
            >
              <Flag className="h-4 w-4 text-rose-500" aria-hidden />
              이 글 신고하기
            </button>
          </div>

          {meetup.category === '돌봄' && (
            <Link
              to="/sitters?view=care&care=sitter"
              className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-orange-200/80 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 px-4 py-3 text-sm font-extrabold text-orange-600 transition-colors hover:from-orange-100 hover:via-amber-100 hover:to-yellow-100"
            >
              인증 댕집사(방문)·인증 보호맘(맡기기) 보기 →
            </Link>
          )}
        </div>

        {/* 2. 받은 참여 신청 */}
        {joinRequests.length > 0 && (
          <div className="mb-12">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl text-slate-900" style={{ fontWeight: 800 }}>🐾 참여 신청</h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-xl text-sm" style={{ fontWeight: 700 }}>
                  총 {joinRequests.length}명
                </span>
                {user && (
                  <AiDoumiButton
                    task="join_summarize"
                    className="text-[10px]"
                    payload={{
                      items: sortedRequests.map((q) => ({
                        name: q.dogSitterName,
                        message: q.message,
                        cost: q.estimatedCost,
                      })),
                    }}
                    onDone={(r) => {
                      if (!r.ok) {
                        alert(r.error);
                        return;
                      }
                      setJoinAiSummary(r.text);
                    }}
                  >
                    신청 AI 요약
                  </AiDoumiButton>
                )}
              </div>
            </div>
            {joinAiSummary && (
              <div className="mb-4 rounded-2xl border border-violet-100 bg-violet-50/90 p-4 text-sm font-medium leading-relaxed text-slate-800 whitespace-pre-wrap">
                {joinAiSummary}
              </div>
            )}

            <div className="space-y-4">
              {sortedRequests.map((request, index) => {
                const sitter = mockDogSitters.find(r => r.name === request.dogSitterName);
                const isFirst = index === 0;
                const isSelected = selectedRequestId === request.id;

                return (
                  <div key={request.id} className={`relative rounded-3xl p-5 transition-all ${isSelected ? 'border-2 border-orange-500 bg-orange-50 shadow-sm' : isFirst ? 'border-2 border-orange-500 bg-orange-50/30 shadow-md shadow-orange-500/10' : 'border border-slate-200 bg-white hover:border-orange-200 hover:shadow-sm'}`}>
                      
                      {isFirst && !isSelected && (
                        <div className="absolute -top-3 right-5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-[10px] px-3 py-1 rounded-full shadow-sm" style={{ fontWeight: 800 }}>
                          🐾 첫 신청
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div
                            className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 shadow-inner ${
                              isFirst ? 'border-orange-200 bg-orange-50' : 'border-slate-100 bg-slate-50'
                            }`}
                          >
                            <ImageWithFallback
                              src={
                                sitter
                                  ? resolveDogSitterPortraitUrl(sitter)
                                  : virtualDogPhotoForSeed(`join-req-${request.id}`)
                              }
                              fallbackSrc={virtualDogPhotoForSeed(`join-req-fallback-${request.id}`)}
                              alt={request.dogSitterName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-slate-800 text-lg flex items-center gap-1" style={{ fontWeight: 800 }}>
                              {request.dogSitterName} <ShieldCheck className="w-4 h-4 text-orange-500" />
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
                          <Link
                            to={`/sitter/${sitter?.id}`}
                            className="flex-1 rounded-2xl border-2 border-slate-300 bg-white py-3.5 text-center text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 underline decoration-slate-500 decoration-2 underline-offset-4"
                            style={{ fontWeight: 700 }}
                          >
                            프로필 보기
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleAccept(request.id)}
                            disabled={authLoading}
                            className={`flex-[2] py-3.5 rounded-2xl text-white transition-all active:scale-[0.98] disabled:opacity-50 ${isFirst ? 'bg-gradient-to-r from-orange-500 to-yellow-500 shadow-md shadow-orange-500/20' : 'bg-slate-800 hover:bg-slate-900'}`}
                            style={{ fontWeight: 700 }}
                          >
                            함께하기 🐾
                          </button>
                        </div>
                      )}

                      {isSelected && (
                        <div className="bg-orange-500 text-white py-3.5 rounded-2xl text-center flex items-center justify-center gap-2" style={{ fontWeight: 800 }}>
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
                  <div key={sitter.id} className={`rounded-3xl p-5 transition-all ${hasJoined ? 'border border-orange-200 bg-orange-50/30' : 'border border-slate-200 bg-white hover:border-orange-200 hover:shadow-sm'}`}>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 shadow-sm">
                          <ImageWithFallback
                            src={resolveDogSitterPortraitUrl(sitter)}
                            fallbackSrc={virtualDogPhotoForSeed(`nearby-sitter-fallback-${sitter.id}`)}
                            alt={sitter.name}
                            className="h-full w-full object-cover"
                          />
                          <span
                            className="absolute -bottom-0.5 -right-0.5 rounded-md bg-orange-500 px-1 py-0.5 text-[9px] leading-none text-white shadow-sm"
                            style={{ fontWeight: 900 }}
                          >
                            {index + 1}위
                          </span>
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <h3 className="text-base text-slate-800" style={{ fontWeight: 800 }}>
                            {sitter.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500" style={{ fontWeight: 500 }}>
                            <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                            <span className="text-amber-600" style={{ fontWeight: 700 }}>
                              {sitter.rating}
                            </span>
                            <span>• {sitter.experience}</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-xs ${
                          isVeryClose ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-500'
                        }`}
                        style={{ fontWeight: 700 }}
                      >
                        <MapPin className="h-3 w-3 shrink-0" />
                        {formatDistance(sitter.distance)}
                      </div>
                    </div>

                    {hasJoined ? (
                      <div className="bg-orange-50 text-orange-600 py-3 rounded-2xl text-center text-sm border border-orange-100" style={{ fontWeight: 700 }}>
                        ✓ 이미 신청한 댕친입니다
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Link
                          to={`/sitter/${sitter.id}`}
                          className="flex-1 rounded-2xl border-2 border-slate-300 bg-white py-3 text-center text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 underline decoration-slate-500 decoration-2 underline-offset-4"
                          style={{ fontWeight: 700 }}
                        >
                          프로필
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleInvite({ id: sitter.id, name: sitter.name })}
                          disabled={authLoading}
                          className={`flex-1 rounded-2xl py-3 text-sm text-white transition-all active:scale-[0.98] disabled:opacity-50 ${isVeryClose ? 'bg-orange-500 shadow-md shadow-orange-500/20' : 'bg-slate-800'}`}
                          style={{ fontWeight: 700 }}
                        >
                          채팅하기
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

      {reportOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onClick={() => setReportOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-dialog-title"
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="report-dialog-title" className="text-base font-extrabold text-slate-900">
              신고 사유 선택
            </h3>
            <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">
              무료·다른 주제 글에 교배·번식 내용이 숨겨진 경우 운영에서 확인할 수 있어요.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => submitReport('free_post_breeding_content')}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-bold transition-colors ${
                  breedingMislabelHint
                    ? 'border-2 border-amber-400 bg-amber-50 text-amber-950'
                    : 'border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                {breedingMislabelHint ? '⚠️ ' : ''}무료·다른 주제인데 교배·번식 표현이 있습니다
              </button>
              <button
                type="button"
                onClick={() => submitReport('spam_or_abuse')}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                욕설·광고·기타 부적절
              </button>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="mt-1 rounded-2xl py-2.5 text-center text-xs font-bold text-slate-500"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Backward compatibility
export { MeetupDetailPage as RequestDetailPage };