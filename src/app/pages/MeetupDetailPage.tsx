import { useParams, useNavigate, useLocation, Link } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPin, Clock, User, Star, ShieldCheck, Flag, PencilLine, Trash2, Shield, UserPlus } from 'lucide-react';
import { mockMeetups, mockJoinRequests, mockDogSitters } from '../data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { calculateDistance, formatDistance } from '../utils/distance';
import { adminDeleteMeetupById, adminSaveMeetupPatch, getMergedMeetups } from '../../lib/userMeetupsStore';
import { isAppAdmin } from '../../lib/appAdmin';
import { useAuth } from '../../contexts/AuthContext';
import { setAuthReturnPath } from '../components/AuthReturnRedirect';
import {
  getBreedingLeakInNonBreedingPost,
  shouldSuggestBreedingMislabelReport,
} from '../utils/breedingContentGuard';
import { AiDoumiButton } from '../components/AiDoumiButton';
import { MEETUP_DETAIL_FOOTNOTE } from '../../lib/platformLegalCopy';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  displayPublicDolbomMeetupDescription,
  displayPublicDolbomMeetupTitle,
  meetupCoverImageUrl,
  resolveDogSitterPortraitUrl,
  virtualDogPhotoForSeed,
} from '../data/virtualDogPhotos';
import { isCareMeetupCategory } from '../utils/meetupCategory';
import type { Meetup } from '../types';
import { isAuthUserUuid } from '../../lib/profileIds';
import { displayNameFromUser } from '../../lib/ensurePublicProfile';
import { supabase } from '../../lib/supabase';
import {
  certifiedProviderMatchesNeed,
  parseCareNeedTargetFromEstimatedCost,
  type CertifiedCareRole,
} from '../utils/careNeedFromMeetup';

const ADMIN_MEETUP_CATEGORIES = [
  '공원·장소 모임',
  '산책·놀이',
  '카페·체험',
  '훈련·사회화',
  '1:1 만남',
  '교배',
  '실종',
  '돌봄',
] as const;

type MeetupComment = {
  id: string;
  meetupId: string;
  authorId?: string;
  authorName: string;
  text: string;
  createdAt: string;
};

const MEETUP_COMMENTS_STORAGE_KEY = 'daeng-meetup-comments-v1';

function readMeetupCommentsMap(): Record<string, MeetupComment[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(MEETUP_COMMENTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, MeetupComment[]>;
  } catch {
    return {};
  }
}

function writeMeetupCommentsMap(map: Record<string, MeetupComment[]>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MEETUP_COMMENTS_STORAGE_KEY, JSON.stringify(map));
}

