import { useEffect, useMemo, useState } from 'react';
import { Search, MapPin, MessageCircle, Loader2 } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { DogSitterCard } from '../components/DogSitterCard';
import { mockDogSitters, mockMeetups, mockJoinRequests } from '../data/mockData';
import { ANYANG_MANAN_DISTANCE_ORIGIN, calculateDistance, formatDistance } from '../utils/distance';
import { useUserLocation } from '../../contexts/UserLocationContext';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/supabase';
import type { DogSitter } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { readExtraCareRegions, type ExtraCareRegion } from '../../lib/extraCareRegions';
import { getCertifiedGuardMomPhotoUrl, mockCertifiedGuardMoms } from '../data/mockCertifiedGuardMoms';
import {
  MANNAJA_CATEGORY_SET,
  MANNAJA_MEETUP_CATEGORIES,
  meetupCategoryEmoji,
  MOIJA_CATEGORY_SET,
  MOIJA_MEETUP_CATEGORIES,
} from '../utils/meetupCategory';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { formatCertifiedGuardMomLocation, formatDistrictWithDong } from '../data/regions';
import { meetupVisibleInPublicFeed } from '../utils/meetupPublicVisibility';
import { isPromoFreeListings } from '../../lib/promoFlags';
import { getMergedMeetups } from '../../lib/userMeetupsStore';
type GuardMomRow = Database['public']['Tables']['certified_guard_moms']['Row'];
/** need: 돌봄 맡기기 글(주인) / sitter·guard: 맡아주는 쪽 */
type CareFilter = 'need' | 'sitter' | 'guard';

type TopTab = 'moija' | 'mannaja' | 'certified';

type CombinedRow =
  | { kind: 'sitter'; distance: number; sitter: DogSitter }
  | { kind: 'guard'; distance: number; mom: GuardMomRow };

function readInitialSittersUrl(): { topTab: TopTab; care: CareFilter } {
  if (typeof window === 'undefined') return { topTab: 'moija', care: 'sitter' };
  const p = new URLSearchParams(window.location.search);
  const view = p.get('view');
  const care = p.get('care');
  if (
    view === 'care' ||
    care === 'guard' ||
    care === 'moms' ||
    care === 'sitter' ||
    care === 'need' ||
    care === 'all'
  ) {
    let cf: CareFilter = 'sitter';
    if (care === 'need') cf = 'need';
    else if (care === 'guard' || care === 'moms') cf = 'guard';
    else if (care === 'sitter') cf = 'sitter';
    return { topTab: 'certified', care: cf };
  }
  if (view === 'mannaja') return { topTab: 'mannaja', care: 'sitter' };
  return { topTab: 'moija', care: 'sitter' };
}

