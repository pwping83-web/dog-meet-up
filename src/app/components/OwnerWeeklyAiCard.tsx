import { useState } from 'react';
import { Link } from 'react-router';
import { CalendarHeart, Loader2, Sparkles, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserLocation } from '../../contexts/UserLocationContext';
import { invokeDaengAiAssist, type DaengAiAssistResult, type DaengAiWeeklyItem } from '../../lib/daengAiAssist';
import { buildOwnerWeeklyAiPayload } from '../../lib/ownerWeeklyAiContext';

function WeeklyItemRow({ item }: { item: DaengAiWeeklyItem }) {
  if (item.kind === 'meetup') {
    return (
      <Link
        to={`/meetup/${item.meetupId}`}
        className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-white px-3 py-3 text-left shadow-sm transition hover:border-violet-200 hover:bg-violet-50/40"
      >
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-black text-violet-800">
          모임
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-extrabold leading-snug text-slate-900 line-clamp-2">{item.label}</span>
          {item.detail ? (
            <span className="mt-0.5 block text-[11px] font-semibold text-slate-500 line-clamp-2">{item.detail}</span>
          ) : null}
        </span>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-violet-400" aria-hidden />
      </Link>
    );
  }
  if (item.kind === 'dog') {
    return (
      <Link
        to={`/dog/${item.dogId}`}
        className="flex items-start gap-3 rounded-2xl border border-fuchsia-100 bg-white px-3 py-3 text-left shadow-sm transition hover:border-fuchsia-200 hover:bg-fuchsia-50/40"
      >
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-fuchsia-100 text-[10px] font-black leading-tight text-fuchsia-900">
          댕친
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-extrabold leading-snug text-slate-900 line-clamp-2">{item.label}</span>
          {item.detail ? (
            <span className="mt-0.5 block text-[11px] font-semibold text-slate-500 line-clamp-1">{item.detail}</span>
          ) : null}
        </span>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-fuchsia-400" aria-hidden />
      </Link>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-[10px] font-black text-slate-700">
        팁
      </span>
      <p className="min-w-0 flex-1 text-[13px] font-bold leading-snug text-slate-800 line-clamp-2">{item.label}</p>
    </div>
  );
}

export function OwnerWeeklyAiCard() {
  const { user } = useAuth();
  const { location: userLoc } = useUserLocation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [intro, setIntro] = useState('');
  const [items, setItems] = useState<DaengAiWeeklyItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const applyResult = (r: DaengAiAssistResult) => {
    if (!r.ok) {
      setErr(r.error);
      setIntro('');
      setItems([]);
      setOpen(true);
      return;
    }
    setErr(null);
    // 장황한 폴백(r.text) 금지 — 짧은 weeklyIntro만 표시
    setIntro((r.fields?.weeklyIntro ?? '').trim());
    setItems(Array.isArray(r.fields?.weeklyItems) ? r.fields!.weeklyItems! : []);
    setOpen(true);
  };

  const run = async () => {
    if (!user?.id || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const built = await buildOwnerWeeklyAiPayload(user.id, userLoc.district || '');
      if (!built.ok) {
        applyResult({ ok: false, error: built.error });
        return;
      }
      const payloadRecord: Record<string, unknown> = {
        today: built.payload.today,
        userDistrict: built.payload.userDistrict,
        myDogs: built.payload.myDogs,
        myPosts: built.payload.myPosts,
        candidateMeetups: built.payload.candidateMeetups,
        candidateDogs: built.payload.candidateDogs,
      };
      const r = await invokeDaengAiAssist('owner_weekly_plan', payloadRecord);
      applyResult(r);
    } catch (e) {
      applyResult({ ok: false, error: (e as Error)?.message ?? '알 수 없는 오류' });
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="rounded-3xl border border-violet-200/90 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500 text-white shadow-md shadow-violet-300/50">
            <CalendarHeart className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-extrabold text-slate-900">이번 주, 뭐 할까?</h3>
            <p className="mt-1 text-[11px] font-semibold leading-snug text-slate-600">
              동네 모임·댕친 후보로 AI가 <strong className="text-violet-800">짧은 코스</strong>만 골라 드려요.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run()}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-violet-400/30 transition hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Sparkles className="h-4 w-4 shrink-0" />}
              {busy ? '짧게 짜는 중…' : 'AI 추천 받기'}
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="owner-weekly-ai-title"
        >
          <div className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 id="owner-weekly-ai-title" className="text-base font-black text-slate-900">
                이번 주 코스
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[calc(85vh-56px)] overflow-y-auto px-4 py-4 space-y-4">
              {err ? (
                <p className="rounded-2xl bg-red-50 px-3 py-3 text-sm font-semibold text-red-800">{err}</p>
              ) : (
                <>
                  {intro ? (
                    <p className="text-[13px] font-semibold leading-snug text-slate-700 whitespace-pre-wrap">
                      {intro}
                    </p>
                  ) : null}
                  {items.length > 0 ? (
                    <div className="space-y-2.5">
                      {items.map((it, i) => (
                        <WeeklyItemRow key={`${it.kind}-${i}`} item={it} />
                      ))}
                    </div>
                  ) : !err && intro ? (
                    <p className="text-xs font-medium text-slate-500">추가로 바로가기 링크를 만들지 못했어요. 탐색에서 모임을 찾아보세요.</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      to="/explore"
                      onClick={() => setOpen(false)}
                      className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-800"
                    >
                      동네 모임 더보기
                    </Link>
                    <Link
                      to="/create-meetup"
                      onClick={() => setOpen(false)}
                      className="rounded-xl bg-orange-100 px-3 py-2 text-xs font-extrabold text-orange-900"
                    >
                      글 올리기
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
