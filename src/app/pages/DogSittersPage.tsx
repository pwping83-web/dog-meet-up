import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, ClipboardList, Home, CarFront, PawPrint, BadgeCheck } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { mockDogSitters, mockMeetups, mockJoinRequests } from '../data/mockData';
import { ANYANG_MANAN_DISTANCE_ORIGIN, calculateDistance, formatDistance } from '../utils/distance';
import { useUserLocation } from '../../contexts/UserLocationContext';
import { supabase } from '../../lib/supabase';
import type { DogSitter } from '../types';
import { readExtraCareRegions, type ExtraCareRegion } from '../../lib/extraCareRegions';
import { mockCertifiedGuardMoms } from '../data/mockCertifiedGuardMoms';
import { dogSitterFromCertifiedCareRow } from '../../lib/dogSitterFromCertifiedCareRow';
import { displayPublicDolbomMeetupDescription, displayPublicDolbomMeetupTitle } from '../data/virtualDogPhotos';
import {
  MANNAJA_CATEGORY_SET,
  MANNAJA_MEETUP_CATEGORIES,
  MOIJA_CATEGORY_SET,
  MOIJA_MEETUP_CATEGORIES,
} from '../utils/meetupCategory';
import { formatDistrictWithDong } from '../data/regions';
import { meetupVisibleInPublicFeed } from '../utils/meetupPublicVisibility';
import { districtMatchesAnyReference } from '../utils/districtRefMatch';
import { isCareMeetupCategory } from '../utils/meetupCategory';
import { showCertifiedGuardMomDemosWhenEmpty, usePromoFreeListings } from '../../lib/promoFlags';
import { getMergedMeetups } from '../../lib/userMeetupsStore';
import { careProviderListedInFeed } from '../../lib/certifiedGuardCareVisibility';
import { subscribeCertifiedCareDataChanged } from '../../lib/certifiedCareSync';
import { filterCareNeedMeetupsForDistrictTab } from '../../lib/careNeedMeetupFilters';
import {
  labelMeetupNearbyRadiusKm,
  readMeetupNearbyRadiusKm,
  writeMeetupNearbyRadiusKm,
  MEETUP_NEARBY_RADIUS_MAX,
  MEETUP_NEARBY_RADIUS_MIN,
} from '../../lib/meetupNearbyRadiusKm';

/** 인증 댕집사·보호맘: 저장 동네 기준 이 거리 안만 목록에 포함 */
const CERTIFIED_CARE_RADIUS_KM = MEETUP_NEARBY_RADIUS_MAX;

function passesCertifiedCareRadiusFilter(
  locationBasedEnabled: boolean,
  referenceDistricts: readonly string[],
  distKm: number,
): boolean {
  if (!locationBasedEnabled || referenceDistricts.length === 0) return true;
  return distKm < 900 && distKm <= CERTIFIED_CARE_RADIUS_KM;
}
import { useAuth } from '../../contexts/AuthContext';
import { CareNeedList } from '../components/dogSitters/CareNeedList';
import { GuardMomSitterList, type CombinedSitterGuardRow, type GuardMomRow } from '../components/dogSitters/GuardMomSitterList';
import { MoijaMannajaList } from '../components/dogSitters/MoijaMannajaList';

/** need: 돌봄 맡기기 글(주인) / sitter·guard: 맡아주는 쪽 */
type CareFilter = 'need' | 'sitter' | 'guard';

type TopTab = 'moija' | 'mannaja' | 'certified';

