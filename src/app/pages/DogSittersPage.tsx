import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, ClipboardList, Home, CarFront, PawPrint } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { mockDogSitters, mockMeetups, mockJoinRequests } from '../data/mockData';
import { ANYANG_MANAN_DISTANCE_ORIGIN, calculateDistance, formatDistance } from '../utils/distance';
import { useUserLocation } from '../../contexts/UserLocationContext';
import { supabase } from '../../lib/supabase';
import type { DogSitter } from '../types';
import { readExtraCareRegions, type ExtraCareRegion } from '../../lib/extraCareRegions';
import { mockCertifiedGuardMoms } from '../data/mockCertifiedGuardMoms';
import { displayPublicDolbomMeetupDescription, displayPublicDolbomMeetupTitle } from '../data/virtualDogPhotos';
import {
  MANNAJA_CATEGORY_SET,
  MANNAJA_MEETUP_CATEGORIES,
  MOIJA_CATEGORY_SET,
  MOIJA_MEETUP_CATEGORIES,
} from '../utils/meetupCategory';
import { formatDistrictWithDong } from '../data/regions';
import { meetupVisibleInPublicFeed } from '../utils/meetupPublicVisibility';
import { isCareMeetupCategory } from '../utils/meetupCategory';
import { showCertifiedGuardMomDemosWhenEmpty, usePromoFreeListings } from '../../lib/promoFlags';
import { getMergedMeetups } from '../../lib/userMeetupsStore';
import { useAuth } from '../../contexts/AuthContext';
import { CareNeedList } from '../components/dogSitters/CareNeedList';
import { GuardMomSitterList, type CombinedSitterGuardRow, type GuardMomRow } from '../components/dogSitters/GuardMomSitterList';
import { MoijaMannajaList } from '../components/dogSitters/MoijaMannajaList';

/** need: 돌봄 맡기기 글(주인) / sitter·guard: 맡아주는 쪽 */
type CareFilter = 'need' | 'sitter' | 'guard';

type TopTab = 'moija' | 'mannaja' | 'certified';

type CombinedRow = CombinedSitterGuardRow;

