import { Link } from 'react-router';
import { Loader2, MapPin } from 'lucide-react';
import { DogSitterCard } from '../DogSitterCard';
import type { Database } from '../../../lib/supabase';
import type { DogSitter } from '../../types';
import { getCertifiedGuardMomHeroImageUrl } from '../../data/mockCertifiedGuardMoms';
import { displayCertifiedGuardMomIntro } from '../../data/virtualDogPhotos';
import { formatCertifiedGuardMomLocation } from '../../data/regions';
import { formatDistance } from '../../utils/distance';
import { displayCertifiedGuardMomBrandName } from '../../utils/guardMomDisplayName';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export type GuardMomRow = Database['public']['Tables']['certified_guard_moms']['Row'];

export type CombinedSitterGuardRow =
  | { kind: 'sitter'; distance: number; sitter: DogSitter }
  | { kind: 'guard'; distance: number; mom: GuardMomRow };

export type CareFilterKind = 'need' | 'sitter' | 'guard';

export type GuardMomSitterListProps = {
  careFilter: CareFilterKind;
  combinedRows: CombinedSitterGuardRow[];
  guardLoading: boolean;
  guardMomsLoadError: string | null;
  guardMomUiDemoFill: boolean;
  guardMomsCount: number;
  searchQuery: string;
};

export function GuardMomSitterList({
  careFilter,
  combinedRows,
  guardLoading,
  guardMomsLoadError,
  guardMomUiDemoFill,
  guardMomsCount,
  searchQuery,
}: GuardMomSitterListProps) {
  if (guardLoading && careFilter === 'guard') {
    return (
      <div className="flex justify-center py-16 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin" aria-label="불러오는 중" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {guardMomsLoadError && careFilter === 'guard' && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-center text-[11px] font-semibold leading-snug text-amber-950"
        >
          보호맘 목록을 불러오지 못했어요. 잠시 후 다시 열어 보거나, Supabase{' '}
          <span className="font-extrabold">certified_guard_moms</span> RLS를 확인해 주세요.
          {import.meta.env.DEV && (
            <span className="mt-1 block font-mono text-[10px] font-normal text-amber-900/90">{guardMomsLoadError}</span>
          )}
        </div>
      )}
      {!guardMomsLoadError &&
        !guardLoading &&
        careFilter === 'guard' &&
        guardMomUiDemoFill &&
        !searchQuery.trim() && (
          <p className="rounded-2xl border border-sky-100 bg-sky-50/90 px-3 py-2 text-center text-[11px] font-medium text-sky-900">
            DB에는 아직 인증된 보호맘이 없어요. 아래 카드는{' '}
            <span className="font-extrabold">로컬·데모 전용 예시</span>예요. 운영 빌드에서는 예시를 숨기고, 관리자 인증 후
            실제 행만 보여요.
          </p>
        )}
      {combinedRows.map((row) =>
        row.kind === 'sitter' ? (
          <DogSitterCard
            key={`s-${row.sitter.id}`}
            dogSitter={row.sitter}
            distanceLabel={formatDistance(row.distance)}
            distanceBadgeClassName={
              row.distance < 2
                ? 'bg-orange-500 text-white'
                : row.distance < 5
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-300 text-slate-700'
            }
            showUltraNear={row.distance < 2}
          />
        ) : (
          <div key={`g-${row.mom.id}`} className="relative">
            <Link
              to={`/guard-mom/${row.mom.id}`}
              className="block rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-orange-200 hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex gap-4">
                <div className="flex h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 shadow-inner">
                  <ImageWithFallback
                    src={getCertifiedGuardMomHeroImageUrl(row.mom)}
                    alt={displayCertifiedGuardMomBrandName(row.mom)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-extrabold leading-tight text-brand">
                      {displayCertifiedGuardMomBrandName(row.mom)}
                    </p>
                    <span
                      className={`rounded-xl px-2.5 py-1 text-[11px] font-extrabold shadow-sm ${
                        row.distance < 2
                          ? 'bg-orange-500 text-white'
                          : row.distance < 5
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-300 text-slate-700'
                      }`}
                      aria-label={`거리 ${formatDistance(row.distance)}`}
                      title={`거리 ${formatDistance(row.distance)}`}
                    >
                      {formatDistance(row.distance)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-800">
                    {displayCertifiedGuardMomIntro(row.mom)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {formatCertifiedGuardMomLocation(row.mom)}
                    </span>
                    <span className="text-brand">1일 {row.mom.per_day_fee_krw.toLocaleString('ko-KR')}원부터</span>
                    {row.mom.offers_daeng_pickup === true && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold text-sky-800">
                        댕댕 픽업
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ),
      )}

      {!guardLoading && combinedRows.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          {careFilter === 'sitter' ? (
            <>
              <p className="text-sm font-bold text-slate-700">노출 중인 인증 댕집사가 없어요</p>
              <p className="mt-2 text-xs font-medium text-slate-500">
                {searchQuery.trim()
                  ? '검색어를 바꿔 보세요.'
                  : '신청 후 운영 인증·노출 조건을 갖추면 여기에 보여요. 동네 필터도 확인해 주세요.'}
              </p>
              <Link
                to="/guard-mom/register?role=sitter"
                className="mt-4 inline-block rounded-2xl bg-violet-600 px-5 py-3 text-sm font-extrabold text-white shadow-md active:scale-[0.98]"
              >
                댕집사 신청하기
              </Link>
            </>
          ) : careFilter === 'guard' && guardMomsCount === 0 && !guardMomUiDemoFill ? (
            <>
              <p className="text-sm font-bold text-slate-700">표시할 인증 보호맘이 없어요</p>
              <p className="mt-2 text-xs font-medium text-slate-500">
                {searchQuery.trim()
                  ? '검색어를 바꿔 보세요.'
                  : '이 동네·거리 안에 아직 없어요. 위에서 거리를 넓혀 보거나, 신청 후 운영 인증이 나면 여기에 올라와요.'}
              </p>
              {import.meta.env.DEV && !searchQuery.trim() ? (
                <p className="mt-2 font-mono text-[10px] font-normal leading-snug text-slate-400">
                  dev: certified_at·목록 RLS·161200 마이그레이션·관리자 인증 점검
                </p>
              ) : null}
              <Link
                to="/guard-mom/register"
                className="mt-4 inline-block rounded-2xl bg-orange-500 px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-orange-500/20 active:scale-[0.98]"
              >
                인증 보호맘 등록하기
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-700">조건에 맞는 돌보미가 없어요</p>
              <p className="mt-2 text-xs font-medium text-slate-500">검색어를 바꿔 보세요.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