export function DogSittersPage() {
  const { location } = useUserLocation();
  const routerLocation = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [meetupFeedTick, setMeetupFeedTick] = useState(0);
  useEffect(() => {
    const onMeetups = () => setMeetupFeedTick((t) => t + 1);
    window.addEventListener('daeng-user-meetups-changed', onMeetups);
    return () => window.removeEventListener('daeng-user-meetups-changed', onMeetups);
  }, []);

  const allMeetups = useMemo(
    () => getMergedMeetups(mockMeetups),
    [routerLocation.key, routerLocation.pathname, meetupFeedTick],
  );
  const [topTab, setTopTab] = useState<TopTab>(() => readInitialSittersUrl().topTab);
  const [careFilter, setCareFilter] = useState<CareFilter>(() => readInitialSittersUrl().care);
  const [guardMoms, setGuardMoms] = useState<GuardMomRow[]>([]);
  const [guardLoading, setGuardLoading] = useState(true);
  const [specialty, setSpecialty] = useState('전체');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'reviews'>('distance');
  const [category, setCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [extraLocations, setExtraLocations] = useState<ExtraCareRegion[]>(() => readExtraCareRegions());

  const specialties = ['전체', '소형견', '중형견', '대형견', '퍼피', '시니어'];
  const meetupCategoryChips = useMemo(() => {
    if (topTab === 'mannaja') return ['전체', ...MANNAJA_MEETUP_CATEGORIES] as const;
    if (topTab === 'moija') return ['전체', ...MOIJA_MEETUP_CATEGORIES] as const;
    return ['전체'] as const;
  }, [topTab]);

  /** 거리 계산 기준 구 목록: 앱에 저장된 내 위치 + 사용자가 추가한 동네 */
  const referenceDistricts = useMemo(() => {
    const primary = location.district?.trim();
    const fromExtras = extraLocations.map((e) => e.district.trim()).filter(Boolean);
    return Array.from(new Set([primary, ...fromExtras].filter(Boolean) as string[]));
  }, [location.district, extraLocations]);

  useEffect(() => {
    const load = () => setExtraLocations(readExtraCareRegions());
    load();
    window.addEventListener('daeng-extra-care-regions', load);
    return () => window.removeEventListener('daeng-extra-care-regions', load);
  }, []);

  useEffect(() => {
    if (topTab === 'certified') setExtraLocations(readExtraCareRegions());
  }, [topTab]);

  const distForDistrict = useMemo(() => {
    const userRefs =
      referenceDistricts.length > 0 ? referenceDistricts : [ANYANG_MANAN_DISTANCE_ORIGIN];
    /** 인증 돌봄(맡아주는) 목록은 안양 만안 기준으로 거리 표기 */
    const effectiveRefs = topTab === 'certified' ? [ANYANG_MANAN_DISTANCE_ORIGIN] : userRefs;

    return (district: string) => {
      const d = district?.trim();
      if (!d) return 999;
      const distances = effectiveRefs.map((ref) => calculateDistance(ref, d)).filter((km) => km < 900);
      if (distances.length === 0) {
        const fallback = calculateDistance(ANYANG_MANAN_DISTANCE_ORIGIN, d);
        return fallback < 900 ? fallback : 999;
      }
      return Math.min(...distances);
    };
  }, [referenceDistricts, topTab]);

  useEffect(() => {
    const view = searchParams.get('view');
    const care = searchParams.get('care');
    if (
      view === 'care' ||
      care === 'guard' ||
      care === 'moms' ||
      care === 'sitter' ||
      care === 'need' ||
      care === 'all'
    ) {
      setTopTab('certified');
      if (care === 'need') setCareFilter('need');
      else if (care === 'guard' || care === 'moms') setCareFilter('guard');
      else if (care === 'sitter') setCareFilter('sitter');
      else setCareFilter('sitter');
    } else if (view === 'mannaja') {
      setTopTab('mannaja');
    } else {
      setTopTab('moija');
    }
  }, [searchParams]);

  useEffect(() => {
    if (topTab === 'moija' || topTab === 'mannaja') setCategory('전체');
  }, [topTab]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setGuardLoading(true);
      const { data, error } = await supabase
        .from('certified_guard_moms')
        .select('*')
        .order('listing_visible_until', { ascending: false, nullsFirst: false });
      if (cancelled) return;
      if (error) {
        setGuardMoms([]);
      } else {
        const all = (data ?? []) as GuardMomRow[];
        const now = Date.now();
        const promo = isPromoFreeListings();
        setGuardMoms(
          all.filter((r) => {
            if (r.certified_at == null) return false;
            if (promo) return true;
            return (
              r.listing_visible_until != null && new Date(r.listing_visible_until).getTime() > now
            );
          }),
        );
      }
      setGuardLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const syncCareToUrl = (next: CareFilter) => {
    setCareFilter(next);
    setTopTab('certified');
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set('view', 'care');
        if (next === 'need') p.set('care', 'need');
        else if (next === 'guard') p.set('care', 'guard');
        else p.set('care', 'sitter');
        return p;
      },
      { replace: true },
    );
  };

  const goMoija = () => {
    setCategory('전체');
    setTopTab('moija');
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.delete('view');
        p.delete('care');
        return p;
      },
      { replace: true },
    );
  };

  const goMannaja = () => {
    setCategory('전체');
    setTopTab('mannaja');
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set('view', 'mannaja');
        p.delete('care');
        return p;
      },
      { replace: true },
    );
  };

  const q = searchQuery.trim().toLowerCase();

  /** DB에 노출 중인 보호맘이 없거나 조회 실패 시 가상 프로필 표시(데모) */
  const guardMomsForList = useMemo((): GuardMomRow[] => {
    if (guardMoms.length > 0) return guardMoms;
    return [...mockCertifiedGuardMoms] as unknown as GuardMomRow[];
  }, [guardMoms]);

  const combinedRows: CombinedRow[] = useMemo(() => {
    if (careFilter === 'need') return [];

    let sitters = mockDogSitters.filter((s) => {
      if (specialty !== '전체' && !s.specialties.includes(specialty)) return false;
      if (q) {
        const blob = `${s.name} ${s.description} ${formatDistrictWithDong(s.district, s.dong)}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });

    let moms = guardMomsForList.filter((m) => {
      if (q) {
        const dong = 'region_dong' in m ? String((m as { region_dong?: string }).region_dong ?? '') : '';
        const pickup =
          'offers_daeng_pickup' in m && (m as { offers_daeng_pickup?: boolean }).offers_daeng_pickup
            ? '댕댕픽업'
            : '';
        const blob = `${m.intro} ${m.region_si ?? ''} ${m.region_gu ?? ''} ${dong} ${pickup}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });

    if (careFilter === 'sitter') moms = [];
    if (careFilter === 'guard') sitters = [];

    const sitterRows: CombinedRow[] = sitters.map((sitter) => ({
      kind: 'sitter',
      sitter,
      distance: distForDistrict(sitter.district),
    }));

    const guardRows: CombinedRow[] = moms.map((mom) => ({
      kind: 'guard',
      mom,
      distance: distForDistrict(mom.region_gu ?? ''),
    }));

    const rows = [...sitterRows, ...guardRows];

    rows.sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance;
      if (sortBy === 'rating') {
        if (a.kind !== b.kind) return a.kind === 'sitter' ? -1 : 1;
        if (a.kind === 'sitter' && b.kind === 'sitter') return b.sitter.rating - a.sitter.rating;
        return a.mom.per_day_fee_krw - b.mom.per_day_fee_krw;
      }
      if (sortBy === 'reviews') {
        if (a.kind !== b.kind) return a.kind === 'sitter' ? -1 : 1;
        if (a.kind === 'sitter' && b.kind === 'sitter') return b.sitter.reviewCount - a.sitter.reviewCount;
        return a.mom.per_day_fee_krw - b.mom.per_day_fee_krw;
      }
      return 0;
    });

    return rows;
  }, [careFilter, specialty, sortBy, distForDistrict, guardMomsForList, q]);

  const filteredMeetups = allMeetups
    .filter((req) => {
      const inTab =
        topTab === 'moija'
          ? MOIJA_CATEGORY_SET.has(req.category)
          : topTab === 'mannaja'
            ? MANNAJA_CATEGORY_SET.has(req.category)
            : false;
      if (!inTab) return false;
      if (!meetupVisibleInPublicFeed(req)) return false;
      const categoryMatch = category === '전체' || req.category === category;
      return categoryMatch;
    })
    .slice(0, 20);

  /** 인증 돌봄 · 맡기는 사람(돌봄 카테고리 글) */
  const filteredCareNeedMeetups = useMemo(() => {
    return allMeetups
      .filter((req) => req.category === '돌봄')
      .filter((req) => meetupVisibleInPublicFeed(req))
      .filter((req) => {
        if (!q) return true;
        const blob = `${req.title} ${req.description} ${req.district} ${req.userName}`.toLowerCase();
        return blob.includes(q);
      })
      .slice(0, 50);
  }, [allMeetups, q]);

  // 신청 수 계산
  const getJoinCount = (meetupId: string) => {
    return mockJoinRequests.filter(q => q.meetupId === meetupId).length;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* 상단: 모이자·만나자는 2칸만 / 인증 돌봄은 별도 화면 */}
      <div className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        {topTab === 'certified' ? (
          <div className="mx-auto flex max-w-screen-md items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm text-slate-900" style={{ fontWeight: 900 }}>
              인증 돌봄
            </p>
            <Link
              to="/sitters"
              className="shrink-0 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-[11px] text-orange-700 transition-colors active:scale-[0.98] max-sm:text-[10px]"
              style={{ fontWeight: 800 }}
            >
              모이자 · 만나자
            </Link>
          </div>
        ) : (
          <div className="mx-auto flex max-w-screen-md items-stretch">
            <button
              type="button"
              onClick={goMoija}
              className={`relative flex-1 py-3.5 text-[12px] transition-colors max-sm:text-[11px] ${
                topTab === 'moija' ? 'text-slate-900' : 'text-slate-400'
              }`}
              style={{ fontWeight: 800 }}
            >
              모이자
              {topTab === 'moija' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600" />
              )}
            </button>
            <span
              className="flex items-center px-0.5 text-[13px] font-light text-slate-300 select-none"
              aria-hidden
            >
              /
            </span>
            <button
              type="button"
              onClick={goMannaja}
              className={`relative flex-1 py-3.5 text-[12px] transition-colors max-sm:text-[11px] ${
                topTab === 'mannaja' ? 'text-slate-900' : 'text-slate-400'
              }`}
              style={{ fontWeight: 800 }}
            >
              만나자
              {topTab === 'mannaja' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600" />
              )}
            </button>
          </div>
        )}
      </div>

      {(topTab === 'moija' || topTab === 'mannaja') && (
        <div className="mx-auto max-w-screen-md px-4 py-4">
          <p className="mb-3 rounded-2xl border border-orange-100 bg-orange-50/80 px-3 py-2.5 text-xs font-semibold leading-relaxed text-orange-950">
            {topTab === 'moija' ? (
              <>
                <strong className="font-extrabold">모이자</strong>는 공원·카페 등 장소·일정 잡고{' '}
                <strong>여럿이 모이는 글</strong>만 보여요. 1:1·교배·실종은{' '}
                <strong>만나자</strong>, 맡기기(보호맘 집)·방문 돌봄(댕집사)는{' '}
                <Link to="/sitters?view=care&care=sitter" className="font-extrabold text-brand underline underline-offset-2">
                  인증 돌봄
                </Link>
                .
              </>
            ) : (
              <>
                <strong className="font-extrabold">만나자</strong>는 1:1·교배·실종 글만 보여요. 교배는{' '}
                {isPromoFreeListings() ? (
                  <>지금 무료 노출. </>
                ) : (
                  <>결제 후 7일 노출. </>
                )}
                공원 모임은 <strong>모이자</strong>.
              </>
            )}
          </p>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {meetupCategoryChips.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all ${
                  category === cat
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                style={{ fontWeight: 700 }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredMeetups.map((meetup) => {
              const joinCount = getJoinCount(meetup.id);
              const thumb =
                meetup.images?.find((u) => typeof u === 'string' && u.trim().length > 0) ?? '';
              return (
                <Link
                  key={meetup.id}
                  to={`/meetup/${meetup.id}`}
                  className="block bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-orange-100 active:scale-[0.98] transition-all"
                >
                  <div className="flex gap-4 p-4">
                    <div className="flex h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-yellow-100">
                      {thumb ? (
                        <ImageWithFallback
                          src={thumb}
                          alt={meetup.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl">
                          {meetupCategoryEmoji(meetup.category)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base text-slate-800 mb-1 line-clamp-1" style={{ fontWeight: 800 }}>
                        {meetup.title}
                      </h3>
                      <p className="text-sm text-slate-500 mb-2 line-clamp-2" style={{ fontWeight: 500 }}>
                        {meetup.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400" style={{ fontWeight: 700 }}>
                          <span>{meetup.district}</span>
                          <span>·</span>
                          <span>{formatDistanceToNow(new Date(meetup.createdAt), { locale: ko })} 전</span>
                        </div>
                        {joinCount > 0 && (
                          <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="text-xs" style={{ fontWeight: 700 }}>{joinCount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {topTab === 'certified' && (
        <div className="mx-auto max-w-screen-md px-4 py-4">
          {careFilter === 'need' ? (
            <p className="mb-3 rounded-2xl border border-orange-100 bg-orange-50/90 px-3 py-2.5 text-xs font-semibold leading-relaxed text-orange-950">
              <strong className="font-extrabold">맡기는 사람</strong>은 집 방문 돌봄·맡기기 등을 구하는 돌봄 글이에요
            </p>
          ) : careFilter === 'sitter' ? (
            <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-xs font-semibold leading-relaxed text-amber-950">
              <strong className="font-extrabold">댕집사</strong>는 이웃이 주인 집에 와서 돌봐 주는 방식이에요.
            </p>
          ) : (
            <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-xs font-semibold leading-relaxed text-amber-950">
              <strong className="font-extrabold">인증 보호맘</strong>은 맡기기·픽업·기간 후 인수까지, 보호맘 집에 댕댕이를
              맡기는 방식이에요.
            </p>
          )}

          <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {(
              [
                { id: 'need' as const, label: '맡기는 사람' },
                { id: 'sitter' as const, label: '댕집사' },
                { id: 'guard' as const, label: '인증 보호맘' },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => syncCareToUrl(id)}
                className={`whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm transition-all max-sm:px-3 max-sm:text-[13px] ${
                  careFilter === id
                    ? 'bg-market-cta text-white shadow-market'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
                style={{ fontWeight: 700 }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                careFilter === 'need' ? '제목·내용·동네 검색 🐾' : '이름·소개·동네 검색 🐕'
              }
              className="h-12 w-full rounded-2xl border-transparent bg-slate-50 pl-11 pr-4 text-sm transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10"
              style={{ fontWeight: 500 }}
            />
          </div>

          {careFilter !== 'guard' && careFilter !== 'need' && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {specialties.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setSpecialty(spec)}
                  className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm transition-all ${
                    specialty === spec
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                  style={{ fontWeight: 700 }}
                >
                  {spec}
                </button>
              ))}
            </div>
          )}

          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600" style={{ fontWeight: 700 }}>
              {careFilter === 'need'
                ? `총 ${filteredCareNeedMeetups.length}건`
                : `총 ${combinedRows.length}명`}
            </p>
            {careFilter !== 'need' && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'distance' | 'rating' | 'reviews')}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                style={{ fontWeight: 700 }}
              >
                <option value="distance">🎯 거리 가까운 순</option>
                <option value="rating">⭐ 평점 높은 순</option>
                <option value="reviews">💬 리뷰 많은 순</option>
              </select>
            )}
          </div>
          {careFilter !== 'need' && (
            <p className="-mt-1 mb-3 text-[11px] font-semibold text-slate-400">
              표시 거리는 안양 만안구 기준 대략 거리예요.
            </p>
          )}

          {careFilter === 'need' ? (
            <div className="space-y-3">
              {filteredCareNeedMeetups.map((meetup) => {
                const joinCount = getJoinCount(meetup.id);
                const thumb =
                  meetup.images?.find((u) => typeof u === 'string' && u.trim().length > 0) ?? '';
                return (
                  <Link
                    key={meetup.id}
                    to={`/meetup/${meetup.id}`}
                    className="block overflow-hidden rounded-3xl border border-slate-100 bg-white transition-all hover:border-orange-100 hover:shadow-md active:scale-[0.98]"
                  >
                    <div className="flex gap-4 p-4">
                      <div className="flex h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100">
                        {thumb ? (
                          <ImageWithFallback
                            src={thumb}
                            alt={meetup.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl">
                            {meetupCategoryEmoji(meetup.category)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-orange-600">
                          돌봄 맡기기 글
                        </p>
                        <h3 className="mb-1 line-clamp-1 text-base text-slate-800" style={{ fontWeight: 800 }}>
                          {meetup.title}
                        </h3>
                        <p className="mb-2 line-clamp-2 text-sm text-slate-500" style={{ fontWeight: 500 }}>
                          {meetup.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div
                            className="flex items-center gap-1.5 text-xs text-slate-400"
                            style={{ fontWeight: 700 }}
                          >
                            <span>{meetup.district}</span>
                            <span>·</span>
                            <span>
                              {formatDistanceToNow(new Date(meetup.createdAt), { locale: ko })} 전
                            </span>
                          </div>
                          {joinCount > 0 && (
                            <div className="flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-1 text-orange-600">
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span className="text-xs" style={{ fontWeight: 700 }}>
                                {joinCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {filteredCareNeedMeetups.length === 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <p className="text-sm font-bold text-slate-700">맞는 돌봄 글이 없어요</p>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    검색어를 바꾸거나, 글 올리기에서 돌봄·맡기기 글을 올려 보세요.
                  </p>
                  <Link
                    to="/create-meetup?kind=dolbom"
                    className="mt-4 inline-block rounded-2xl bg-orange-500 px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-orange-500/20 active:scale-[0.98]"
                  >
                    돌봄 글 올리기
                  </Link>
                </div>
              )}
            </div>
          ) : guardLoading && careFilter === 'guard' ? (
            <div className="flex justify-center py-16 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" aria-label="불러오는 중" />
            </div>
          ) : (
            <div className="space-y-3">
              {combinedRows.map((row) =>
                row.kind === 'sitter' ? (
                  <div key={`s-${row.sitter.id}`} className="relative">
                    <DogSitterCard dogSitter={row.sitter} />
                    <div
                      className="pointer-events-none absolute right-4 top-4 flex flex-col items-end gap-1"
                      aria-hidden
                    >
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
                          {(() => {
                            const photo = getCertifiedGuardMomPhotoUrl(row.mom.id);
                            return photo ? (
                              <ImageWithFallback
                                src={photo}
                                alt="인증 보호맘"
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-2xl" aria-hidden>
                                🦴
                              </span>
                            );
                          })()}
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-[10px] font-extrabold uppercase tracking-wide text-brand">
                            인증 보호맘
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-800">
                            {row.mom.intro.trim() || '소개를 준비 중이에요.'}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              {formatCertifiedGuardMomLocation(row.mom)}
                            </span>
                            <span className="text-brand">
                              1일 {row.mom.per_day_fee_krw.toLocaleString('ko-KR')}원부터
                            </span>
                            {row.mom.offers_daeng_pickup === true && (
                              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold text-sky-800">
                                댕댕 픽업
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div
                      className="pointer-events-none absolute right-4 top-4 flex flex-col items-end gap-1"
                      aria-hidden
                    >
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
                  <p className="text-sm font-bold text-slate-700">조건에 맞는 돌보미가 없어요</p>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    필터·검색어를 바꾸거나, 인증 보호맘 등록을 눌러 노출을 시작해 보세요.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Backward compatibility
export { DogSittersPage as RepairersPage };