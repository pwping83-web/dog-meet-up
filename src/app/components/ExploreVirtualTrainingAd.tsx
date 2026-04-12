import { useState } from 'react';
import { Link } from 'react-router';
import { Megaphone, ShieldCheck, ChevronDown } from 'lucide-react';

type ExploreVirtualTrainingAdProps = {
  /** `compact`: 돌봄 블록 바로 위 한 줄형(작게) */
  variant?: 'default' | 'compact';
};

const AD_TITLE = '댕댕케어 직업훈련센터 — 돌봄·맡기기 직업 훈련';

const AD_BODY =
  '반려견 방문 돌봄·맡기기를 직업으로 하고 싶은 분을 위한 기초·실무 훈련을 안내합니다. 산책·배변·안전·보호자 소통까지, 가르치는 직업(강사)과 돌보는 직업(돌봄 제공자)이 함께 늘어나 일자리 창출을 목표로 합니다.';

const GUARD_MOM_TITLE = '인증 보호맘이란?';

const GUARD_MOM_BODY =
  '여기서 말하는 인증 보호맘은 일반 맡기기 글과 달리, 교육 수료 또는 공식적으로 인정받은 이력 등 플랫폼이 정한 기준을 갖춘 뒤 운영에서 인증된 돌봄 제공자예요.';

/**
 * 탐색 화면용 **가상 광고** UI 예시 (실제 업체·결제 아님).
 * 기본은 접힘 — 헤더(광고·모집 + 제목)만 보이고, 탭하면 본문·버튼이 펼쳐짐.
 */
export function ExploreVirtualTrainingAd({ variant = 'default' }: ExploreVirtualTrainingAdProps) {
  const compact = variant === 'compact';
  const [open, setOpen] = useState(false);

  return (
    <article
      className={
        compact
          ? 'relative overflow-hidden rounded-2xl border border-violet-200/90 bg-gradient-to-r from-violet-50/95 to-white px-4 py-4 shadow-sm max-md:px-4 max-md:py-5'
          : 'relative overflow-hidden rounded-3xl border border-violet-200/90 bg-gradient-to-br from-violet-50 via-white to-sky-50/80 p-5 shadow-md shadow-violet-100/40 max-md:p-5 md:rounded-2xl md:p-5'
      }
      aria-label="가상 광고 예시 카드"
    >
      {variant !== 'compact' && (
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-200/30 blur-2xl" />
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={
            compact
              ? 'flex w-full items-start gap-3 rounded-xl text-left transition-colors hover:bg-violet-100/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400'
              : 'flex w-full items-start gap-3 rounded-2xl text-left transition-colors hover:bg-violet-100/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400'
          }
        >
          <div className="min-w-0 flex-1">
            <div className={compact ? 'mb-2 flex flex-wrap items-center gap-2' : 'mb-3 flex flex-wrap items-center gap-2'}>
              <span
                className={
                  compact
                    ? 'inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-black text-white max-md:text-xs'
                    : 'inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white'
                }
              >
                <Megaphone className={compact ? 'h-4 w-4 shrink-0' : 'h-4 w-4 shrink-0'} aria-hidden />
                광고 · 모집
              </span>
            </div>
            <h3
              className={
                compact
                  ? 'text-sm font-extrabold leading-snug tracking-tight text-slate-900 max-md:text-[15px] max-md:leading-normal'
                  : 'text-lg font-black leading-snug tracking-tight text-slate-900 max-md:text-xl'
              }
            >
              {AD_TITLE}
            </h3>
            <span className="sr-only">{open ? '가상 광고 상세 접기' : '가상 광고 상세 펼치기'}</span>
          </div>
          <ChevronDown
            className={`mt-0.5 shrink-0 text-violet-600 transition-transform ${compact ? 'h-5 w-5' : 'h-5 w-5'} ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>

        {open && (
          <div className={compact ? 'mt-4 space-y-5 border-t border-violet-100 pt-5' : 'mt-5 space-y-5 border-t border-violet-100 pt-5'}>
            <p className="text-sm font-medium leading-loose text-slate-700 max-md:text-[15px] max-md:leading-loose">
              {AD_BODY}
            </p>

            <div className="rounded-2xl border border-amber-200/90 bg-amber-50/95 px-4 py-4 max-md:px-4 max-md:py-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-extrabold text-amber-950 max-md:text-base">
                <ShieldCheck className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
                {GUARD_MOM_TITLE}
              </p>
              <p className="text-sm font-medium leading-loose text-amber-950/95 max-md:text-[15px] max-md:leading-loose">
                {GUARD_MOM_BODY}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/sitters?view=care&care=guard"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-extrabold text-white transition-opacity active:opacity-90"
              >
                인증 돌봄(보호맘) 둘러보기
              </Link>
              <Link
                to="/customer-service#legal"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-600 transition-colors hover:bg-slate-50"
              >
                법적 고지
              </Link>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
