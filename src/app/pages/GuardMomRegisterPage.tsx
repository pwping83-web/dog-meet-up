import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  ArrowLeft,
  Loader2,
  BadgeCheck,
  ListTree,
  Home,
  CarFront,
  PawPrint,
  MessagesSquare,
  Shield,
  Eye,
  EyeOff,
  LocateFixed,
  MapPin,
  Plus,
  Clock,
} from 'lucide-react';
import { PawTabIcon } from '../components/icons/PawTabIcon';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useUserLocation } from '../../contexts/UserLocationContext';
import { startStripeCheckout } from '../../lib/billing';
import { PROMO_FREE_LAUNCH_TITLE, usePromoFreeListings } from '../../lib/promoFlags';
import { AiDoumiButton } from '../components/AiDoumiButton';
import { readCareProviderTrack, writeCareProviderTrack } from '../../lib/careProviderTrack';
import { displayNameFromUser } from '../../lib/ensurePublicProfile';
import { normalizeIntroPhotoUrls } from '../../lib/careIntroPhotoUpload';
import { CareIntroPhotoPicker } from '../components/CareIntroPhotoPicker';
import { broadcastCertifiedCareDataChanged } from '../../lib/certifiedCareSync';
import { removeUserMeetupsByUserId, syncMeetupsFromDb } from '../../lib/userMeetupsStore';
import { toast } from 'sonner';
import { RegionSelector } from '../components/RegionSelector';
import { formatRegion } from '../data/regions';
import { readExtraCareRegions, writeExtraCareRegions } from '../../lib/extraCareRegions';

type GuardMomRow = Database['public']['Tables']['certified_guard_moms']['Row'];

/** PostgREST·Postgres 오류 → 한글 안내 (배포 담당자용 파일 경로 포함) */
function friendlyCertifiedGuardMomsError(message: string): string {
  const m = message.toLowerCase();
  const columnMissing = m.includes('column') && m.includes('does not exist');

  if (columnMissing && m.includes('provider_kind')) {
    return '댕집사·보호맘 구분 컬럼이 DB에 없어요. Supabase → SQL Editor에서 supabase/migrations/20260421120000_certified_guard_moms_provider_kind.sql 을 실행한 뒤 다시 저장해 주세요.';
  }
  if (m.includes('intro_photo_urls') || (columnMissing && m.includes('intro_photo'))) {
    return '소개 사진 컬럼이 없어요. supabase/migrations/20260424160000_certified_guard_moms_intro_photo_urls.sql 을 SQL Editor에서 실행해 주세요.';
  }
  if (m.includes('offers_daeng_pickup') || (columnMissing && m.includes('offers_daeng'))) {
    return '「댕댕 픽업」 컬럼이 없어요. supabase/migrations/20260412120000_daeng_pickup.sql 을 SQL Editor에서 실행해 주세요.';
  }

  const tableMissing =
    m.includes('certified_guard_moms') &&
    !columnMissing &&
    (m.includes('could not find') ||
      (m.includes('relation') && m.includes('does not exist')) ||
      (m.includes('schema cache') && m.includes('could not find')));
  if (tableMissing) {
    return '인증 돌봄 테이블을 찾을 수 없어요. Supabase → SQL Editor에서 supabase/migrations/20260411120000_guard_moms.sql 과 20260412120000_daeng_pickup.sql 을 순서대로 실행해 주세요.';
  }
  return message;
}

const SITTER_INTRO_STORAGE_PREFIX = 'daeng-sitter-apply-intro:';

function readSitterIntro(uid: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(`${SITTER_INTRO_STORAGE_PREFIX}${uid}`) ?? '';
  } catch {
    return '';
  }
}

function writeSitterIntro(uid: string, text: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${SITTER_INTRO_STORAGE_PREFIX}${uid}`, text);
  } catch {
    /* ignore */
  }
}

function clearSitterIntro(uid: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${SITTER_INTRO_STORAGE_PREFIX}${uid}`);
  } catch {
    /* ignore */
  }
}

/** 숫자만 반영, 입력 중 상한 500,000 */
function parseFeeDigits(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  if (digits === '') return 0;
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n)) return 0;
  return Math.min(500_000, Math.max(0, n));
}