function normalizeGuText(v: string): string {
  return v.replace(/\s+/g, '').replace(/시/g, '').trim();
}

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
  const { user } = useAuth();
  const { location, locationBasedEnabled } = useUserLocation();
  const promoFree = usePromoFreeListings();
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
  const [guardMomsLoadError, setGuardMomsLoadError] = useState<string | null>(null);
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
    /** 인증 돌봄 탭: 저장된 동네(없으면 안양 만안) 기준 거리 표기 */
    const effectiveRefs =
      topTab === 'certified'
        ? referenceDistricts.length > 0
          ? referenceDistricts
          : [ANYANG_MANAN_DISTANCE_ORIGIN]
        : userRefs;

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

  const refetchGuardMoms = useCallback(async () => {
    setGuardLoading(true);
    setGuardMomsLoadError(null);
    const { data, error } = await supabase
      .from('certified_guard_moms')
      .select('*')
      .order('listing_visible_until', { ascending: false, nullsFirst: false });
    if (error) {
      setGuardMoms([]);
      setGuardMomsLoadError(error.message || '목록을 불러오지 못했어요.');
    } else {
      const all = (data ?? []) as GuardMomRow[];
      /** 노출 여부는 Supabase RLS가 결정. 프론트에서 유료/프로모를 한 번 더 걸면 .env 와 DB 정책이 어긋날 때 전부 숨겨질 수 있음 */
      setGuardMoms(all.filter((r) => r.certified_at != null));
    }
    setGuardLoading(false);
  }, []);

  useEffect(() => {
    void refetchGuardMoms();
  }, [refetchGuardMoms, user?.id]);

  useEffect(() => {
    const on = () => {
      void refetchGuardMoms();
    };
    window.addEventListener('daeng-certified-guard-moms-changed', on);
    return () => window.removeEventListener('daeng-certified-guard-moms-changed', on);
  }, [refetchGuardMoms]);

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

  /** 인증 보호맘 탭 + DB 0명일 때만 목업 카드(로컬 기본). 운영은 promoFlags 참고. */
  const guardMomUiDemoFill =
    careFilter === 'guard' &&
    !guardMomsLoadError &&
    guardMoms.length === 0 &&
    showCertifiedGuardMomDemosWhenEmpty();

  const guardMomsRegionFiltered = useMemo(() => {
    if (!locationBasedEnabled) return guardMoms;
    const setD = new Set(referenceDistricts.map((x) => normalizeGuText(x)).filter(Boolean));
    if (setD.size === 0) return guardMoms;
    return guardMoms.filter((m) => setD.has(normalizeGuText(m.region_gu ?? '')));
  }, [guardMoms, locationBasedEnabled, referenceDistricts]);

  const guardRegionFallbackUsed =
    careFilter === 'guard' &&
    locationBasedEnabled &&
    guardMoms.length > 0 &&
    guardMomsRegionFiltered.length === 0;

  /** DB에서 온 인증 행만 쓰고, 데모 모드일 때만 목업을 이어 붙임. */
  const guardMomsForList = useMemo((): GuardMomRow[] => {
    if (guardMomsLoadError) return [];
    if (guardMomsRegionFiltered.length > 0) return guardMomsRegionFiltered;
    if (guardRegionFallbackUsed) return guardMoms;
    if (guardMomUiDemoFill) return [...mockCertifiedGuardMoms] as unknown as GuardMomRow[];
    return [];
  }, [guardMomsRegionFiltered, guardMomsLoadError, guardRegionFallbackUsed, guardMoms, guardMomUiDemoFill]);

  const combinedRows: CombinedRow[] = useMemo(() => {
    if (careFilter === 'need') return [];

    let sitters = mockDogSitters.filter((s) => {
      if (locationBasedEnabled) {
        const d = s.district?.trim();
        if (!d || !referenceDistricts.includes(d)) return false;
      }
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
        const introShown = displayCertifiedGuardMomIntro(m);
        const blob = `${introShown} ${m.region_si ?? ''} ${m.region_gu ?? ''} ${dong} ${pickup}`.toLowerCase();
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
  }, [
    careFilter,
    specialty,
    sortBy,
    distForDistrict,
    guardMomsForList,
    q,
    locationBasedEnabled,
    referenceDistricts,
  ]);

  const meetupMatchesRegion = useCallback(
    (district: string) => {
      if (!locationBasedEnabled) return true;
      const d = district?.trim();
      if (!d) return false;
      return referenceDistricts.includes(d);
    },
    [locationBasedEnabled, referenceDistricts],
  );

  const filteredMeetups = useMemo(
    () =>
      allMeetups
        .filter((req) => {
          const viewerId = user?.id ?? '';
          const isMine = viewerId !== '' && req.userId === viewerId;
          const inTab =
            topTab === 'moija'
              ? MOIJA_CATEGORY_SET.has(req.category)
              : topTab === 'mannaja'
                ? MANNAJA_CATEGORY_SET.has(req.category)
                : false;
          if (!inTab) return false;
          if (!meetupVisibleInPublicFeed(req, promoFree)) return false;
          if (!isMine && !meetupMatchesRegion(req.district)) return false;
          const categoryMatch = category === '전체' || req.category === category;
          return categoryMatch;
        })
        .slice(0, 20),
    [allMeetups, topTab, category, promoFree, meetupMatchesRegion, user?.id],
  );

  /** 인증 돌봄 · 맡기는 사람(돌봄 카테고리 글) */
  const filteredCareNeedMeetups = useMemo(() => {
    return allMeetups
      .filter((req) => isCareMeetupCategory(req.category))
      .filter((req) => meetupVisibleInPublicFeed(req, promoFree))
      .filter((req) => meetupMatchesRegion(req.district))
      .filter((req) => {
        if (!q) return true;
        const blob = `${displayPublicDolbomMeetupTitle(req)} ${displayPublicDolbomMeetupDescription(req)} ${req.title} ${req.description} ${req.district} ${req.userName}`
          .toLowerCase();
        return blob.includes(q);
      })
      .slice(0, 50);
  }, [allMeetups, q, promoFree, meetupMatchesRegion]);

  // 신청 수 계산
  const getJoinCount = (meetupId: string) => {
    return mockJoinRequests.filter(q => q.meetupId === meetupId).length;
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* 상단: 모이자·만나자 탭만 스티키 / 인증 돌봄(certified)은 제목·모이자 링크 없이 바로 필터·목록 */}
      {topTab !== 'certified' && (
        <div className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
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
        </div>
      )}

      {(topTab === 'moija' || topTab === 'mannaja') && (
        <div className="mx-auto max-w-screen-md px-4 py-4">
          <MoijaMannajaList
            topTab={topTab}
            meetupCategoryChips={meetupCategoryChips}
            category={category}
            onCategoryChange={setCategory}
            filteredMeetups={filteredMeetups}
            getJoinCount={getJoinCount}
          />
        </div>
      )}

      {topTab === 'certified' && (
        <div className="mx-auto max-w-screen-md px-4 py-4">
          {careFilter === 'need' ? (
            <div className="mb-3 flex items-center gap-2.5 rounded-2xl border border-orange-100 bg-orange-50/90 px-3 py-2.5 text-orange-950">
              <ClipboardList className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
              <p className="text-xs font-medium leading-snug">
                <span className="font-extrabold">맡기는 사람</span> — 방문 돌봄·맡기기 같은 글이 모여 있어요.
              </p>
            </div>
          ) : careFilter === 'sitter' ? (
            <div className="mb-3 flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-amber-950">
              <Home className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
              <p className="text-xs font-medium leading-snug">
                <span className="font-extrabold">댕집사</span> — 이웃이 우리 집에 와서 돌봐 줘요.
              </p>
            </div>
          ) : (
            <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-3 py-3 text-amber-950">
              <p className="mb-2 text-center text-[11px] font-extrabold text-amber-900">보호맘은 보통 이렇게 맞춰요</p>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-xl bg-white/85 px-1 py-2 shadow-sm">
                  <Home className="mx-auto h-4 w-4 text-amber-600" aria-hidden />
                  <p className="mt-1 text-[10px] font-bold leading-tight">돌봄 집에 맡기기</p>
                </div>
                <div className="rounded-xl bg-white/85 px-1 py-2 shadow-sm">
                  <CarFront className="mx-auto h-4 w-4 text-amber-600" aria-hidden />
                  <p className="mt-1 text-[10px] font-bold leading-tight">필요하면 픽업</p>
                </div>
                <div className="rounded-xl bg-white/85 px-1 py-2 shadow-sm">
                  <PawPrint className="mx-auto h-4 w-4 text-amber-600" aria-hidden />
                  <p className="mt-1 text-[10px] font-bold leading-tight">끝나면 집으로</p>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] font-medium leading-snug text-amber-900/90">
                바래다주기·데리러 오기 등은 보호맘님이랑 채팅으로 천천히 정하면 돼요~
              </p>
            </div>
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

          {careFilter === 'need' && filteredCareNeedMeetups.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-orange-200/80 bg-white px-3 py-2.5 shadow-sm">
              <p className="text-[11px] font-bold leading-snug text-slate-700">
                방문·맡기기 구인은 <span className="text-orange-700">돌봄 글</span>로 올려요
              </p>
              <Link
                to="/create-meetup?kind=dolbom"
                className="shrink-0 rounded-xl bg-orange-500 px-3 py-2 text-[11px] font-extrabold text-white shadow-sm active:scale-[0.98]"
              >
                돌봄 글 쓰기
              </Link>
            </div>
          )}

          {careFilter === 'sitter' && (
            <div className="mb-3 space-y-2 rounded-2xl border border-amber-200/90 bg-white px-3 py-2.5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-bold leading-snug text-slate-700">
                  댕집사 <span className="text-amber-800">구인</span>도 돌봄 글이에요
                </p>
                <Link
                  to="/create-meetup?kind=dolbom"
                  className="shrink-0 rounded-xl bg-amber-600 px-3 py-2 text-[11px] font-extrabold text-white shadow-sm active:scale-[0.98]"
                >
                  돌봄 글 쓰기
                </Link>
              </div>
              <p className="text-[10px] font-semibold leading-snug text-slate-500">
                댕집사로 <strong className="text-slate-700">소개·등록</strong> 글은 아직 여기서 못 써요.{' '}
                <Link to="/customer-service" className="font-extrabold text-violet-700 underline underline-offset-2">
                  고객센터
                </Link>
              </p>
            </div>
          )}

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
            <div className="min-w-0">
              <p className="text-sm text-slate-600" style={{ fontWeight: 700 }}>
                {careFilter === 'need'
                  ? `총 ${filteredCareNeedMeetups.length}건`
                  : careFilter === 'guard' && guardMomUiDemoFill
                    ? `예시 ${combinedRows.length}명`
                    : `총 ${combinedRows.length}명`}
              </p>
              {careFilter === 'guard' && guardMomUiDemoFill && (
                <p className="mt-0.5 text-[11px] font-semibold text-sky-800">실제 DB 노출 0명 · 카드는 UI 데모</p>
              )}
              {careFilter === 'guard' && guardRegionFallbackUsed && !guardMomUiDemoFill && (
                <p className="mt-0.5 text-[11px] font-semibold text-amber-700">
                  내 동네와 일치하는 보호맘이 없어 전체 지역 순으로 보여줘요.
                </p>
              )}
            </div>
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
            <CareNeedList filteredCareNeedMeetups={filteredCareNeedMeetups} getJoinCount={getJoinCount} />
          ) : (
            <GuardMomSitterList
              careFilter={careFilter}
              combinedRows={combinedRows}
              guardLoading={guardLoading}
              guardMomsLoadError={guardMomsLoadError}
              guardMomUiDemoFill={guardMomUiDemoFill}
              guardMomsCount={guardMoms.length}
              searchQuery={searchQuery}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Backward compatibility
export { DogSittersPage as RepairersPage };