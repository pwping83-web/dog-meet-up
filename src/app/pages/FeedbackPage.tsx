import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getFeedbackInboxEmail, sendUserFeedbackEmail, trySendEmail } from '../../lib/emailjs';

const KINDS = [
  { value: 'bug', label: '오류·작동 안 함' },
  { value: 'ux', label: '불편사항 (사용성)' },
  { value: 'idea', label: '개선·아이디어' },
  { value: 'other', label: '기타 의견' },
] as const;

export function FeedbackPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kind, setKind] = useState<(typeof KINDS)[number]['value']>('ux');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const u = user?.email?.trim();
    if (u) setReplyEmail((prev) => (prev.trim() ? prev : u));
  }, [user?.email]);

  const kindLabel = KINDS.find((k) => k.value === kind)?.label ?? kind;
  const inbox = getFeedbackInboxEmail();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const accountHint = user?.email?.trim() || user?.id || '비로그인';
      const ok = await trySendEmail(
        () =>
          sendUserFeedbackEmail({
            kindLabel,
            title: title.trim(),
            detail: detail.trim(),
            accountHint,
            replyEmail: replyEmail.trim(),
            pageUrl: typeof window !== 'undefined' ? window.location.href : '',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          }),
        '개선·의견',
      );
      if (ok) {
        alert('소중한 의견 감사합니다. 검토 후 필요 시 연락드릴게요.');
        setTitle('');
        setDetail('');
        navigate(-1);
        return;
      }
      const body = [
        `유형: ${kindLabel}`,
        `제목: ${title.trim()}`,
        '',
        detail.trim(),
        '',
        `계정: ${accountHint}`,
      ].join('\n');
      const mailto = `mailto:${inbox}?subject=${encodeURIComponent(`[개선요청] ${kindLabel} — ${title.trim()}`)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      alert('메일 전송 연결을 열었어요. 메일 앱에서 보내 주시면 접수됩니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-market-header shadow-market-lg">
        <div className="mx-auto flex h-14 max-w-screen-md items-center px-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="-ml-2 rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
            aria-label="뒤로"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ml-2 text-lg font-extrabold text-white">개선해 주세요</h1>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-6">
        <div className="mb-6 rounded-3xl border border-orange-100 bg-orange-50/80 p-4 text-sm font-semibold leading-relaxed text-slate-700">
          앱이 멈추거나, 이해하기 어렵거나, 더 좋아졌으면 하는 점이 있으면 알려 주세요. 운영팀이 모아서 개선에 반영해요.
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div>
            <label htmlFor="fb-kind" className="mb-2 block text-sm font-bold text-slate-700">
              어떤 내용인가요? *
            </label>
            <select
              id="fb-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as (typeof KINDS)[number]['value'])}
              className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3.5 font-medium text-slate-800 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fb-title" className="mb-2 block text-sm font-bold text-slate-700">
              한 줄 요약 *
            </label>
            <input
              id="fb-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 모임 글 올릴 때 사진이 안 올라가요"
              required
              maxLength={200}
              className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3.5 font-medium placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
          </div>

          <div>
            <label htmlFor="fb-detail" className="mb-2 block text-sm font-bold text-slate-700">
              자세히 적어 주세요 *
            </label>
            <textarea
              id="fb-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="어떤 화면에서, 무엇을 눌렀을 때 문제가 생겼는지, 가끔인지 매번인지 등 구체적으로 적어 주시면 큰 도움이 돼요."
              required
              rows={8}
              className="w-full resize-y rounded-2xl border-2 border-slate-200 px-4 py-3.5 font-medium placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
          </div>

          <div>
            <label htmlFor="fb-email" className="mb-2 block text-sm font-bold text-slate-700">
              답변 받을 이메일 (선택)
            </label>
            <input
              id="fb-email"
              type="email"
              value={replyEmail}
              onChange={(e) => setReplyEmail(e.target.value)}
              placeholder="연락이 필요할 때만 사용해요"
              className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3.5 font-medium placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-market-cta py-4 font-bold text-white shadow-market-lg transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                보내는 중…
              </>
            ) : (
              '의견 보내기'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs font-medium text-slate-500">
          메일이 열리면{' '}
          <a href={`mailto:${inbox}`} className="font-bold text-brand underline underline-offset-2">
            {inbox}
          </a>
          로도 보내실 수 있어요. ·{' '}
          <Link to="/customer-service" className="font-bold text-slate-600 underline underline-offset-2">
            고객센터
          </Link>
        </p>
      </div>
    </div>
  );
}