export function GuardMomRegisterPage() {
  const [searchParams] = useSearchParams();
  const promoFree = usePromoFreeListings();
  const { user, loading: authLoading } = useAuth();
  const { applyGpsLocation, locationBasedEnabled, regionFullLabel, location: userLoc } = useUserLocation();
  const [careRole, setCareRole] = useState<'guard_mom' | 'sitter'>(() => {
    if (searchParams.get('role') === 'sitter') return 'sitter';
    if (readCareProviderTrack() === 'sitter_only') return 'sitter';
    return 'guard_mom';
  });
  const [row, setRow] = useState<GuardMomRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [intro, setIntro] = useState('');
  const [regionSi, setRegionSi] = useState('');
  const [regionGu, setRegionGu] = useState('');
  const [careDisplayName, setCareDisplayName] = useState('');
  const [fee, setFee] = useState(20000);
  const [offersDaengPickup, setOffersDaengPickup] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [listingBusy, setListingBusy] = useState(false);
  const [sitterIntro, setSitterIntro] = useState('');
  const [sitterSaving, setSitterSaving] = useState(false);
  const [introPhotoUrls, setIntroPhotoUrls] = useState<string[]>([]);
  const [regionGpsBusy, setRegionGpsBusy] = useState(false);
  const [extraCareRegions, setExtraCareRegions] = useState(() => readExtraCareRegions());
  const [extraCity, setExtraCity] = useState('');
  const [extraDistrict, setExtraDistrict] = useState('');
  const [extraHint, setExtraHint] = useState<string | null>(null);

  const referenceDistrictsForExtras = useMemo(() => {
    const primary = userLoc.district?.trim();
    const fromExtras = extraCareRegions.map((e) => e.district.trim()).filter(Boolean);
    return Array.from(new Set([primary, ...fromExtras].filter(Boolean) as string[]));
  }, [userLoc.district, extraCareRegions]);

  const addExtraCareRegion = () => {
    setExtraHint(null);
    if (!extraCity.trim() || !extraDistrict.trim()) {
      setExtraHint('추가할 시·구를 모두 선택해 주세요.');
      return;
    }
    const d = extraDistrict.trim();
    if (referenceDistrictsForExtras.includes(d)) {
      setExtraHint('이미 기준에 포함된 동네예요.');
      return;
    }
    const next = [
      ...extraCareRegions,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, city: extraCity.trim(), district: d },
    ];
    writeExtraCareRegions(next);
    setExtraCareRegions(next);
    setExtraCity('');
    setExtraDistrict('');
  };

  const removeExtraCareRegion = (id: string) => {
    const next = extraCareRegions.filter((e) => e.id !== id);
    writeExtraCareRegions(next);
    setExtraCareRegions(next);
  };

  const showApplySuccessToast = useCallback((role: 'guard_mom' | 'sitter') => {
    toast.success('신청서를 보냈어요! 🎉', {
      description:
        role === 'guard_mom'
          ? '관리 확인 후 인증 돌봄 목록에 노출돼요.'
          : '작성자와 채팅에서 일정·조건을 맞춰 보세요.',
      position: 'bottom-center',
      duration: 5200,
      important: true,
      style: {
        fontSize: '16px',
        fontWeight: 800,
        lineHeight: 1.35,
        padding: '16px 18px',
        background: 'linear-gradient(135deg, #6d28d9 0%, #9333ea 100%)',
        color: '#ffffff',
        border: '2px solid #c4b5fd',
        borderRadius: '16px',
        boxShadow: '0 14px 34px rgba(109, 40, 217, 0.45)',
      },
    });
  }, []);

  const handleFindCurrentLocation = async () => {
    if (!locationBasedEnabled) {
      alert('하단 「위치」탭에서 위치 기반을 켠 뒤, 다시 「현재 위치 찾기」를 눌러 주세요.');
      return;
    }
    setRegionGpsBusy(true);
    try {
      const snap = await applyGpsLocation();
      const guLine = [snap.district, snap.dong].filter(Boolean).join(' ').trim() || snap.district;
      if (careRole === 'guard_mom') {
        setRegionSi(snap.city);
        setRegionGu(guLine);
      }
      setSaveErr(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : '위치를 확인할 수 없어요.');
    } finally {
      setRegionGpsBusy(false);
    }
  };

  const load = useCallback(async () => {
    if (!user) {
      setRow(null);
      setLoadErr(null);
      setCareDisplayName('');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadErr(null);
    const { data, error } = await supabase
      .from('certified_guard_moms')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) {
      setLoadErr(friendlyCertifiedGuardMomsError(error.message));
      setRow(null);
      setLoading(false);
      return;
    }
    if (data) {
      const r = data as GuardMomRow & { provider_kind?: string };
      setRow(r as GuardMomRow);
      setIntro(r.intro);
      setRegionSi(r.region_si);
      setRegionGu(r.region_gu);
      setFee(r.per_day_fee_krw);
      setOffersDaengPickup(Boolean(r.offers_daeng_pickup));
      setIntroPhotoUrls(normalizeIntroPhotoUrls(r.intro_photo_urls));
      if (r.provider_kind === 'dog_sitter') {
        setSitterIntro((r.intro ?? '').trim());
      }
    } else {
      setRow(null);
      setIntro('');
      setRegionSi('');
      setRegionGu('');
      setFee(20000);
      setOffersDaengPickup(false);
      setIntroPhotoUrls([]);
    }
    const { data: profileData } = await supabase
      .from('profiles')
      .select('care_display_name')
      .eq('id', user.id)
      .maybeSingle();
    setCareDisplayName((profileData?.care_display_name ?? '').trim());
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user?.id || careRole !== 'sitter') return;
    setSitterIntro(readSitterIntro(user.id));
  }, [user?.id, careRole]);

  const selectCareRole = (next: 'guard_mom' | 'sitter') => {
    setCareRole(next);
    setSaveErr(null);
    if (next === 'sitter') {
      writeCareProviderTrack('sitter_only');
    } else {
      writeCareProviderTrack('guard_mom');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaveErr(null);
    setSaving(true);
    try {
      const nickOut = careDisplayName.trim().slice(0, 20);
      const { error: profileNickErr } = await supabase
        .from('profiles')
        .update({ care_display_name: nickOut || null })
        .eq('id', user.id);
      if (profileNickErr) throw new Error(profileNickErr.message || '닉네임 저장에 실패했습니다.');
      const payload = {
        user_id: user.id,
        intro: intro.trim(),
        region_si: regionSi.trim(),
        region_gu: regionGu.trim(),
        per_day_fee_krw: Math.min(500000, Math.max(1000, Math.round(fee))),
        offers_daeng_pickup: offersDaengPickup,
        provider_kind: 'guard_mom' as const,
        intro_photo_urls: normalizeIntroPhotoUrls(introPhotoUrls),
      };
      const { error } = await supabase.from('certified_guard_moms').upsert(payload, { onConflict: 'user_id' });
      if (error) throw new Error(friendlyCertifiedGuardMomsError(error.message));
      showApplySuccessToast('guard_mom');
      await load();
      broadcastCertifiedCareDataChanged();
    } catch (e) {
      setSaveErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSitterApply = async () => {
    if (!user) return;
    const text = sitterIntro.trim();
    if (!text) {
      setSaveErr('방문 돌봄 소개를 짧게라도 적어 주세요.');
      return;
    }
    setSaveErr(null);
    setSitterSaving(true);
    try {
      writeCareProviderTrack('sitter_only');
      writeSitterIntro(user.id, text.slice(0, 800));
      const { data: p } = await supabase
        .from('profiles')
        .select('name, phone, avatar_url, region_si, region_gu, care_display_name')
        .eq('id', user.id)
        .maybeSingle();
      const name = (p?.name?.trim() || displayNameFromUser(user)).slice(0, 10);
      const nickOut = careDisplayName.trim().slice(0, 20);
      const { error } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          name,
          phone: p?.phone ?? null,
          avatar_url: p?.avatar_url ?? null,
          care_display_name: nickOut || null,
          is_repairer: true,
        },
        { onConflict: 'id' },
      );
      if (error) {
        throw new Error(error.message || '프로필 저장에 실패했습니다.');
      }
      const rs = (p?.region_si ?? '').trim() || '미입력';
      const rg = (p?.region_gu ?? '').trim() || '미입력';
      const { error: gmErr } = await supabase.from('certified_guard_moms').upsert(
        {
          user_id: user.id,
          intro: text.slice(0, 8000),
          region_si: rs,
          region_gu: rg,
          per_day_fee_krw: 20000,
          offers_daeng_pickup: false,
          provider_kind: 'dog_sitter',
          intro_photo_urls: normalizeIntroPhotoUrls(introPhotoUrls),
        },
        { onConflict: 'user_id' },
      );
      if (gmErr) {
        throw new Error(friendlyCertifiedGuardMomsError(gmErr.message));
      }
      await load();
      broadcastCertifiedCareDataChanged();
      showApplySuccessToast('sitter');
    } catch (e) {
      setSaveErr((e as Error).message);
    } finally {
      setSitterSaving(false);
    }
  };

  const handleListingPay = async () => {
    setSaveErr(null);
    setListingBusy(true);
    try {
      await startStripeCheckout('guard_mom_listing_7d');
    } catch (e) {
      setSaveErr((e as Error).message);
    } finally {
      setListingBusy(false);
    }
  };

  const handleCancelApplication = async () => {
    if (!user) return;
    const ok = window.confirm(
      '정말 인증 돌봄 신청을 취소할까요?\n취소하면 현재 신청/프로필이 즉시 삭제되고 상태가 초기화됩니다.',
    );
    if (!ok) return;

    setSaveErr(null);
    setCancelBusy(true);
    try {
      const { error: delErr } = await supabase
        .from('certified_guard_moms')
        .delete()
        .eq('user_id', user.id);
      if (delErr) {
        throw new Error(friendlyCertifiedGuardMomsError(delErr.message));
      }

      // 안전 확인: 삭제 직후에도 행이 남아 있으면 실패로 간주
      const { data: still } = await supabase
        .from('certified_guard_moms')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (still?.user_id) {
        throw new Error('취소가 완료되지 않았어요. 잠시 후 다시 시도해 주세요.');
      }

      // 취소 시 고객이 올린 글도 즉시 정리
      const { error: meetupDeleteErr } = await supabase
        .from('meetups')
        .delete()
        .eq('user_id', user.id);
      if (meetupDeleteErr) {
        throw new Error(meetupDeleteErr.message || '작성 글 삭제에 실패했어요.');
      }
      removeUserMeetupsByUserId(user.id);
      await syncMeetupsFromDb();

      // 취소 시 돌봄 흐름 완전 초기화
      writeCareProviderTrack('unset');
      clearSitterIntro(user.id);
      setCareRole('guard_mom');
      setRow(null);
      setIntro('');
      setRegionSi('');
      setRegionGu('');
      setFee(20000);
      setOffersDaengPickup(false);
      setIntroPhotoUrls([]);
      setSitterIntro('');

      // "인증 보호맘 · 댕집사" 카드 안내 상태도 기본으로 돌림
      await supabase.from('profiles').update({ is_repairer: false }).eq('id', user.id);

      broadcastCertifiedCareDataChanged();
      toast.success('신청이 취소되었어요.', {
        description: '인증 상태와 작성 글을 모두 초기화했어요.',
        position: 'bottom-center',
      });
    } catch (e) {
      setSaveErr((e as Error).message);
    } finally {
      setCancelBusy(false);
    }
  };

  const certified = row?.certified_at != null;
  const paidListingWindow =
    row?.listing_visible_until != null && new Date(row.listing_visible_until).getTime() > Date.now();
  const visible = (promoFree && certified) || paidListingWindow;

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="sticky top-0 z-40 bg-market-header shadow-market-lg">
        <div className="mx-auto flex h-14 max-w-screen-md items-center gap-2 px-3">
          <Link
            to="/my"
            className="-ml-1 rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
            aria-label="마이페이지로"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-extrabold text-white">인증 돌봄 신청서</h1>
        </div>
      </header>

      <div className="mx-auto max-w-screen-md space-y-4 px-4 pb-6 pt-4">
        {authLoading || loading ? (
          <div className="flex justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !user ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-600">로그인 후 등록할 수 있어요.</p>
            <Link
              to="/login"
              className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-extrabold text-white shadow-md"
            >
              로그인
            </Link>
          </div>
        ) : (
          <>
            {loadErr && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-relaxed text-red-900">
                {loadErr}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="mb-2 text-center text-[11px] font-extrabold text-slate-800">신청 유형 선택</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => selectCareRole('sitter')}
                  className={`flex flex-1 items-center justify-center rounded-xl py-2.5 text-center text-[11px] font-extrabold transition-colors ${
                    careRole === 'sitter'
                      ? 'border-2 border-violet-300 bg-violet-50 text-violet-900'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  댕집사
                </button>
                <button
                  type="button"
                  onClick={() => selectCareRole('guard_mom')}
                  className={`flex flex-1 items-center justify-center rounded-xl py-2.5 text-center text-[11px] font-extrabold transition-colors ${
                    careRole === 'guard_mom'
                      ? 'border-2 border-violet-300 bg-violet-50 text-violet-900'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  보호맘
                </button>
              </div>
            </div>

            {careRole === 'guard_mom' ? (
              <>
                {promoFree && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/95 px-4 py-3 text-center text-sm font-extrabold leading-snug text-emerald-950">
                    {PROMO_FREE_LAUNCH_TITLE}
                  </div>
                )}

                <div className="rounded-2xl border border-orange-200 bg-orange-50/90 px-3 py-3 text-orange-950">
                  <div className="mb-3 flex flex-wrap justify-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold shadow-sm">
                      <BadgeCheck className="h-3.5 w-3.5 text-orange-500" aria-hidden />
                      인증 후 뱃지
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold shadow-sm">
                      <ListTree className="h-3.5 w-3.5 text-orange-500" aria-hidden />
                      {promoFree ? '지금 무료 노출' : '목록 노출(유료)'}
                    </span>
                  </div>
                  <p className="mb-2 text-center text-[11px] font-extrabold text-orange-900">돌봄은 이렇게 맞춰요</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="rounded-xl bg-white/90 py-2 text-center shadow-sm">
                      <Home className="mx-auto h-4 w-4 text-orange-500" aria-hidden />
                      <p className="mt-1 px-0.5 text-[10px] font-bold leading-tight">맡기기</p>
                    </div>
                    <div className="rounded-xl bg-white/90 py-2 text-center shadow-sm">
                      <CarFront className="mx-auto h-4 w-4 text-orange-500" aria-hidden />
                      <p className="mt-1 px-0.5 text-[10px] font-bold leading-tight">픽업</p>
                    </div>
                    <div className="rounded-xl bg-white/90 py-2 text-center shadow-sm">
                      <PawPrint className="mx-auto h-4 w-4 text-orange-500" aria-hidden />
                      <p className="mt-1 px-0.5 text-[10px] font-bold leading-tight">끝나면 집으로</p>
                    </div>
                  </div>
                  <p className="mt-2 flex items-start justify-center gap-1.5 text-center text-[11px] font-medium leading-snug text-orange-900/90">
                    <MessagesSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" aria-hidden />
                    픽업·바래다주기 등은 맡기는 분이랑 채팅으로 편한 대로 정해 주세요 ~~
                  </p>
                  {promoFree ? (
                    <p className="mt-1.5 text-center text-[10px] font-semibold text-orange-800/90">
                      운영 인증이 끝나면 뱃지 달리고, 지금은 무료로 목록에도 올라가요.
                    </p>
                  ) : (
                    <p className="mt-1.5 text-center text-[10px] font-semibold text-orange-800/90">
                      인증 전에는 7일 노출 신청만 잠깐 막혀 있어요. 프로필은 미리 저장해 두셔도 돼요.
                    </p>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <PawTabIcon className="h-5 w-5 text-brand" />
                    <h2 className="text-sm font-extrabold text-slate-800">상태</h2>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                      <Shield
                        className={`mt-0.5 h-5 w-5 shrink-0 ${certified ? 'text-emerald-600' : 'text-amber-500'}`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-extrabold text-slate-500">인증</p>
                        <p className={`text-sm font-extrabold ${certified ? 'text-emerald-700' : 'text-amber-800'}`}>
                          {certified ? '완료' : '검토 전'}
                        </p>
                        {!certified && (
                          <p className="mt-0.5 text-[11px] font-medium leading-snug text-slate-500">
                            서비스 관리자가 프로필을 확인한 뒤 통과시켜요. (앱에서 자동으로 바뀌지 않아요)
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                      {visible ? (
                        <Eye className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" aria-hidden />
                      ) : (
                        <EyeOff className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-extrabold text-slate-500">인증 돌봄 탭 노출</p>
                        <p className={`text-sm font-extrabold ${visible ? 'text-orange-600' : 'text-slate-500'}`}>
                          {!certified
                            ? '인증 후 공개'
                            : visible && promoFree
                              ? '무료 노출 중'
                              : visible && row?.listing_visible_until
                                ? `~ ${new Date(row.listing_visible_until).toLocaleString('ko-KR')}`
                                : '비노출 · 노출 신청'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {promoFree ? (
                    <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-3 py-2.5 text-center text-[11px] font-extrabold leading-snug text-emerald-900">
                      {certified
                        ? '지금은 한시 무료 — 결제 없이 목록에 보여요.'
                        : '인증만 통과되면 한시 무료로 목록에 올라가요.'}
                    </p>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={listingBusy || !certified}
                        onClick={() => void handleListingPay()}
                        className="mt-4 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3 text-sm font-extrabold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {listingBusy ? '이동 중…' : '7일 목록 노출 신청'}
                      </button>
                      {!certified && (
                        <p className="mt-2 text-[11px] font-medium text-slate-500">인증 완료 후 버튼이 활성화됩니다.</p>
                      )}
                    </>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-extrabold text-slate-800">프로필</h2>
                  <label className="mt-4 block text-xs font-extrabold text-slate-700">
                    노출 닉네임
                    <input
                      value={careDisplayName}
                      onChange={(e) => setCareDisplayName(e.target.value)}
                      maxLength={20}
                      placeholder="예) 하양이 돌봄맘"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900"
                    />
                    <span className="mt-1 block text-[11px] font-medium text-slate-500">
                      목록에 보일 이름이에요. 비워두면 기본 이름으로 보여요.
                    </span>
                  </label>
                  <label className="mt-4 block text-xs font-extrabold text-slate-700">
                    소개
                    <textarea
                      value={intro}
                      onChange={(e) => setIntro(e.target.value)}
                      rows={5}
                      placeholder="경력, 집 환경, 맡기 가능한 크기·성향 등을 적어 주세요."
                      className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800"
                    />
                  </label>
                  <div className="mt-2 flex justify-end">
                    <AiDoumiButton
                      task="guard_intro"
                      payload={{
                        keywords: intro.trim() || '소형견 맡기기, 산책 하루 3번, 단지 산책로',
                        regionSi: regionSi.trim(),
                        regionGu: regionGu.trim(),
                      }}
                      onDone={(r) => {
                        if (!r.ok) {
                          alert(r.error);
                          return;
                        }
                        if (r.text.trim()) setIntro(r.text.trim());
                      }}
                    >
                      소개 AI 초안
                    </AiDoumiButton>
                  </div>
                  <CareIntroPhotoPicker
                    userId={user.id}
                    urls={introPhotoUrls}
                    onUrlsChange={setIntroPhotoUrls}
                    disabled={saving}
                    hint="집·산책 환경 등, 맡기는 분이 볼 수 있어요. 대표 1장만."
                  />
                  <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-2.5">
                    <p className="text-[11px] font-bold text-slate-600">돌봄 지역 · 현재 위치</p>
                    <button
                      type="button"
                      disabled={saving || regionGpsBusy}
                      onClick={() => void handleFindCurrentLocation()}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-extrabold text-white shadow-sm transition-opacity active:scale-[0.99] disabled:opacity-50"
                    >
                      <LocateFixed className="h-4 w-4 shrink-0" aria-hidden />
                      {regionGpsBusy ? '위치 확인 중…' : '현재 위치 찾기'}
                    </button>
                    <p className="mt-2 text-center text-[11px] font-semibold text-slate-700">
                      {locationBasedEnabled ? (
                        <>
                          지금 맞춰진 동네: <span className="font-extrabold text-slate-900">{regionFullLabel}</span>
                        </>
                      ) : (
                        <span className="text-amber-800">위치 기반이 꺼져 있으면 GPS로 찾을 수 없어요.</span>
                      )}
                    </p>
                    <div className="mt-3 border-t border-slate-200/80 pt-3">
                      <div className="mb-2 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
                        <p className="text-[11px] font-extrabold text-slate-700">추가 동네</p>
                        <span className="text-[10px] font-semibold text-slate-400">기준 외 활동 가능</span>
                      </div>
                      <RegionSelector
                        selectedCity={extraCity}
                        selectedDistrict={extraDistrict}
                        onCityChange={setExtraCity}
                        onDistrictChange={setExtraDistrict}
                        placeholder="추가할 시·구 선택"
                      />
                      <button
                        type="button"
                        disabled={saving}
                        onClick={addExtraCareRegion}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 py-2.5 text-xs font-extrabold text-amber-950 active:scale-[0.99] disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4 shrink-0" aria-hidden />
                        이 동네 추가
                      </button>
                      {extraHint && <p className="mt-2 text-xs font-bold text-red-600">{extraHint}</p>}
                      {extraCareRegions.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {extraCareRegions.map((ex) => (
                            <li
                              key={ex.id}
                              className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/50 py-1 pl-3 pr-1 text-[11px] font-bold text-slate-800"
                            >
                              {formatRegion(ex.city, ex.district)}
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => removeExtraCareRegion(ex.id)}
                                className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-amber-900"
                                aria-label={`${formatRegion(ex.city, ex.district)} 제거`}
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="block text-xs font-extrabold text-slate-700">
                      시·도
                      <input
                        value={regionSi}
                        onChange={(e) => setRegionSi(e.target.value)}
                        placeholder="서울"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900"
                      />
                    </label>
                    <label className="block text-xs font-extrabold text-slate-700">
                      구·군
                      <input
                        value={regionGu}
                        onChange={(e) => setRegionGu(e.target.value)}
                        placeholder="강남구"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900"
                      />
                    </label>
                  </div>
                  <label className="mt-3 block text-xs font-extrabold text-slate-700">
                    <span className="block">1일 돌봄 받을 요금</span>
                    <span className="mt-0.5 block text-[11px] font-medium font-normal text-slate-500">
                      맡기는 분에게 이렇게 표시돼요.
                    </span>
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={fee > 0 ? fee.toLocaleString('ko-KR') : ''}
                        onChange={(e) => setFee(parseFeeDigits(e.target.value))}
                        onBlur={() => {
                          if (fee > 0 && fee < 1000) setFee(1000);
                        }}
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-bold text-slate-900 outline-none ring-0"
                      />
                      <span className="shrink-0 text-sm font-extrabold text-slate-700">원</span>
                    </div>
                  </label>

                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={offersDaengPickup}
                      onChange={(e) => setOffersDaengPickup(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand focus:ring-brand"
                    />
                    <span>
                      <span className="block text-xs font-extrabold text-slate-800">댕댕 픽업</span>
                      <span className="mt-0.5 block text-[11px] font-medium leading-relaxed text-slate-600">
                        집까지 가서 아이 모셔 올 수 있을 때만 체크해 주세요 ~~
                      </span>
                    </span>
                  </label>
                </div>

                {saveErr && <p className="text-xs font-semibold text-red-600">{saveErr}</p>}

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-extrabold text-white shadow-sm disabled:opacity-60"
                >
                  {saving ? '보내는 중…' : '신청서 보내기'}
                </button>
                {row && (
                  <button
                    type="button"
                    disabled={cancelBusy || saving}
                    onClick={() => void handleCancelApplication()}
                    className="w-full rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-extrabold text-red-700 disabled:opacity-60"
                  >
                    {cancelBusy ? '취소 처리 중…' : '신청 취소하기'}
                  </button>
                )}
              </>
            ) : (
              <div className="space-y-3">
                {promoFree && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/95 px-4 py-3 text-center text-sm font-extrabold leading-snug text-emerald-950">
                    {PROMO_FREE_LAUNCH_TITLE}
                  </div>
                )}

                <div className="rounded-2xl border border-violet-200 bg-violet-50/90 px-3 py-3 text-violet-950">
                  <div className="mb-3 flex flex-wrap justify-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold shadow-sm">
                      <BadgeCheck className="h-3.5 w-3.5 text-violet-500" aria-hidden />
                      인증 후 뱃지
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold shadow-sm">
                      <ListTree className="h-3.5 w-3.5 text-violet-500" aria-hidden />
                      {promoFree ? '지금 무료 노출' : '목록 노출(유료)'}
                    </span>
                  </div>
                  <p className="mb-2 text-center text-[11px] font-extrabold text-violet-900">돌봄은 이렇게 맞춰요</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="rounded-xl bg-white/90 py-2 text-center shadow-sm">
                      <Home className="mx-auto h-4 w-4 text-violet-500" aria-hidden />
                      <p className="mt-1 px-0.5 text-[10px] font-bold leading-tight">집 방문</p>
                    </div>
                    <div className="rounded-xl bg-white/90 py-2 text-center shadow-sm">
                      <Clock className="mx-auto h-4 w-4 text-violet-500" aria-hidden />
                      <p className="mt-1 px-0.5 text-[10px] font-bold leading-tight">몇 시간</p>
                    </div>
                    <div className="rounded-xl bg-white/90 py-2 text-center shadow-sm">
                      <PawPrint className="mx-auto h-4 w-4 text-violet-500" aria-hidden />
                      <p className="mt-1 px-0.5 text-[10px] font-bold leading-tight">밥·산책</p>
                    </div>
                  </div>
                  <p className="mt-2 flex items-start justify-center gap-1.5 text-center text-[11px] font-medium leading-snug text-violet-900/90">
                    <MessagesSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" aria-hidden />
                    방문·시간·밥·산책은 맡기는 분이랑 채팅으로 편한 대로 정해 주세요 ~~
                  </p>
                  {promoFree ? (
                    <p className="mt-1.5 text-center text-[10px] font-semibold text-violet-800/90">
                      운영 인증이 끝나면 뱃지 달리고, 지금은 무료로 목록에도 올라가요.
                    </p>
                  ) : (
                    <p className="mt-1.5 text-center text-[10px] font-semibold text-violet-800/90">
                      인증 전에는 7일 노출 신청만 잠깐 막혀 있어요. 프로필은 미리 저장해 두셔도 돼요.
                    </p>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <PawTabIcon className="h-5 w-5 text-brand" />
                    <h2 className="text-sm font-extrabold text-slate-800">상태</h2>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                      <Shield
                        className={`mt-0.5 h-5 w-5 shrink-0 ${certified ? 'text-emerald-600' : 'text-amber-500'}`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-extrabold text-slate-500">인증</p>
                        <p className={`text-sm font-extrabold ${certified ? 'text-emerald-700' : 'text-amber-800'}`}>
                          {certified ? '완료' : '검토 전'}
                        </p>
                        {!certified && (
                          <p className="mt-0.5 text-[11px] font-medium leading-snug text-slate-500">
                            서비스 관리자가 프로필을 확인한 뒤 통과시켜요. (앱에서 자동으로 바뀌지 않아요)
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                      {visible ? (
                        <Eye className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" aria-hidden />
                      ) : (
                        <EyeOff className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-extrabold text-slate-500">인증 돌봄 탭 노출</p>
                        <p className={`text-sm font-extrabold ${visible ? 'text-orange-600' : 'text-slate-500'}`}>
                          {!certified
                            ? '인증 후 공개'
                            : visible && promoFree
                              ? '무료 노출 중'
                              : visible && row?.listing_visible_until
                                ? `~ ${new Date(row.listing_visible_until).toLocaleString('ko-KR')}`
                                : '비노출 · 노출 신청'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {promoFree ? (
                    <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-3 py-2.5 text-center text-[11px] font-extrabold leading-snug text-emerald-900">
                      {certified
                        ? '지금은 한시 무료 — 결제 없이 목록에 보여요.'
                        : '인증만 통과되면 한시 무료로 목록에 올라가요.'}
                    </p>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={listingBusy || !certified}
                        onClick={() => void handleListingPay()}
                        className="mt-4 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-extrabold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {listingBusy ? '이동 중…' : '7일 목록 노출 신청'}
                      </button>
                      {!certified && (
                        <p className="mt-2 text-[11px] font-medium text-slate-500">인증 완료 후 버튼이 활성화됩니다.</p>
                      )}
                    </>
                  )}
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-extrabold text-slate-800">댕집사 신청서</h2>
                  <p className="mt-1 text-[11px] font-semibold leading-snug text-slate-500">
                    이웃 집 방문 돌봄·산책 가능 범위를 적어 주세요.
                  </p>
                  <label className="mt-3 block text-xs font-extrabold text-slate-700">
                    노출 닉네임
                    <input
                      value={careDisplayName}
                      onChange={(e) => setCareDisplayName(e.target.value)}
                      maxLength={20}
                      placeholder="예) 하양이 방문집사"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900"
                    />
                    <span className="mt-1 block text-[11px] font-medium text-slate-500">
                      목록에 보일 이름이에요. 비워두면 기본 이름으로 보여요.
                    </span>
                  </label>
                  <label className="mt-3 block text-xs font-extrabold text-slate-700">
                    방문 돌봄 소개
                    <textarea
                      value={sitterIntro}
                      onChange={(e) => setSitterIntro(e.target.value)}
                      rows={5}
                      maxLength={800}
                      placeholder="예) 주중 오전 방문, 산책 30분, 소형견 위주"
                      className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800"
                    />
                  </label>
                  <div className="mt-2 flex justify-end">
                    <AiDoumiButton
                      task="guard_intro"
                      payload={{
                        keywords: sitterIntro.trim() || '방문 돌봄, 산책 30분, 식사 챙김',
                        regionSi: regionSi.trim(),
                        regionGu: regionGu.trim(),
                      }}
                      onDone={(r) => {
                        if (!r.ok) {
                          alert(r.error);
                          return;
                        }
                        if (r.text.trim()) setSitterIntro(r.text.trim().slice(0, 800));
                      }}
                    >
                      소개 AI 초안
                    </AiDoumiButton>
                  </div>
                  <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-2.5">
                    <p className="text-[11px] font-bold text-slate-600">방문 지역 · 현재 위치</p>
                    <button
                      type="button"
                      disabled={sitterSaving || regionGpsBusy}
                      onClick={() => void handleFindCurrentLocation()}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-extrabold text-white shadow-sm transition-opacity active:scale-[0.99] disabled:opacity-50"
                    >
                      <LocateFixed className="h-4 w-4 shrink-0" aria-hidden />
                      {regionGpsBusy ? '위치 확인 중…' : '현재 위치 찾기'}
                    </button>
                    <p className="mt-2 text-center text-[11px] font-semibold text-slate-700">
                      {locationBasedEnabled ? (
                        <>
                          지금 맞춰진 동네: <span className="font-extrabold text-slate-900">{regionFullLabel}</span>
                        </>
                      ) : (
                        <span className="text-amber-800">위치 기반이 꺼져 있으면 GPS로 찾을 수 없어요.</span>
                      )}
                    </p>
                    <div className="mt-3 border-t border-slate-200/80 pt-3">
                      <div className="mb-2 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
                        <p className="text-[11px] font-extrabold text-slate-700">추가 동네</p>
                        <span className="text-[10px] font-semibold text-slate-400">기준 외 활동 가능</span>
                      </div>
                      <RegionSelector
                        selectedCity={extraCity}
                        selectedDistrict={extraDistrict}
                        onCityChange={setExtraCity}
                        onDistrictChange={setExtraDistrict}
                        placeholder="추가할 시·구 선택"
                      />
                      <button
                        type="button"
                        disabled={sitterSaving}
                        onClick={addExtraCareRegion}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 py-2.5 text-xs font-extrabold text-amber-950 active:scale-[0.99] disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4 shrink-0" aria-hidden />
                        이 동네 추가
                      </button>
                      {extraHint && <p className="mt-2 text-xs font-bold text-red-600">{extraHint}</p>}
                      {extraCareRegions.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {extraCareRegions.map((ex) => (
                            <li
                              key={ex.id}
                              className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/50 py-1 pl-3 pr-1 text-[11px] font-bold text-slate-800"
                            >
                              {formatRegion(ex.city, ex.district)}
                              <button
                                type="button"
                                disabled={sitterSaving}
                                onClick={() => removeExtraCareRegion(ex.id)}
                                className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-amber-900"
                                aria-label={`${formatRegion(ex.city, ex.district)} 제거`}
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <CareIntroPhotoPicker
                    userId={user.id}
                    urls={introPhotoUrls}
                    onUrlsChange={setIntroPhotoUrls}
                    disabled={sitterSaving}
                    hint="방문 돌봄 경험·환경 사진이 있으면 맡기는 분에게 도움이 돼요. 대표 1장만."
                  />
                </div>

                {saveErr && <p className="text-xs font-semibold text-red-600">{saveErr}</p>}

                <button
                  type="button"
                  disabled={sitterSaving}
                  onClick={() => void handleSitterApply()}
                  className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-extrabold text-white shadow-sm disabled:opacity-60"
                >
                  {sitterSaving ? '보내는 중…' : '신청서 보내기'}
                </button>
                {row && (
                  <button
                    type="button"
                    disabled={cancelBusy || sitterSaving}
                    onClick={() => void handleCancelApplication()}
                    className="w-full rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-extrabold text-red-700 disabled:opacity-60"
                  >
                    {cancelBusy ? '취소 처리 중…' : '신청 취소하기'}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
