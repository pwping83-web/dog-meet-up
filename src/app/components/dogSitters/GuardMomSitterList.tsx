import { Link } from 'react-router';
import { Loader2, MapPin } from 'lucide-react';
import { DogSitterCard } from '../DogSitterCard';
import type { Database } from '../../../lib/supabase';
import type { DogSitter } from '../../types';
import { getCertifiedGuardMomHeroImageUrl } from '../../data/mockCertifiedGuardMoms';
import { displayCertifiedGuardMomIntro } from '../../data/virtualDogPhotos';
import { formatCertifiedGuardMomLocation } from '../../data/regions';
import { formatDistance } from '../../utils/distance';
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
          <div key={`s-${row.sitter.id}`} className="relative">
            <DogSitterCard dogSitter={row.sitter} />
            <div className="pointer-events-none absolute right-4 top-4 flex flex-col items-end gap-1" aria-hidden>
              <div
                className={`rounded-xl px-3 py-1.5 text-xs shadow-sm ${
                  row.distance < 2
                    ? 'bg-orange-500 text-white'
                    : row.distance < 5
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-300 text-slate-700'
                }`}
                style={{ fontWeight: 800 }}
              >
                {formatDistance(row.distance)}
              </div>
              {row.distance < 2 && (
                <span
                  className="rounded-lg bg-orange-50 px-2 py-0.5 text-xs text-orange-600"
                  style={{ fontWeight: 800 }}
                >
                  초근거리!
                </span>
              )}
            </div>
          </div>
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
                    alt="인증 보호맘"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-brand">인증 보호맘</p>
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
            <div className="pointer-events-none absolute right-4 top-4 flex flex-col items-end gap-1" aria-hidden>
              <div
                className={`rounded-xl px-3 py-1.5 text-xs shadow-sm ${
                  row.distance < 2
                    ? 'bg-orange-500 text-white'
                    : row.distance < 5
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-300 text-slate-700'
                }`}
                style={{ fontWeight: 800 }}
              >
                {formatDistance(row.distance)}
              </div>
            </div>
          </div>
        ),
      )}

      {!guardLoading && combinedRows.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          {careFilter === 'guard' && guardMomsCount === 0 && !guardMomUiDemoFill ? (
            <>
              <p className="text-sm font-bold text-slate-700">표시할 인증 보호맘이 없어요</p>
              <p className="mt-2 text-xs font-medium text-slate-500">
                {searchQuery.trim()
                  ? '검색어를 바꿔 보세요.'
                  : 'DB에 certified_at이 채워진 행이 없거나, 목록용 RLS·161200 트리거·관리자 인증을 확인해 보세요. 등록 후 운영에서 인증하면 여기에 올라와요.'}
              </p>
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
              <p className="mt-2 text-xs font-medium text-slate-500">
                필터·검색어를 바꾸거나, 인증 보호맘 등록을 눌러 노출을 시작해 보세요.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
