import { useState } from 'react';
import { Link } from 'react-router';
import { Megaphone, ShieldCheck, ChevronDown, GraduationCap } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { virtualDogPhotoForSeed } from '../data/virtualDogPhotos';

type ExploreVirtualTrainingAdProps = {
  /** `compact`: 돌봄 블록 바로 위 — 동일 배너 스타일, 여백·썸네일만 축소 */
  variant?: 'default' | 'compact';
};

const AD_TITLE = '댕댕케어 직업훈련센터 — 돌봄·맡기기 직업 훈련';

/** 반려견 훈련·교감 느낌의 안정적인 Unsplash CDN */
const AD_THUMB_SRC =
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=560&h=420&fit=crop&q=85';

const AD_LEAD =
  '반려견 방문 돌봄·맡기기를 직업으로 하고 싶은 분을 위한 기초·실무 훈련을 안내합니다. 산책·배변·안전·보호자 소통까지, ';

const AD_HIGHLIGHT = '가르치는 직업(강사)과 돌보는 직업(돌봄 제공자)이 함께 늘어나 일자리 창출';

const AD_TAIL = '을 목표로 합니다.';

const GUARD_MOM_TITLE = '인증 보호맘이란?';

const GUARD_MOM_BODY =
  '여기서 말하는 인증 보호맘은 일반 맡기기 글과 달리, 교육 수료 또는 공식적으로 인정받은 이력 등 플랫폼이 정한 기준을 갖춘 뒤 운영에서 인증된 돌봄 제공자예요.';

/**
 * 탐색 화면용 **가상 광고** UI 예시 (실제 업체·결제 아님).
 * 배너 카드 + 썸네일 + 하단 CTA로 클릭 유도, 상세는 접어 둠.
 */
export function ExploreVirtualTrainingAd({ variant = 'default' }: ExploreVirtualTrainingAdProps) {
  const compact = variant === 'compact';
  const [open, setOpen] = useState(false);

  const cardPad = compact ? 'px-5 py-5 max-md:px-4 max-md:py-5' : 'px-6 py-7 max-md:px-5 max-md:py-6 md:px-8 md:py-8';
  const thumbBox = compact
    ? 'h-[7.5rem] w-full sm:h-[5.5rem] sm:w-[7.5rem] shrink-0 overflow-hidden rounded-2xl border border-violet-200/60 bg-white/60 shadow-sm'
    : 'h-[10rem] w-full sm:h-[7.5rem] sm:w-[11rem] md:h-[8.25rem] md:w-[12.5rem] shrink-0 overflow-hidden rounded-2xl border border-violet-200/60 bg-white/70 shadow-md shadow-violet-200/30';

  return (
    <article
      className={`relative overflow-hidden rounded-3xl border border-violet-200/80 bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50/90 shadow-md shadow-violet-200/25 max-md:rounded-2xl ${cardPad}`}
      aria-label="가상 광고 예시 카드"
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-violet-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-indigo-300/15 blur-3xl" />

      <div className="relative flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              compact
                ? 'inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-black text-white shadow-sm max-md:text-xs'
                : 'inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white shadow-sm'
            }
          >
            <Megaphone className="h-4 w-4 shrink-0" aria-hidden />
            광고 · 모집
          </span>
        </div>

        <div
          className={
            compact
              ? 'flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-5'
              : 'flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6 md:gap-8'
          }
        >
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 hidden rounded-lg bg-violet-600/10 p-1.5 text-violet-700 sm:block">
                <GraduationCap className="h-5 w-5 shrink-0" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  className={
                    compact
                      ? 'text-base font-black leading-snug tracking-tight text-slate-900 max-md:text-[15px]'
                      : 'text-lg font-black leading-snug tracking-tight text-slate-900 max-md:text-xl md:text-xl'
                  }
                >
                  {AD_TITLE}
                </h3>
                <p
                  className={
                    compact
                      ? 'mt-2 text-[13px] font-medium leading-relaxed text-slate-600 max-md:text-sm max-md:leading-relaxed'
                      : 'mt-3 text-sm font-medium leading-relaxed text-slate-600 max-md:text-[15px] max-md:leading-relaxed md:text-[15px] md:leading-relaxed'
                  }
                >
                  {AD_LEAD}
                  <strong className="font-bold text-violet-950">{AD_HIGHLIGHT}</strong>
                  {AD_TAIL}
                </p>
              </div>
            </div>
          </div>

          <div className={thumbBox}>
            <ImageWithFallback
              src={AD_THUMB_SRC}
              fallbackSrc={virtualDogPhotoForSeed('explore-virtual-training-ad-thumb')}
              alt="반려견 돌봄·훈련 안내 이미지"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <Link
          to="/customer-service"
          className="flex w-full min-h-[48px] items-center justify-center rounded-2xl bg-purple-600 px-4 py-3.5 text-center text-sm font-extrabold text-white shadow-lg shadow-purple-600/25 transition-all hover:bg-purple-700 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
        >
          훈련 과정 신청하기
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold text-violet-800 transition-colors hover:bg-violet-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <span>{open ? '상세 안내 접기' : '자세히 알아보기 · 상세 안내'}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>

        {open && (
          <div className="space-y-5 border-t border-violet-200/70 pt-5">
            <div className="rounded-2xl border border-amber-200/90 bg-amber-50/95 px-4 py-4 max-md:px-4 max-md:py-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-extrabold text-amber-950 max-md:text-base">
                <ShieldCheck className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
                {GUARD_MOM_TITLE}
              </p>
              <p className="text-sm font-medium leading-loose text-amber-950/95 max-md:text-[15px] max-md:leading-loose">
                {GUARD_MOM_BODY}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/sitters?view=care&care=guard"
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-extrabold text-white transition-opacity active:opacity-90 sm:flex-none"
              >
                인증 돌봄(보호맘) 둘러보기
              </Link>
              <Link
                to="/customer-service#legal"
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-600 transition-colors hover:bg-slate-50 sm:flex-none"
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
