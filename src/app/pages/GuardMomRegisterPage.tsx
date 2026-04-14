import { useCallback, useEffect, useState } from 'react';
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
} from 'lucide-react';
import { PawTabIcon } from '../components/icons/PawTabIcon';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { startStripeCheckout } from '../../lib/billing';
import { usePromoFreeListings } from '../../lib/promoFlags';
import { AiDoumiButton } from '../components/AiDoumiButton';

type GuardMomRow = Database['public']['Tables']['certified_guard_moms']['Row'];

/** PostgREST 영문 오류 → 한글 안내 (배포 담당자용 파일 경로 포함) */
function friendlyCertifiedGuardMomsError(message: string): string {
  const m = message.toLowerCase();
  const tableMissing =
    m.includes('certified_guard_moms') &&
    (m.includes('could not find') ||
      m.includes('schema cache') ||
      m.includes('does not exist') ||
      m.includes('relation') ||
      m.includes('pgrst'));
  if (tableMissing) {
    return '지금은 프로필을 저장할 수 없어요. 사이트 DB에 보호맘용 테이블이 아직 없을 때 나오는 메시지예요. 배포 담당자가 Supabase → SQL Editor에서 supabase/migrations/20260411120000_guard_moms.sql 을 실행한 뒤, 20260412120000_daeng_pickup.sql 도 실행해 주세요.';
  }
  if (m.includes('offers_daeng_pickup') || (m.includes('column') && m.includes('does not exist'))) {
    return '「댕댕 픽업」 저장을 위해 DB를 한 번 더 업데이트해야 해요. supabase/migrations/20260412120000_daeng_pickup.sql 을 SQL Editor에서 실행해 주세요.';
  }
  return message;
}

export function GuardMomRegisterPage() {
  const [searchParams] = useSearchParams();
  const promoFree = usePromoFreeListings();
  const { user, loading: authLoading } = useAuth();
  const [careRole, setCareRole] = useState<'guard_mom' | 'sitter'>(
    searchParams.get('role') === 'sitter' ? 'sitter' : 'guard_mom',
  );
  const [row, setRow] = useState<GuardMomRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [intro, setIntro] = useState('');
  const [regionSi, setRegionSi] = useState('');
  const [regionGu, setRegionGu] = useState('');
  const [fee, setFee] = useState(20000);
  const [offersDaengPickup, setOffersDaengPickup] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listingBusy, setListingBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setRow(null);
      setLoadErr(null);
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
      const r = data as GuardMomRow;
      setRow(r);
      setIntro(r.intro);
      setRegionSi(r.region_si);
      setRegionGu(r.region_gu);
      setFee(r.per_day_fee_krw);
      setOffersDaengPickup(Boolean(r.offers_daeng_pickup));
    } else {
      setRow(null);
      setIntro('');
      setRegionSi('');
      setRegionGu('');
      setFee(20000);
      setOffersDaengPickup(false);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!user) return;
    setSaveErr(null);
    setSaveOk(false);
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        intro: intro.trim(),
        region_si: regionSi.trim(),
        region_gu: regionGu.trim(),
        per_day_fee_krw: Math.min(500000, Math.max(1000, Math.round(fee))),
        offers_daeng_pickup: offersDaengPickup,
      };
      const { error } = await supabase.from('certified_guard_moms').upsert(payload, { onConflict: 'user_id' });
      if (error) throw new Error(friendlyCertifiedGuardMomsError(error.message));
      setSaveOk(true);
      await load();
    } catch (e) {
      setSaveErr((e as Error).message);
    } finally {
      setSaving(false);
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

      <div className="mx-auto max-w-screen-md space-y-4 px-4 pt-4">
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
                  onClick={() => setCareRole('sitter')}
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
                  onClick={() => setCareRole('guard_mom')}
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
                    🎉 현재 런칭 기념 무료 노출 프로모션 중입니다!
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
                    1일 돌봄 요금 (원, 1,000~500,000)
                    <input
                      type="number"
                      min={1000}
                      max={500000}
                      step={1000}
                      value={fee}
                      onChange={(e) => setFee(Number(e.target.value) || 0)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900"
                    />
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

                  {saveErr && <p className="mt-3 text-xs font-semibold text-red-600">{saveErr}</p>}
                  {saveOk && <p className="mt-3 text-xs font-semibold text-orange-600">저장했어요.</p>}

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave()}
                    className="mt-4 w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-extrabold text-white disabled:opacity-60"
                  >
                    {saving ? '저장 중…' : '신청서 저장'}
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-extrabold text-slate-800">댕집사 신청</h2>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">
                  댕집사는 프로필·계정 설정에서 돌봄 목표를 댕집사로 선택하면 신청이 완료돼요.
                </p>
                <Link
                  to="/profile/edit?care=sitter"
                  className="mt-4 flex w-full items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 py-3 text-sm font-extrabold text-violet-900"
                >
                  댕집사 신청서로 이동
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