type CombinedRow = CombinedSitterGuardRow;
type GuardMomRowWithNick = GuardMomRow & { care_display_name?: string | null };

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
  const [guardMoms, setGuardMoms] = useState<GuardMomRowWithNick[]>([]);
  /** 인증된 댕집사(provider_kind=dog_sitter) — 목록·노출 규칙은 보호맘과 동일 */
  const [dbDogSitters, setDbDogSitters] = useState<GuardMomRowWithNick[]>([]);
  const [guardLoading, setGuardLoading] = useState(true);
  const [guardMomsLoadError, setGuardMomsLoadError] = useState<string | null>(null);
  const [category, setCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [meetupRadiusKm, setMeetupRadiusKm] = useState<number>(() =>
    typeof window !== 'undefined' ? readMeetupNearbyRadiusKm() : 30,
  );
  const [extraLocations, setExtraLocations] = useState<ExtraCareRegion[]>(() => readExtraCareRegions());

  useEffect(() => {
    writeMeetupNearbyRadiusKm(meetupRadiusKm);
  }, [meetupRadiusKm]);

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
    const regionGuFilters = Array.from(
      new Set(referenceDistricts.map((d) => d.trim()).filter(Boolean)),
    );
    const preferredSi = location.city?.trim() || null;

    let query = supabase
      .from('certified_guard_moms')
      .select('*')
      .order('listing_visible_until', { ascending: false, nullsFirst: false });

    if (regionGuFilters.length > 0) {
      // 하이퍼로컬 우선: region_gu(필수) + region_si(가능 시) 조건을 먼저 사용
      query = query.in('region_gu', regionGuFilters);
      if (preferredSi) query = query.eq('region_si', preferredSi);
    }

    const { data, error } = await query;
    if (error) {
      setGuardMoms([]);
      setDbDogSitters([]);
      setGuardMomsLoadError(error.message || '목록을 불러오지 못했어요.');
    } else {
      let all = (data ?? []) as GuardMomRow[];
      if (regionGuFilters.length > 0 && all.length < 300) {
        // 지역 우선을 유지하되, 결과가 적으면 전체 목록으로 뒤를 채움
        const { data: fallback } = await supabase
          .from('certified_guard_moms')
          .select('*')
          .order('listing_visible_until', { ascending: false, nullsFirst: false });
        const localFirst = all;
        const localIds = new Set(localFirst.map((r) => String(r.id)));
        const extras = ((fallback ?? []) as GuardMomRow[]).filter((r) => !localIds.has(String(r.id)));
        all = [...localFirst, ...extras];
      }
      const userIds = Array.from(new Set(all.map((r) => String(r.user_id ?? '').trim()).filter(Boolean)));
      let nickByUserId = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, care_display_name')
          .in('id', userIds);
        nickByUserId = new Map(
          (profiles ?? [])
            .map((p) => [String(p.id ?? ''), String(p.care_display_name ?? '').trim()] as const)
            .filter(([, nick]) => nick.length > 0),
        );
      }
      const withNick: GuardMomRowWithNick[] = all.map((r) => ({
        ...r,
        care_display_name: nickByUserId.get(String(r.user_id)) ?? null,
      }));
      const certifiedRows = withNick.filter((r) => {
        if (r.certified_at == null || String(r.certified_at).trim() === '') return false;
        return !Number.isNaN(new Date(r.certified_at as string).getTime());
      });
      const kind = (r: GuardMomRowWithNick) => (r as { provider_kind?: string }).provider_kind ?? 'guard_mom';
      setGuardMoms(certifiedRows.filter((r) => kind(r) !== 'dog_sitter'));
      setDbDogSitters(certifiedRows.filter((r) => kind(r) === 'dog_sitter'));
    }
    setGuardLoading(false);
  }, [location.city, referenceDistricts]);

  useEffect(() => {
    void refetchGuardMoms();
  }, [refetchGuardMoms, user?.id]);

  useEffect(() => subscribeCertifiedCareDataChanged(() => void refetchGuardMoms()), [refetchGuardMoms]);

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

  /** 보호맘 DB+데모: 기기별 동네 차이로 목록이 달라지지 않게 전체 노출(정렬은 거리순 유지) */
  const guardMomsForList = useMemo((): GuardMomRow[] => {
    if (guardMomsLoadError) return [];
    const listedRows =
      guardMomUiDemoFill && guardMoms.length === 0
        ? ([...mockCertifiedGuardMoms] as unknown as GuardMomRow[])
        : guardMoms;
    if (listedRows.length === 0) return [];
    return listedRows;
  }, [
    guardMomsLoadError,
    guardMomUiDemoFill,
    guardMoms,
  ]);

  /** DB에는 있는데 반경 안에 0명일 때 안내 */
  const certifiedGuardNobodyInRadius =
    careFilter === 'guard' &&
    locationBasedEnabled &&
    referenceDistricts.length > 0 &&
    guardMoms.length > 0 &&
    guardMomsForList.length === 0 &&
    !guardMomUiDemoFill;

  const combinedRows: CombinedRow[] = useMemo(() => {
    if (careFilter === 'need') return [];

    const listedSittersFromDb: DogSitter[] = dbDogSitters
      .filter((m) => careProviderListedInFeed(m, promoFree))
      .filter((m) => {
        if (!q) return true;
        const blob = `${m.intro ?? ''} ${m.region_si ?? ''} ${m.region_gu ?? ''}`.toLowerCase();
        return blob.includes(q);
      })
      .map((m) => dogSitterFromCertifiedCareRow(m, m.care_display_name ?? null));

    const nearbySittersFromDb: DogSitter[] = listedSittersFromDb.filter((sitter) => {
      const km = distForDistrict(sitter.district);
      return passesCertifiedCareRadiusFilter(locationBasedEnabled, referenceDistricts, km);
    });

    // 근거리 우선: 근처가 0명이면 목록 자체가 비지 않도록 전체 노출로 폴백
    const sittersFromDb: DogSitter[] =
      locationBasedEnabled && referenceDistricts.length > 0 && nearbySittersFromDb.length === 0
        ? listedSittersFromDb
        : nearbySittersFromDb;

    const mockSittersForCare =
      careFilter === 'sitter'
        ? []
        : mockDogSitters.filter((s) => {
            const d = s.district?.trim();
            if (!d) return false;
            const km = distForDistrict(d);
            if (!passesCertifiedCareRadiusFilter(locationBasedEnabled, referenceDistricts, km)) return false;
            if (q) {
              const blob = `${s.name} ${s.description} ${formatDistrictWithDong(s.district, s.dong)}`.toLowerCase();
              if (!blob.includes(q)) return false;
            }
            return true;
          });

    let sitters = [...sittersFromDb, ...mockSittersForCare];

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
      distance: distForDistrict(
        [String(mom.region_si ?? '').trim(), String(mom.region_gu ?? '').trim()].filter(Boolean).join(' ') ||
          String(mom.region_gu ?? '').trim(),
      ),
    }));

    const rows = [...sitterRows, ...guardRows];

    rows.sort((a, b) => a.distance - b.distance);

    return rows;
  }, [
    careFilter,
    distForDistrict,
    guardMomsForList,
    dbDogSitters,
    promoFree,
    q,
    locationBasedEnabled,
    referenceDistricts,
  ]);

  const sitterFallbackToAllRegion =
    careFilter === 'sitter' &&
    locationBasedEnabled &&
    referenceDistricts.length > 0 &&
    dbDogSitters.filter((m) => careProviderListedInFeed(m, promoFree)).length > 0 &&
    dbDogSitters.filter((m) => {
      if (!careProviderListedInFeed(m, promoFree)) return false;
      const label = (m.region_gu ?? m.region_si ?? '').trim();
      const km = distForDistrict(label);
      return passesCertifiedCareRadiusFilter(locationBasedEnabled, referenceDistricts, km);
    }).length === 0;

  const meetupMatchesRegion = useCallback(
    (district: string) => {
      if (!locationBasedEnabled) return true;
      /** 기준 구가 없으면 `districtMatchesAnyReference(..., [])`가 항상 false라 피드가 비는 것을 막음 */
      if (referenceDistricts.length === 0) return true;
      const d = district?.trim();
      if (!d) return false;
      return districtMatchesAnyReference(d, referenceDistricts);
    },
    [locationBasedEnabled, referenceDistricts],
  );

  const filteredMeetups = useMemo(() => {
    const viewerId = user?.id ?? '';
    const inTabRows = allMeetups.filter((req) => {
      const inTab =
        topTab === 'moija'
          ? MOIJA_CATEGORY_SET.has(req.category)
          : topTab === 'mannaja'
            ? MANNAJA_CATEGORY_SET.has(req.category)
            : false;
      if (!inTab) return false;
      if (!meetupVisibleInPublicFeed(req, promoFree)) return false;
      const categoryMatch = category === '전체' || req.category === category;
      return categoryMatch;
    });

    const canApplyRadius =
      locationBasedEnabled && meetupRadiusKm > 0 && referenceDistricts.length > 0;

    const passesRadius = (district: string) =>
      !canApplyRadius || distForDistrict(district) <= meetupRadiusKm;

    // 하이퍼로컬 우선: 동네 매칭 + (선택) 거리(km). 결과 0이면 거리만 적용한 폴백 → 그다음 탭 전체
    // 인증 로딩(authLoading)과 무관하게 적용 — 로딩 중에만 필터를 끄면 모바일 새로고침 시 글이 잠깐 많이 보였다 사라지는 깜빡임이 남
    if (locationBasedEnabled && referenceDistricts.length > 0) {
      const regionRows = inTabRows.filter((req) => {
        const isMine = viewerId !== '' && req.userId === viewerId;
        if (isMine) return true;
        if (!meetupMatchesRegion(req.district)) return false;
        return passesRadius(req.district);
      });
      if (regionRows.length > 0) return regionRows.slice(0, 20);

      if (canApplyRadius) {
        const byKm = inTabRows.filter((req) => {
          const isMine = viewerId !== '' && req.userId === viewerId;
          if (isMine) return true;
          return passesRadius(req.district);
        });
        if (byKm.length > 0) return byKm.slice(0, 20);
        return [];
      }

      return inTabRows.slice(0, 20);
    }

    return inTabRows.slice(0, 20);
  }, [
    allMeetups,
    topTab,
    category,
    promoFree,
    meetupMatchesRegion,
    user?.id,
    locationBasedEnabled,
    referenceDistricts,
    meetupRadiusKm,
    distForDistrict,
  ]);

  /** 인증 돌봄 · 맡기는 사람(돌봄 카테고리 글) */
  const filteredCareNeedMeetups = useMemo(() => {
    const base = filterCareNeedMeetupsForDistrictTab(allMeetups, {
      promoFree,
      locationBasedEnabled,
      referenceDistricts,
      viewerUserId: user?.id ?? '',
    });
    const qq = q.trim().toLowerCase();
    return base
      .filter((req) => {
        if (!qq) return true;
        const blob = `${displayPublicDolbomMeetupTitle(req)} ${displayPublicDolbomMeetupDescription(req)} ${req.title} ${req.description} ${req.district} ${req.userName}`
          .toLowerCase();
        return blob.includes(qq);
      })
      .slice(0, 50);
  }, [allMeetups, q, promoFree, locationBasedEnabled, referenceDistricts, user?.id]);

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
          <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
            <div className="mb-2 flex items-end justify-between gap-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">내 동네에서 최대 거리</p>
              <p className="text-sm font-black tabular-nums text-slate-900">{labelMeetupNearbyRadiusKm(meetupRadiusKm)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-7 shrink-0 text-center text-[10px] font-extrabold text-slate-400">{MEETUP_NEARBY_RADIUS_MIN}</span>
              <input
                type="range"
                min={MEETUP_NEARBY_RADIUS_MIN}
                max={MEETUP_NEARBY_RADIUS_MAX}
                step={1}
                value={meetupRadiusKm}
                onChange={(e) => setMeetupRadiusKm(Number(e.target.value))}
                className="h-2 w-full flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-orange-500 transition-[box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2"
                aria-valuemin={MEETUP_NEARBY_RADIUS_MIN}
                aria-valuemax={MEETUP_NEARBY_RADIUS_MAX}
                aria-valuenow={meetupRadiusKm}
                aria-label="최대 거리 킬로미터"
              />
              <span className="w-7 shrink-0 text-center text-[10px] font-extrabold text-slate-400">{MEETUP_NEARBY_RADIUS_MAX}</span>
            </div>
            <p className="mt-1.5 text-center text-[10px] font-medium text-slate-400">1km ~ {MEETUP_NEARBY_RADIUS_MAX}km · 드래그로 조절</p>
            {!locationBasedEnabled ? (
              <p className="mt-2 text-[11px] font-semibold text-amber-800">위치 기반을 켜면 거리 필터가 적용돼요.</p>
            ) : referenceDistricts.length === 0 ? (
              <p className="mt-2 text-[11px] font-semibold text-slate-500">동네를 먼저 설정하면 거리 필터를 쓸 수 있어요.</p>
            ) : null}
          </div>
          <MoijaMannajaList
            topTab={topTab}
            meetupCategoryChips={meetupCategoryChips}
            category={category}
            onCategoryChange={setCategory}
            filteredMeetups={filteredMeetups}
            getJoinCount={getJoinCount}
            getDistanceLabel={(district) => {
              const km = distForDistrict(district);
              return km < 900 ? formatDistance(km) : null;
            }}
            emptyExtraHint={
              meetupRadiusKm < MEETUP_NEARBY_RADIUS_MAX && locationBasedEnabled && referenceDistricts.length > 0
                ? '슬라이더로 거리를 넓혀 보세요.'
                : undefined
            }
          />
        </div>
      )}

      {topTab === 'certified' && (
        <div className="mx-auto max-w-screen-md px-4 py-4">
          <div className="-mx-4 sticky top-0 z-30 mb-3 border-b border-slate-100 bg-slate-50/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-slate-50/85">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(
                [
                  { id: 'need' as const, label: '맡기는 사람' },
                  { id: 'sitter' as const, label: '댕집사' },
                  { id: 'guard' as const, label: '인증 보호맘' },
                ] as const
              ).map(({ id, label }) => {
                const isGuard = id === 'guard';
                const active = careFilter === id;
                const tabClass = active
                  ? isGuard
                    ? 'border-transparent bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 text-white shadow-lg shadow-violet-300/40 ring-1 ring-white/30'
                    : 'border-transparent bg-market-cta text-white shadow-market'
                  : isGuard
                    ? 'border-2 border-violet-200/95 bg-gradient-to-br from-violet-50 to-fuchsia-50/90 text-violet-900 hover:border-fuchsia-300 hover:from-violet-100/90 hover:to-fuchsia-50'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50';
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => syncCareToUrl(id)}
                    className={`inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm transition-all max-sm:px-3 max-sm:text-[13px] ${tabClass}`}
                    style={{ fontWeight: 700 }}
                  >
                    {isGuard ? <BadgeCheck className="h-4 w-4 shrink-0 opacity-95" aria-hidden /> : null}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {careFilter === 'need' ? (
            <div className="mb-3 flex items-center gap-2.5 rounded-2xl border border-orange-100 bg-orange-50/90 px-3 py-2.5 text-orange-950">
              <ClipboardList className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
              <p className="text-xs font-medium leading-snug">
                <span className="font-extrabold">맡기는 사람</span> — 방문 돌봄·맡기기 같은 글이 모여 있어요.
              </p>
            </div>
          ) : careFilter === 'sitter' ? (
            <div className="mb-3 rounded-2xl border border-violet-200/90 bg-gradient-to-br from-violet-50 via-fuchsia-50/70 to-white px-3 py-3 text-violet-950 shadow-sm ring-1 ring-violet-100/80">
              <p className="mb-1.5 flex items-center justify-center gap-1 text-center text-[11px] font-extrabold text-violet-900">
                <BadgeCheck className="h-4 w-4 shrink-0 text-fuchsia-600" aria-hidden />
                인증 댕집사 — 방문 전용 케어
              </p>
              <p className="mb-2 text-center text-[10px] font-semibold text-violet-800/90">운영 인증을 거친 믿을 수 있는 방문 돌봄이에요</p>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-xl border border-violet-100/80 bg-white/90 px-1 py-2 shadow-sm">
                  <Home className="mx-auto h-4 w-4 text-violet-600" aria-hidden />
                  <p className="mt-1 text-[10px] font-bold leading-tight text-violet-950">댕댕이네집에 방문</p>
                </div>
                <div className="rounded-xl border border-violet-100/80 bg-white/90 px-1 py-2 shadow-sm">
                  <PawPrint className="mx-auto h-4 w-4 text-fuchsia-600" aria-hidden />
                  <p className="mt-1 text-[10px] font-bold leading-tight text-violet-950">산책·놀이 케어</p>
                </div>
                <div className="rounded-xl border border-violet-100/80 bg-white/90 px-1 py-2 shadow-sm">
                  <BadgeCheck className="mx-auto h-4 w-4 text-violet-600" aria-hidden />
                  <p className="mt-1 text-[10px] font-bold leading-tight text-violet-950">돌봄 후기 공유</p>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] font-medium leading-snug text-violet-900/85">
                돌봄 방식은 댕집사님과 채팅으로 맞춰서 편하게 정하면 돼요~
              </p>
            </div>
          ) : (
            <div className="mb-3 rounded-2xl border border-violet-200/90 bg-gradient-to-br from-violet-50 via-fuchsia-50/70 to-white px-3 py-3 text-violet-950 shadow-sm ring-1 ring-violet-100/80">
              <p className="mb-1.5 flex items-center justify-center gap-1 text-center text-[11px] font-extrabold text-violet-900">
                <BadgeCheck className="h-4 w-4 shrink-0 text-fuchsia-600" aria-hidden />
                인증 보호맘 — 맡기기 전용 케어
              </p>
              <p className="mb-2 text-center text-[10px] font-semibold text-violet-800/90">운영 인증을 거친 소중한 돌봄이에요</p>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-xl border border-violet-100/80 bg-white/90 px-1 py-2 shadow-sm">
                  <Home className="mx-auto h-4 w-4 text-violet-600" aria-hidden />
                  <p className="mt-1 text-[10px] font-bold leading-tight text-violet-950">돌봄 집에 맡기기</p>
                </div>
                <div className="rounded-xl border border-violet-100/80 bg-white/90 px-1 py-2 shadow-sm">
                  <CarFront className="mx-auto h-4 w-4 text-fuchsia-600" aria-hidden />
                  <p className="mt-1 text-[10px] font-bold leading-tight text-violet-950">필요하면 픽업</p>
                </div>
                <div className="rounded-xl border border-violet-100/80 bg-white/90 px-1 py-2 shadow-sm">
                  <PawPrint className="mx-auto h-4 w-4 text-violet-600" aria-hidden />
                  <p className="mt-1 text-[10px] font-bold leading-tight text-violet-950">끝나면 집으로</p>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] font-medium leading-snug text-violet-900/85">
                바래다주기·데리러 오기 등은 보호맘님이랑 채팅으로 천천히 정하면 돼요~
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
                careFilter === 'need'
                  ? '제목·내용·동네 검색 🐾'
                  : careFilter === 'sitter'
                    ? '소개·동네 검색'
                    : '이름·소개·동네 검색 🐕'
              }
              className="h-12 w-full rounded-2xl border-transparent bg-slate-50 pl-11 pr-4 text-sm transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10"
              style={{ fontWeight: 500 }}
            />
          </div>

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
              {careFilter === 'guard' && certifiedGuardNobodyInRadius && (
                <p className="mt-0.5 text-[11px] font-semibold text-amber-700">
                  저장된 동네 기준 {CERTIFIED_CARE_RADIUS_KM}km 안에 등록된 보호맘이 없어요.
                </p>
              )}
              {careFilter === 'sitter' &&
                locationBasedEnabled &&
                referenceDistricts.length > 0 &&
                combinedRows.length === 0 &&
                dbDogSitters.some((m) => careProviderListedInFeed(m, promoFree)) && (
                  <p className="mt-0.5 text-[11px] font-semibold text-amber-700">
                    저장된 동네 기준 {CERTIFIED_CARE_RADIUS_KM}km 안에 노출 중인 댕집사가 없어요.
                  </p>
                )}
              {sitterFallbackToAllRegion && (
                <p className="mt-0.5 text-[11px] font-semibold text-sky-700">
                  근처 댕집사가 없어 전체 지역 결과를 함께 보여줘요.
                </p>
              )}
            </div>
            {careFilter !== 'need' && (
              <span
                className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                style={{ fontWeight: 700 }}
              >
                🎯 거리 가까운 순
              </span>
            )}
          </div>
          {careFilter !== 'need' && (
            <p className="-mt-1 mb-3 text-[11px] font-semibold text-slate-400">
              {locationBasedEnabled && referenceDistricts.length > 0
                ? `저장된 동네 기준 약 ${CERTIFIED_CARE_RADIUS_KM}km 안만 보여요.`
                : '동네를 설정하면 그 기준으로 거리를 맞춰요. 설정 전에는 인증 돌보미를 모두 보여요.'}
            </p>
          )}

          {careFilter === 'need' ? (
            <CareNeedList
              filteredCareNeedMeetups={filteredCareNeedMeetups}
              getJoinCount={getJoinCount}
              getDistanceLabel={(district) => {
                const km = distForDistrict(district);
                return km < 900 ? formatDistance(km) : null;
              }}
            />
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