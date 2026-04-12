import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PawTabIcon } from '../components/icons/PawTabIcon';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { startStripeCheckout } from '../../lib/billing';

type GuardMomRow = Database['public']['Tables']['certified_guard_moms']['Row'];

export function GuardMomRegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const [row, setRow] = useState<GuardMomRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [intro, setIntro] = useState('');
  const [regionSi, setRegionSi] = useState('');
  const [regionGu, setRegionGu] = useState('');
  const [fee, setFee] = useState(20000);
  const [offersDaengPickup, setOffersDaengPickup] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listingBusy, setListingBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setRow(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('certified_guard_moms').select('*').eq('user_id', user.id).maybeSingle();
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
      if (error) throw new Error(error.message);
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
  const visible =
    row?.listing_visible_until != null && new Date(row.listing_visible_until).getTime() > Date.now();

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-28">
      <header className="sticky top-0 z-40 bg-market-header shadow-market-lg">
        <div className="mx-auto flex h-14 max-w-screen-md items-center gap-2 px-3">
          <Link
            to="/sitters?view=care&care=guard"
            className="-ml-1 rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
            aria-label="인증 돌봄으로"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-extrabold text-white">보호맘 프로필</h1>
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
            <div className="rounded-2xl border border-orange-200 bg-orange-50/90 px-4 py-3 text-xs font-medium leading-relaxed text-orange-950">
              <strong>인증</strong>은 운영자가 Supabase에서 <code className="rounded bg-white/80 px-1">certified_at</code>을
              넣어 드린 뒤에 가능해요. 인증 전에는 「7일 노출」 신청만 막히고, 프로필 저장은 미리 해 두셔도 됩니다.
              <span className="mt-2 block border-t border-orange-200/80 pt-2 text-[11px] font-semibold leading-relaxed">
                인증 후 <strong>돌봄·거래 책임은 보호맘 본인</strong>이에요. 맡기기는 돌봄 집에 데려다 맡기거나 픽업하고, 기간이
                끝나면 <strong>데려다 드리거나 주인이 찾아가는</strong> 방식 등을 <strong>맡기는 분과 직접</strong> 정해 주세요.{' '}
                <strong>유료는 목록에 보이는 기간</strong>에만 해당해요.
              </span>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <PawTabIcon className="h-5 w-5 text-brand" />
                <h2 className="text-sm font-extrabold text-slate-800">상태</h2>
              </div>
              <ul className="space-y-2 text-xs font-semibold text-slate-600">
                <li>
                  인증:{' '}
                  <span className={certified ? 'text-orange-600' : 'text-orange-600'}>
                    {certified ? '완료' : '대기(운영 처리)'}
                  </span>
                </li>
                <li>
                  보호맘 란 노출:{' '}
                  <span className={visible ? 'text-orange-600' : 'text-slate-500'}>
                    {visible && row?.listing_visible_until
                      ? `~ ${new Date(row.listing_visible_until).toLocaleString('ko-KR')}`
                      : '비노출'}
                  </span>
                </li>
              </ul>
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
                    맡기기 시 주인 집까지 찾아가 강아지를 픽업해 갈 수 있어요. 가능하면 체크해 주세요.
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
                {saving ? '저장 중…' : '프로필 저장'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
