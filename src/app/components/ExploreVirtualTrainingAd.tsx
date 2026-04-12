import { Link } from 'react-router';
import { Megaphone, ShieldCheck, GraduationCap } from 'lucide-react';

/**
 * 탐색 피드 중간에 넣는 **가상 광고** UI 예시 (실제 업체·결제 아님).
 * 당근마켓식 중간 광고 카드 톤을 참고했습니다.
 */
export function ExploreVirtualTrainingAd() {
  return (
    <article
      className="relative overflow-hidden rounded-3xl border border-violet-200/90 bg-gradient-to-br from-violet-50 via-white to-sky-50/80 p-4 shadow-md shadow-violet-100/40 max-md:p-4 md:rounded-2xl md:p-3.5"
      aria-label="가상 광고 예시 카드"
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-200/30 blur-2xl" />
      <div className="relative">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white max-md:text-[11px]"
          >
            <Megaphone className="h-3.5 w-3.5 shrink-0" aria-hidden />
            광고 · 가상 예시
          </span>
          <span className="text-[10px] font-bold text-slate-500 max-md:text-[11px]">실제 업체 아님</span>
        </div>

        <h3 className="mb-2 text-[15px] font-black leading-snug tracking-tight text-slate-900 max-md:text-base md:text-sm">
          [가상] 댕댕케어 직업훈련센터 — 돌봄·맡기기 직업 훈련
        </h3>
        <p className="mb-1 text-xs font-semibold text-violet-800 max-md:text-[13px] md:text-[11px]">
          지금은 한시 무료 노출 · 이후 월 정액 광고(예시)
        </p>
        <p className="mb-3 text-xs font-medium leading-relaxed text-slate-600 max-md:text-[13px] md:text-[11px]">
          반려견 방문 돌봄·맡기기를 직업으로 하고 싶은 분을 위한 기초·실무 훈련을 안내합니다. 산책·배변·안전·보호자 소통까지,{' '}
          <strong className="text-slate-800">가르치는 직업(강사)</strong>과{' '}
          <strong className="text-slate-800">돌보는 직업(돌봄 제공자)</strong>이 함께 늘어나 일자리가 하나 더 생기는 구조를
          목표로 합니다.
        </p>

        <div className="mb-3 rounded-2xl border border-sky-100 bg-sky-50/90 px-3 py-2.5 max-md:py-3">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold text-sky-900 max-md:text-xs">
            <GraduationCap className="h-4 w-4 shrink-0" aria-hidden />
            노출·광고 안내 (가상)
          </p>
          <ul className="list-inside list-disc space-y-1 text-[10px] font-medium leading-relaxed text-slate-600 max-md:text-[11px] md:text-[10px]">
            <li>지금: 피드에 한시적으로 무료로 올려 보는 광고입니다.</li>
            <li>이후: 한 달 단위 유료 광고로 전환될 수 있으며, 월 과금 후 노출이 유지됩니다.</li>
            <li>실제 요금·약관은 서비스 정책에 따릅니다.</li>
          </ul>
        </div>

        <div className="mb-3 rounded-2xl border border-amber-100 bg-amber-50/90 px-3 py-2.5 max-md:py-3">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold text-amber-950 max-md:text-xs">
            <ShieldCheck className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
            인증 보호맘이란?
          </p>
          <p className="text-[10px] font-medium leading-relaxed text-amber-950/90 max-md:text-[11px] md:text-[10px]">
            여기서 말하는 <strong className="font-extrabold">인증 보호맘</strong>은 일반 맡기기 글과 달리,{' '}
            <strong className="font-extrabold">교육 수료</strong> 또는 <strong className="font-extrabold">공식적으로 인정</strong>
            받은 이력 등 플랫폼이 정한 기준을 갖춘 뒤 <strong className="font-extrabold">운영에서 인증</strong>된 돌봄
            제공자예요. (실제 심사·표시 기준은 서비스 정책·DB 설정을 따릅니다.)
          </p>
        </div>

        <p className="mb-3 text-[10px] font-semibold leading-relaxed text-slate-500 max-md:text-[11px]">
          본 카드는 예시·가상 광고이며, 실제 교육기관·수료·취업을 보증하지 않습니다.
        </p>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/sitters?view=care&care=guard"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-extrabold text-white transition-opacity active:opacity-90 max-md:py-2.5 max-md:text-xs"
          >
            인증 돌봄(보호맘) 둘러보기
          </Link>
          <Link
            to="/customer-service#legal"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold text-slate-600 transition-colors hover:bg-slate-50 max-md:py-2.5 max-md:text-xs"
          >
            법적 고지
          </Link>
        </div>
      </div>
    </article>
  );
}