function maskPhoneLast4(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '';
  return `휴대폰 ···${digits.slice(-4)}`;
}

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
  const careNeedTarget = useMemo(() => {
    if (!meetup || !isCareMeetupCategory(meetup.category)) return null;
    return parseCareNeedTargetFromEstimatedCost(meetup.estimatedCost);
  }, [meetup]);
  /** 돌봄 글: 인증 provider_kind (null=미인증·미등록, undefined=조회 전) */
  const [myCareCertifiedRole, setMyCareCertifiedRole] = useState<CertifiedCareRole | null | undefined>(undefined);
  const joinRequests = mockJoinRequests.filter((q) => q.meetupId === id);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [joinAiSummary, setJoinAiSummary] = useState<string | null>(null);
  const [adminEditOpen, setAdminEditOpen] = useState(false);
  const [comments, setComments] = useState<MeetupComment[]>([]);
  const [commentAuthorById, setCommentAuthorById] = useState<Record<string, string>>({});
  const [commentDraft, setCommentDraft] = useState('');
  const [adminForm, setAdminForm] = useState({
    title: '',
    description: '',
    category: '',
    status: 'pending' as Meetup['status'],
    district: '',
    location: '',
    userName: '',
    estimatedCost: '',
  });

  useEffect(() => {
    setAdminEditOpen(false);
  }, [id]);

  useEffect(() => {
    if (!id) {
      setComments([]);
      return;
    }
    const m = getMergedMeetups(mockMeetups).find((r) => r.id === id);
    if (m && isCareMeetupCategory(m.category)) {
      setComments([]);
      return;
    }
    const map = readMeetupCommentsMap();
    setComments(Array.isArray(map[id]) ? map[id] : []);
  }, [id, location.key, meetupFeedTick]);

  useEffect(() => {
    if (!user?.id || careNeedTarget == null) {
      setMyCareCertifiedRole(undefined);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from('certified_guard_moms')
        .select('provider_kind, certified_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setMyCareCertifiedRole(null);
        return;
      }
      const at = data.certified_at;
      const certified =
        at != null &&
        String(at).trim() !== '' &&
        !Number.isNaN(new Date(at as string).getTime());
      if (!certified) {
        setMyCareCertifiedRole(null);
        return;
      }
      const pk = (data as { provider_kind?: string }).provider_kind;
      setMyCareCertifiedRole(pk === 'dog_sitter' ? 'dog_sitter' : 'guard_mom');
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, careNeedTarget]);

  useEffect(() => {
    const ids = Array.from(new Set(comments.map((c) => c.authorId?.trim() ?? '').filter(Boolean)));
    if (ids.length === 0) {
      setCommentAuthorById({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.from('profiles').select('id,name,phone').in('id', ids);
      if (cancelled || error) return;
      const byId: Record<string, string> = {};
      for (const row of data ?? []) {
        const uid = String(row.id ?? '').trim();
        if (!uid) continue;
        const name = String(row.name ?? '').trim();
        const phone = String(row.phone ?? '').trim();
        byId[uid] = name || maskPhoneLast4(phone) || `${uid.slice(0, 8)}…`;
      }
      setCommentAuthorById(byId);
    })();
    return () => {
      cancelled = true;
    };
  }, [comments]);

  if (!meetup) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
        <p className="text-base font-extrabold text-slate-700">🐕 모임을 찾을 수 없습니다</p>
        <p className="max-w-sm text-xs font-semibold leading-relaxed text-slate-500">
          샘플·내 글 모두 주소의 id로만 열려요. 내 글은 이 브라우저에만 저장될 수 있어 다른 기기·시크릿에서는 안 보일 수 있어요.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            to="/explore"
            className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-orange-500/25"
          >
            탐색으로
          </Link>
          <Link
            to="/sitters"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700"
          >
            모이자·만나자
          </Link>
        </div>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(meetup.createdAt, { addSuffix: true, locale: ko });

  const detailHeaderLabel = isCareMeetupCategory(meetup.category) ? '돌봄·구인 상세 🦴' : '만남 상세 🐾';

  const dolbomTitleShown =
    isCareMeetupCategory(meetup.category) ? displayPublicDolbomMeetupTitle(meetup) : meetup.title;
  const dolbomDescriptionShown =
    isCareMeetupCategory(meetup.category) ? displayPublicDolbomMeetupDescription(meetup) : meetup.description;

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

  const handleInvite = (_sitter: { id: string; name: string }) => {
    if (!requireLoginForAction()) return;
    if (isCareMeetupCategory(meetup.category) && user && meetup.userId !== user.id) {
      if (myCareCertifiedRole === undefined) {
        alert('잠시만요… 인증 정보를 확인 중이에요.');
        return;
      }
      if (
        careNeedTarget == null ||
        !certifiedProviderMatchesNeed(careNeedTarget, myCareCertifiedRole ?? null)
      ) {
        const msg =
          careNeedTarget === 'dog_sitter'
            ? '이 글은 인증 댕집사(방문)만 신청할 수 있어요.'
            : careNeedTarget === 'guard_mom'
              ? '이 글은 인증 보호맘(맡기기)만 신청할 수 있어요.'
              : '인증 댕집사 또는 인증 보호맘만 신청할 수 있어요.';
        alert(msg);
        return;
      }
    }
    const authorId = meetup.userId?.trim() ?? '';
    if (!isAuthUserUuid(authorId)) {
      alert('이 글은 데모라 채팅을 열 수 없어요. 회원이 올린 글에서 다시 시도해 주세요.');
      return;
    }
    if (user?.id === authorId) {
      alert('내가 올린 글이에요.');
      return;
    }
    const params = new URLSearchParams({
      name: meetup.userName || '작성자',
      meetup: meetup.title,
      mid: meetup.id,
    });
    navigate(`/chat/${encodeURIComponent(authorId)}?${params.toString()}`);
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

  const openAdminEdit = () => {
    setAdminForm({
      title: meetup.title,
      description: meetup.description,
      category: meetup.category,
      status: meetup.status,
      district: meetup.district,
      location: meetup.location,
      userName: meetup.userName,
      estimatedCost: meetup.estimatedCost ?? '',
    });
    setAdminEditOpen(true);
  };

  const handleAdminSave = () => {
    if (!adminForm.title.trim()) {
      alert('제목은 비울 수 없어요.');
      return;
    }
    adminSaveMeetupPatch(meetup.id, {
      title: adminForm.title.trim(),
      description: adminForm.description.trim(),
      category: adminForm.category,
      status: adminForm.status,
      district: adminForm.district.trim(),
      location: adminForm.location.trim(),
      userName: adminForm.userName.trim(),
      estimatedCost: adminForm.estimatedCost.trim() || undefined,
    });
    setAdminEditOpen(false);
    alert('관리자 권한으로 글을 저장했어요.');
  };

  const handleAdminDelete = () => {
    if (
      !window.confirm(
        '관리자 권한으로 이 글을 삭제합니다. 목록·피드에서 사라지며 복구할 수 없어요. 계속할까요?',
      )
    ) {
      return;
    }
    adminDeleteMeetupById(meetup.id);
    navigate('/explore', { replace: true });
  };

  const handleCommentSubmit = async () => {
    if (!requireLoginForAction()) return;
    if (isCareMeetupCategory(meetup.category)) {
      alert('돌봄·맡기기 글에는 댓글 대신 채팅으로 연락해 주세요.');
      return;
    }
    const text = commentDraft.trim();
    if (!text) {
      alert('댓글 내용을 입력해 주세요.');
      return;
    }
    if (!id) return;
    let authorName = user ? displayNameFromUser(user) : '이웃';
    if (user?.id) {
      const { data: prof } = await supabase.from('profiles').select('name,phone').eq('id', user.id).maybeSingle();
      const n = String(prof?.name ?? '').trim();
      const p = String(prof?.phone ?? '').trim();
      authorName = n || maskPhoneLast4(p) || authorName;
    }
    const nextComment: MeetupComment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      meetupId: id,
      authorId: user?.id ?? '',
      authorName,
      text: text.slice(0, 300),
      createdAt: new Date().toISOString(),
    };
    const next = [...comments, nextComment];
    setComments(next);
    const map = readMeetupCommentsMap();
    map[id] = next;
    writeMeetupCommentsMap(map);
    setCommentDraft('');
  };

  return (
    <div className="min-h-screen bg-white">
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
          <span className="ml-2 text-slate-800 text-lg" style={{ fontWeight: 700 }}>{detailHeaderLabel}</span>
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

        {!authLoading && user && isAppAdmin(user) && (
          <div className="mb-5 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-white px-4 py-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-extrabold text-violet-800">
              <Shield className="h-4 w-4 shrink-0" aria-hidden />
              관리자 전용 — 이 글을 직접 수정하거나 삭제할 수 있어요
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openAdminEdit}
                className="inline-flex flex-1 min-w-[8rem] items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-extrabold text-white shadow-sm active:scale-[0.98]"
              >
                <PencilLine className="h-4 w-4" aria-hidden />
                글 수정
              </button>
              <button
                type="button"
                onClick={handleAdminDelete}
                className="inline-flex flex-1 min-w-[8rem] items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-extrabold text-red-600 active:scale-[0.98]"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                글 삭제
              </button>
            </div>
          </div>
        )}

        {/* 1. 모임 정보 */}
        <div className="mb-10">
          <div className="aspect-[4/3] bg-slate-100 rounded-[2rem] overflow-hidden mb-6 shadow-sm">
            <ImageWithFallback
              src={meetupCoverImageUrl(meetup)}
              fallbackSrc={virtualDogPhotoForSeed(`meetup-detail-fallback-${meetup.id}`)}
              alt={dolbomTitleShown}
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
            {dolbomTitleShown}
          </h1>

          <div className="flex items-center gap-4 text-sm text-slate-500 mb-6" style={{ fontWeight: 500 }}>
            <div className="flex items-center gap-1.5"><User className="w-4 h-4" /><span>{meetup.userName}</span></div>
            <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /><span>{meetup.district}</span></div>
            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /><span>{timeAgo}</span></div>
          </div>

          {meetup.status === 'pending' &&
            !isCareMeetupCategory(meetup.category) &&
            (!user || meetup.userId !== user.id) && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => handleInvite({ id: '', name: '' })}
                disabled={authLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-4 text-base font-extrabold text-white shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <UserPlus className="h-5 w-5 shrink-0" aria-hidden />
                참여하기
              </button>
              <p className="mt-2 text-center text-[11px] font-semibold text-slate-400">작성자와 채팅으로 일정을 맞춰요</p>
            </div>
          )}

          <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 text-slate-700 leading-relaxed" style={{ fontWeight: 500 }}>
            {dolbomDescriptionShown}
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

          {isCareMeetupCategory(meetup.category) && (
            <Link
              to="/sitters?view=care&care=sitter"
              className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-orange-200/80 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 px-4 py-3 text-sm font-extrabold text-orange-600 transition-colors hover:from-orange-100 hover:via-amber-100 hover:to-yellow-100"
            >
              인증 댕집사(방문)·인증 보호맘(맡기기) 보기 →
            </Link>
          )}
        </div>

        {/* 댓글 — 돌봄·맡기기 글은 댓글 없음(채팅만) */}
        {!isCareMeetupCategory(meetup.category) && (
          <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">댓글</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                {comments.length}개
              </span>
            </div>
            <p className="mb-3 text-xs font-medium text-slate-500">
              채팅 없이도 댓글로 참여 의사와 일정 조율을 남길 수 있어요.
            </p>
            <div className="mb-4 flex gap-2">
              <textarea
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="예) 도도맘) 네, 이번 주 공원 모임에 아이와 참석할게요!"
                className="min-h-[84px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800"
              />
              <button
                type="button"
                onClick={() => void handleCommentSubmit()}
                disabled={authLoading}
                className="self-end rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
              >
                댓글 쓰기
              </button>
            </div>

            {comments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs font-semibold text-slate-500">
                첫 댓글을 남겨 모임을 시작해 보세요.
              </div>
            ) : (
              <div className="space-y-2.5">
                {[...comments].reverse().map((c) => (
                  <div key={c.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-800">
                        {(c.authorId && commentAuthorById[c.authorId]) || c.authorName}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: ko })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

        {/* 3. 돌봄 글: 인증 댕집사/보호맘만 작성자에게 채팅(신청) / 그 외 모임: 근처 댕친(데모) */}
        {isCareMeetupCategory(meetup.category) && meetup.status === 'pending' && (
          <div className="mb-10">
            <h2 className="mb-3 text-xl text-slate-900" style={{ fontWeight: 800 }}>
              인증 돌봄 연락
            </h2>
            <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
              <p className="text-xs font-semibold leading-relaxed text-slate-600">
                {careNeedTarget === 'dog_sitter' && '이 글은 인증 댕집사(방문)만 신청할 수 있어요.'}
                {careNeedTarget === 'guard_mom' && '이 글은 인증 보호맘(맡기기)만 신청할 수 있어요.'}
                {careNeedTarget === 'both' && '인증 댕집사 또는 인증 보호맘만 신청할 수 있어요.'}
              </p>
              {user && meetup.userId === user.id ? (
                <p className="mt-3 text-sm font-bold text-slate-700">내가 올린 맡기기 글이에요.</p>
              ) : !user ? (
                <p className="mt-3 text-sm font-bold text-amber-800">
                  로그인 후 신청할 수 있어요.{' '}
                  <Link
                    to="/login"
                    onClick={() => setAuthReturnPath(`${location.pathname}${location.search}`)}
                    className="font-extrabold text-sky-700 underline underline-offset-2"
                  >
                    로그인
                  </Link>
                </p>
              ) : myCareCertifiedRole === undefined ? (
                <p className="mt-3 text-sm font-medium text-slate-500">인증 정보 확인 중…</p>
              ) : myCareCertifiedRole == null ? (
                <p className="mt-3 text-sm font-bold text-slate-700">
                  인증 댕집사·보호맘 등록 후 운영 인증이 완료되면 신청할 수 있어요.
                </p>
              ) : !certifiedProviderMatchesNeed(careNeedTarget ?? 'both', myCareCertifiedRole) ? (
                <p className="mt-3 text-sm font-bold text-rose-700">맡기는 분이 고른 유형과 맞지 않아요.</p>
              ) : (
                <button
                  type="button"
                  onClick={() => handleInvite({ id: '', name: '' })}
                  disabled={authLoading}
                  className="mt-4 w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-extrabold text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  작성자에게 채팅(신청)
                </button>
              )}
            </div>
          </div>
        )}
        {!isCareMeetupCategory(meetup.category) && recommendedSitters.length > 0 && meetup.status === 'pending' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl text-slate-900" style={{ fontWeight: 800 }}>🐾 근처 댕친들</h2>
            </div>

            <div className="space-y-4">
              {recommendedSitters.map((sitter, index) => {
                const hasJoined = joinRequests.some((q) => q.dogSitterName === sitter.name);
                const isVeryClose = sitter.distance < 2;

                return (
                  <div
                    key={sitter.id}
                    className={`rounded-3xl p-5 transition-all ${
                      hasJoined
                        ? 'border border-orange-200 bg-orange-50/30'
                        : 'border border-slate-200 bg-white hover:border-orange-200 hover:shadow-sm'
                    }`}
                  >
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
                      <div
                        className="rounded-2xl border border-orange-100 bg-orange-50 py-3 text-center text-sm text-orange-600"
                        style={{ fontWeight: 700 }}
                      >
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
                          작성자와 채팅
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

      {adminEditOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="presentation"
          onClick={() => setAdminEditOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-edit-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-violet-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="admin-edit-title" className="text-base font-extrabold text-slate-900">
              관리자 — 글 수정
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-500">
              저장 즉시 모든 사용자 화면에 반영돼요. (목업 글은 이 기기에만 오버라이드로 저장됩니다.)
            </p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-600">제목</span>
                <input
                  type="text"
                  value={adminForm.title}
                  onChange={(e) => setAdminForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-600">주제</span>
                <select
                  value={adminForm.category}
                  onChange={(e) => setAdminForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900"
                >
                  {!(ADMIN_MEETUP_CATEGORIES as readonly string[]).includes(adminForm.category) && (
                    <option value={adminForm.category}>{adminForm.category} (현재 DB)</option>
                  )}
                  {ADMIN_MEETUP_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-600">상태</span>
                <select
                  value={adminForm.status}
                  onChange={(e) =>
                    setAdminForm((f) => ({
                      ...f,
                      status: e.target.value as Meetup['status'],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900"
                >
                  <option value="pending">모집중</option>
                  <option value="in-progress">진행중</option>
                  <option value="completed">완료</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-600">작성자 표시명</span>
                <input
                  type="text"
                  value={adminForm.userName}
                  onChange={(e) => setAdminForm((f) => ({ ...f, userName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-600">구(동네)</span>
                <input
                  type="text"
                  value={adminForm.district}
                  onChange={(e) => setAdminForm((f) => ({ ...f, district: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-600">위치(한 줄)</span>
                <input
                  type="text"
                  value={adminForm.location}
                  onChange={(e) => setAdminForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-600">일정·표기 (estimatedCost)</span>
                <input
                  type="text"
                  value={adminForm.estimatedCost}
                  onChange={(e) => setAdminForm((f) => ({ ...f, estimatedCost: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-600">본문</span>
                <textarea
                  value={adminForm.description}
                  onChange={(e) => setAdminForm((f) => ({ ...f, description: e.target.value }))}
                  rows={5}
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
                />
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setAdminEditOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-extrabold text-slate-600"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAdminSave}
                className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-extrabold text-white shadow-sm"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

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