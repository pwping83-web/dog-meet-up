import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowLeft, BadgeCheck, CreditCard, Loader2 } from 'lucide-react';
import { PawTabIcon } from '../components/icons/PawTabIcon';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BILLING_PRODUCTS, startStripeCheckout, type BillingProductKey } from '../../lib/billing';
import {
  PROMO_FREE_LAUNCH_BLURB,
  PROMO_FREE_LAUNCH_TITLE,
  usePromoFreeListings,
} from '../../lib/promoFlags';

export function BillingPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listingVisibleUntil, setListingVisibleUntil] = useState<string | null>(null);
  const [breedingListingUntil, setBreedingListingUntil] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<BillingProductKey | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [guardCertifiedAt, setGuardCertifiedAt] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  const checkoutStatus = searchParams.get('checkout');
  const promoFree = usePromoFreeListings();

  const loadBilling = useCallback(async () => {
    if (!user) {
      setListingVisibleUntil(null);
      setBreedingListingUntil(null);
      setGuardCertifiedAt(null);
      setListLoading(false);
      return;
    }
    setListLoading(true);
    setPageError(null);

    const [gmRes, entRes] = await Promise.all([
      supabase
        .from('certified_guard_moms')
        .select('listing_visible_until,certified_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('user_entitlements')
        .select('breeding_listing_until')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    if (!gmRes.error && gmRes.data) {
      setGuardCertifiedAt(gmRes.data.certified_at ?? null);
      setListingVisibleUntil(gmRes.data.listing_visible_until ?? null);
    } else {
      setGuardCertifiedAt(null);
      setListingVisibleUntil(null);
    }

    if (!entRes.error && entRes.data?.breeding_listing_until) {
      setBreedingListingUntil(entRes.data.breeding_listing_until);
    } else {
      setBreedingListingUntil(null);
    }

    setListLoading(false);
  }, [user]);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  useEffect(() => {
    if (checkoutStatus === 'success') {
      void loadBilling();
      const t = setTimeout(() => {
        searchParams.delete('checkout');
        searchParams.delete('session_id');
        setSearchParams(searchParams, { replace: true });
      }, 4000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [checkoutStatus, loadBilling, searchParams, setSearchParams]);

  const handlePay = async (key: BillingProductKey) => {
    setPageError(null);
    setCheckoutLoading(key);
    try {
      await startStripeCheckout(key);
    } catch (e) {
      setPageError((e as Error).message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const guardCertified = guardCertifiedAt != null && !Number.isNaN(Date.parse(guardCertifiedAt));
  const listingPaidWindow =
    listingVisibleUntil != null &&
    !Number.isNaN(Date.parse(listingVisibleUntil)) &&
    new Date(listingVisibleUntil) > new Date();

  const listingActive = guardCertified && (promoFree || listingPaidWindow);

  const breedingListingActive =
    promoFree ||
    (breedingListingUntil != null &&
      !Number.isNaN(Date.parse(breedingListingUntil)) &&
      new Date(breedingListingUntil) > new Date());

  const guardMomProduct = BILLING_PRODUCTS.find((p) => p.key === 'guard_mom_listing_7d')!;
  const breedingProduct = BILLING_PRODUCTS.find((p) => p.key === 'breeding_post_listing_7d')!;

  return (
    <div className="min-h-full bg-slate-50">
      <header className="sticky top-0 z-40 bg-market-header shadow-market-lg">
        <div className="mx-auto flex h-14 max-w-screen-md items-center gap-3 px-4">
          <Link
            to="/my"
            className="-ml-2 rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
            aria-label="내 댕댕으로"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-extrabold text-white">인증 돌봄 · 교배글 노출</h1>
        </div>
      </header>

      <div className="mx-auto max-w-screen-md space-y-5 px-4 py-6 pb-16">

        {/* 결제 상태 알림 */}
        {checkoutStatus === 'success' && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
            ✅ 처리가 완료됐어요. 잠시 후 노출 상태가 갱신돼요.
          </div>
        )}
        {checkoutStatus === 'cancel' && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
            취소했어요. 언제든 다시 신청할 수 있어요.
          </div>
        )}
        {pageError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {pageError}
          </div>
        )}

        {/* 프로모 배너 */}
        {promoFree && (
          <div className="rounded-3xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-5 text-center shadow-sm">
            <p className="text-base font-extrabold leading-snug text-emerald-800">{PROMO_FREE_LAUNCH_TITLE}</p>
            <p className="mt-2 text-sm font-semibold text-emerald-700">{PROMO_FREE_LAUNCH_BLURB}</p>
          </div>
        )}

        {authLoading || listLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-brand" />
          </div>
        ) : !user ? (
          <div className="rounded-3xl border border-brand/15 bg-white p-10 text-center shadow-sm">
            <p className="mb-5 text-base font-bold text-slate-600">로그인 후 이용할 수 있어요.</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl bg-market-cta px-8 py-4 text-base font-extrabold text-white shadow-market"
            >
              로그인하기
            </Link>
          </div>
        ) : (
          <>
            {/* ── 인증 돌봄 카드 ── */}
            <div className="overflow-hidden rounded-3xl border border-orange-200 bg-white shadow-sm">
              {/* 카드 헤더 */}
              <div className="flex items-center gap-4 bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                  <PawTabIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/80">인증 보호맘 · 댕집사</p>
                  <h2 className="text-xl font-black text-white">{guardMomProduct.title}</h2>
                </div>
              </div>
              {/* 현재 상태 */}
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <BadgeCheck className={`h-6 w-6 shrink-0 ${listingActive ? 'text-emerald-500' : 'text-slate-300'}`} aria-hidden />
                <div>
                  <p className={`text-base font-extrabold ${listingActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {listingActive ? '지금 목록에 노출 중이에요 ✅' : '아직 목록에 노출되지 않아요'}
                  </p>
                  {listingVisibleUntil && (
                    <p className="text-xs font-semibold text-slate-500">
                      노출 만료: {format(new Date(listingVisibleUntil), 'yyyy년 M월 d일', { locale: ko })}
                    </p>
                  )}
                </div>
              </div>
              {/* 설명 + 버튼 */}
              <div className="px-5 py-5">
                <p className="mb-5 text-sm font-semibold leading-relaxed text-slate-600">
                  {guardMomProduct.description}
                </p>
                {promoFree ? (
                  <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-3 py-3 text-center text-sm font-bold leading-snug text-emerald-800">
                    🎁 지금은 무료 — 인증만 받으면 목록에 올라가요
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={checkoutLoading !== null}
                    onClick={() => void handlePay(guardMomProduct.key)}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-market-cta text-base font-extrabold text-white shadow-market transition-transform active:scale-[0.98] disabled:opacity-60"
                  >
                    {checkoutLoading === guardMomProduct.key ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> 이동 중…</>
                    ) : (
                      <><CreditCard className="h-5 w-5" /> 7일 노출 신청하기</>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* ── 교배글 카드 ── */}
            <div className="overflow-hidden rounded-3xl border border-pink-200 bg-white shadow-sm">
              {/* 카드 헤더 */}
              <div className="flex items-center gap-4 bg-gradient-to-r from-pink-500 to-rose-400 px-5 py-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl">
                  🌸
                </div>
                <div>
                  <p className="text-xs font-bold text-white/80">만나자 · 교배</p>
                  <h2 className="text-xl font-black text-white">{breedingProduct.title}</h2>
                </div>
              </div>
              {/* 현재 상태 */}
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <BadgeCheck className={`h-6 w-6 shrink-0 ${breedingListingActive ? 'text-emerald-500' : 'text-slate-300'}`} aria-hidden />
                <div>
                  <p className={`text-base font-extrabold ${breedingListingActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {breedingListingActive ? '지금 교배 글 노출 중이에요 ✅' : '아직 교배 글이 노출되지 않아요'}
                  </p>
                  {breedingListingUntil && (
                    <p className="text-xs font-semibold text-slate-500">
                      노출 만료: {format(new Date(breedingListingUntil), 'yyyy년 M월 d일', { locale: ko })}
                    </p>
                  )}
                </div>
              </div>
              {/* 설명 + 버튼 */}
              <div className="px-5 py-5">
                <p className="mb-5 text-sm font-semibold leading-relaxed text-slate-600">
                  {breedingProduct.description}
                </p>
                {promoFree ? (
                  <div className="rounded-2xl border-2 border-pink-200 bg-pink-50 px-3 py-3 text-center text-sm font-bold leading-snug text-pink-800">
                    🎁 지금은 무료 — 만나자에서 「교배」로 글을 등록
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={checkoutLoading !== null}
                    onClick={() => void handlePay(breedingProduct.key)}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-base font-extrabold text-white shadow-md transition-transform active:scale-[0.98] disabled:opacity-60"
                  >
                    {checkoutLoading === breedingProduct.key ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> 이동 중…</>
                    ) : (
                      <><CreditCard className="h-5 w-5" /> 교배 글 7일 노출 신청하기</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
