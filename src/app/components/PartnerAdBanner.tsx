type PartnerAdBannerProps = {
  className?: string;
};

export function PartnerAdBanner({ className = '' }: PartnerAdBannerProps) {
  return (
    <section
      className={`rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-fuchsia-50/70 to-white p-4 shadow-sm ${className}`}
      aria-label="파트너 광고 안내 배너"
    >
      <p className="inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-violet-700">
        가상 파트너 광고
      </p>
      <h3 className="mt-2 text-sm font-extrabold text-violet-950">
        돌봄·맡기기 직업 훈련 — 지금은 한시 무료 노출
      </h3>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-violet-900/90">
        동네 훈련소·미용실 파트너를 위한 안내 배너 예시입니다. 초기에는 무료 노출, 이후 월 단위 유료 광고로
        전환될 수 있어요.
      </p>
      <p className="mt-2 text-[11px] font-medium text-slate-500">
        ※ 예시 광고 문구이며 실제 교육·자격·취업을 보증하지 않습니다.
      </p>
    </section>
  );
}

