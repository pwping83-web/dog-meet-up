import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { PawTabIcon } from '../components/icons/PawTabIcon';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BILLING_PRODUCTS, startStripeCheckout, type BillingProductKey } from '../../lib/billing';
import { usePromoFreeListings } from '../../lib/promoFlags';
import { BILLING_LEGAL_NOTICE_PARAGRAPH } from '../../lib/platformLegalCopy';

type OrderRow = {
  id: string;
  product_key: string;
  status: string;
  created_at: string;
  paid_at: string | null;
};

function orderProductLabel(key: string): string {
  const map: Record<string, string> = {
    premium_month: '댕댕 프리미엄 (월)',
    meetup_boost: '만남 글 부스트 (1회)',
    guard_mom_listing_7d: '인증 돌봄 목록 노출 (7일)',
    breeding_post_listing_7d: '만나자 교배 신청 글 노출 (7일)',
    guard_mom_care_day: '보호맘 돌봄 예약',
  };
  return map[key] ?? key;
}

export function BillingPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [listingVisibleUntil, setListingVisibleUntil] = useState<string | null>(null);
  const [breedingListingUntil, setBreedingListingUntil] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<BillingProductKey | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [guardCertifiedAt, setGuardCertifiedAt] = useState<string | null>(null);

  const checkoutStatus = searchParams.get('checkout');
  const promoFree = usePromoFreeListings();

  const loadBilling = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setListingVisibleUntil(null);
      setBreedingListingUntil(null);
      setGuardCertifiedAt(null);
      setListLoading(false);
      return;
    }
    setListLoading(true);
    setPageError(null);

    const [ordersRes, gmRes, entRes] = await Promise.all([
      supabase
        .from('billing_orders')
        .select('id,product_key,status,created_at,paid_at')
        .order('created_at', { ascending: false })
        .limit(30),
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

    if (ordersRes.error) {
      setPageError(
        '이용 내역을 불러오지 못했습니다. Supabase에 billing_orders 마이그레이션을 적용했는지 확인하세요.',
      );
      setOrders([]);
    } else {
      setOrders((ordersRes.data ?? []) as OrderRow[]);
    }

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
    <div className="min-h-full bg-slate-50 pb-28">
      <header className="sticky top-0 z-40 bg-market-header shadow-market-lg">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-3">
          <Link
            to="/explore"
            className="rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
            aria-label="홈으로"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-extrabold text-white">인증 돌봄</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {checkoutStatus === 'success' && (
          <div className="rounded-2xl border border-brand/25 bg-brand-soft px-4 py-3 text-sm font-semibold text-slate-800">
            처리가 완료되었습니다. 잠시 후 아래 노출 기한이 갱신됩니다.
          </div>
        )}
        {checkoutStatus === 'cancel' && (
          <div className="rounded-2xl border border-brand/20 bg-brand-muted px-4 py-3 text-sm font-semibold text-slate-700">
            진행을 취소했습니다.
          </div>
        )}

        {pageError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {pageError}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold leading-relaxed text-slate-700">
          {BILLING_LEGAL_NOTICE_PARAGRAPH}
        </div>

        {promoFree && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm font-semibold leading-relaxed text-emerald-950">
            <p className="text-center font-extrabold">🎉 현재 런칭 기념 무료 노출 프로모션 중입니다!</p>
            <p className="mt-2 text-xs font-semibold">
              인증만 완료되면 인증 돌봄 목록에 바로 노출돼요. 교배 글도 같은 기간 동안 무료로 피드에 올라갈 수 있어요. 정책이
              바뀌면 사전에 안내할게요.
            </p>
          </div>
        )}

        {authLoading ? (
          <div className="flex justify-center py-16 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : !user ? (
          <div className="rounded-2xl border border-brand/15 bg-white p-8 text-center shadow-sm">
            <p className="mb-4 text-sm font-medium text-slate-600">이용하려면 로그인이 필요합니다.</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-market-cta px-6 py-3 text-sm font-bold text-white shadow-market transition-opacity hover:opacity-95"
            >
              로그인하기
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border-2 border-orange-200/60 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm shadow-orange-200/25">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-market-header text-white shadow-market">
                  <PawTabIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand">
                    인증 돌봄 목록 노출
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-900">
                    {listingActive ? '노출 중' : '미노출'}
                  </p>
                  {listingVisibleUntil && (
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      노출 만료:{' '}
                      {format(new Date(listingVisibleUntil), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                    </p>
                  )}
                  {!listingVisibleUntil && promoFree && !guardCertified && (
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      보호맘 프로필을 저장하고 운영 인증을 마치면 「인증 돌봄」 탭 목록에 무료로 올라가요. 돌봄·맡김은
                      이용자 간에 조율해 주세요.
                    </p>
                  )}
                  {!listingVisibleUntil && !promoFree && (
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      노출을 신청하면 「인증 돌봄」 탭 목록에 보여요. 프로필은 보호맘 등록에서 먼저 완료해 주세요. 과금은
                      노출 기간에만 해당하며, 돌봄·맡김 이후는 이용자 간 책임이에요.
                    </p>
                  )}
                  {!listingVisibleUntil && promoFree && guardCertified && (
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      인증이 완료된 보호맘은 지금 무료로 목록에 노출돼요. 이후 정책이 바뀌면 안내드릴게요.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border-2 border-orange-200/70 bg-white shadow-market-lg">
              <div className="bg-market-cta px-5 py-4 text-white">
                <p className="text-xs font-bold text-white/90">단일 상품</p>
                <h3 className="mt-0.5 text-lg font-black tracking-tight">{guardMomProduct.title}</h3>
              </div>
              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {guardMomProduct.badge && (
                    <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-extrabold text-brand">
                      {guardMomProduct.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{guardMomProduct.description}</p>
                {promoFree ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 py-3.5 text-center text-sm font-extrabold text-emerald-900">
                    한시적 무료 — 인증 완료 시 목록 노출
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={checkoutLoading !== null}
                    onClick={() => void handlePay(guardMomProduct.key)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-market-cta py-3.5 text-sm font-extrabold text-white shadow-market transition-transform active:scale-[0.98] disabled:opacity-60"
                  >
                    {checkoutLoading === guardMomProduct.key ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        이동 중…
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        노출 신청하기
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border-2 border-pink-200/80 bg-white shadow-market-lg">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-4 text-white">
                <p className="text-xs font-bold text-white/90">만나자 · 교배</p>
                <h3 className="mt-0.5 text-lg font-black tracking-tight">{breedingProduct.title}</h3>
              </div>
              <div className="space-y-4 p-5">
                <div className="rounded-xl border border-pink-100 bg-pink-50/80 px-3 py-2.5 text-xs font-semibold text-pink-950">
                  <p className="font-extrabold">
                    {breedingListingActive ? '교배 글 노출 중' : '교배 글 미노출'}
                  </p>
                  {breedingListingUntil && (
                    <p className="mt-1 text-pink-900/90">
                      노출 만료:{' '}
                      {format(new Date(breedingListingUntil), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                    </p>
                  )}
                  {!breedingListingUntil && promoFree && (
                    <p className="mt-1 font-medium text-pink-900/80">
                      지금은 한시적 무료로 「만나자」 목록·홈 피드에 교배 글을 올릴 수 있어요.
                    </p>
                  )}
                  {!breedingListingUntil && !promoFree && (
                    <p className="mt-1 font-medium text-pink-900/80">결제 시 7일간 만나자·피드에 교배 글을 올릴 수 있어요.</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {breedingProduct.badge && (
                    <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-[10px] font-extrabold text-pink-700">
                      {breedingProduct.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{breedingProduct.description}</p>
                {promoFree ? (
                  <div className="rounded-2xl border border-pink-200 bg-pink-50 py-3.5 text-center text-sm font-extrabold text-pink-900">
                    한시적 무료 — 만나자에서 「교배」로 글 작성
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={checkoutLoading !== null}
                    onClick={() => void handlePay(breedingProduct.key)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 py-3.5 text-sm font-extrabold text-white shadow-md transition-transform active:scale-[0.98] disabled:opacity-60"
                  >
                    {checkoutLoading === breedingProduct.key ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        이동 중…
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        교배 글 7일 노출 결제
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-xs font-extrabold text-slate-500">최근 기록</h3>
              {listLoading ? (
                <div className="flex justify-center py-8 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin text-brand" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-sm text-slate-500">아직 기록이 없습니다.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div>
                        <p className="font-bold text-slate-800">{orderProductLabel(o.product_key)}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(o.created_at), 'M월 d일 HH:mm', { locale: ko })}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          o.status === 'paid'
                            ? 'bg-brand-soft text-brand'
                            : o.status === 'pending'
                              ? 'bg-brand-muted text-slate-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {o.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
