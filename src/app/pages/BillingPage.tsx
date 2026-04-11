import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowLeft, Baby, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BILLING_PRODUCTS, startStripeCheckout, type BillingProductKey } from '../../lib/billing';

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
    guard_mom_listing_7d: '유료 돌봄 목록 노출 (7일)',
    guard_mom_care_day: '보호맘 돌봄 예약',
  };
  return map[key] ?? key;
}

export function BillingPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [listingVisibleUntil, setListingVisibleUntil] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<BillingProductKey | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const checkoutStatus = searchParams.get('checkout');

  const loadBilling = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setListingVisibleUntil(null);
      setListLoading(false);
      return;
    }
    setListLoading(true);
    setPageError(null);

    const [ordersRes, gmRes] = await Promise.all([
      supabase
        .from('billing_orders')
        .select('id,product_key,status,created_at,paid_at')
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('certified_guard_moms')
        .select('listing_visible_until')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    if (ordersRes.error) {
      setPageError(
        '결제 내역을 불러오지 못했습니다. Supabase에 billing_orders 마이그레이션을 적용했는지 확인하세요.',
      );
      setOrders([]);
    } else {
      setOrders((ordersRes.data ?? []) as OrderRow[]);
    }

    if (!gmRes.error && gmRes.data?.listing_visible_until) {
      setListingVisibleUntil(gmRes.data.listing_visible_until);
    } else {
      setListingVisibleUntil(null);
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

  const listingActive =
    listingVisibleUntil != null &&
    !Number.isNaN(Date.parse(listingVisibleUntil)) &&
    new Date(listingVisibleUntil) > new Date();

  const product = BILLING_PRODUCTS[0];

  return (
    <div className="min-h-full bg-slate-50 pb-28">
      <header className="sticky top-0 z-40 bg-brand shadow-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-3">
          <Link
            to="/explore"
            className="rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
            aria-label="홈으로"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-extrabold text-white">유료 돌봄 · 결제</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {checkoutStatus === 'success' && (
          <div className="rounded-2xl border border-brand/25 bg-brand-soft px-4 py-3 text-sm font-semibold text-slate-800">
            결제가 완료되었습니다. Stripe 웹훅이 반영되면 아래 노출 기한이 갱신됩니다.
          </div>
        )}
        {checkoutStatus === 'cancel' && (
          <div className="rounded-2xl border border-brand/20 bg-brand-muted px-4 py-3 text-sm font-semibold text-slate-700">
            결제를 취소했습니다.
          </div>
        )}

        {pageError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {pageError}
          </div>
        )}

        <div className="rounded-2xl border border-brand/20 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 shrink-0 text-brand" />
            <h2 className="text-base font-extrabold text-slate-800">실제 과금 안내</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Stripe Checkout으로 카드 결제가 이루어집니다. Edge Function에{' '}
            <code className="rounded bg-brand/10 px-1 py-0.5 text-xs text-brand">STRIPE_SECRET_KEY</code>,{' '}
            <code className="rounded bg-brand/10 px-1 py-0.5 text-xs text-brand">PUBLIC_SITE_URL</code>,{' '}
            <code className="rounded bg-brand/10 px-1 py-0.5 text-xs text-brand">
              STRIPE_PRICE_GUARD_MOM_LISTING_7D
            </code>
            를 설정하고 웹훅을 <code className="rounded bg-brand/10 px-1 py-0.5 text-xs text-brand">stripe-webhook</code>에
            연결하면 운영 환경에서 동작합니다.
          </p>
        </div>

        {authLoading ? (
          <div className="flex justify-center py-16 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : !user ? (
          <div className="rounded-2xl border border-brand/15 bg-white p-8 text-center shadow-sm">
            <p className="mb-4 text-sm font-medium text-slate-600">결제하려면 로그인이 필요합니다.</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand to-brand-bright px-6 py-3 text-sm font-bold text-white shadow-md shadow-brand/25 transition-opacity hover:opacity-95"
            >
              로그인하기
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border-2 border-brand/25 bg-gradient-to-br from-brand-soft to-white p-5 shadow-sm shadow-brand/10">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-bright text-white shadow-md shadow-brand/20">
                  <Baby className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand">
                    유료 돌봄 목록 노출
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
                  {!listingVisibleUntil && (
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      결제 후 「유료 돌봄」 탭에서 인증 보호맘으로 보여요. 프로필은 보호맘 등록에서 먼저 완료해 주세요.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border-2 border-brand/25 bg-white shadow-lg shadow-brand/15">
              <div className="bg-gradient-to-r from-brand to-brand-bright px-5 py-4 text-white">
                <p className="text-xs font-bold text-white/90">단일 상품</p>
                <h3 className="mt-0.5 text-lg font-black tracking-tight">{product.title}</h3>
              </div>
              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {product.badge && (
                    <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-extrabold text-brand">
                      {product.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
                <button
                  type="button"
                  disabled={checkoutLoading !== null}
                  onClick={() => void handlePay(product.key)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand-bright py-3.5 text-sm font-extrabold text-white shadow-md shadow-brand/25 transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  {checkoutLoading === product.key ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      이동 중…
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Stripe로 결제하기
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-xs font-extrabold text-slate-500">최근 결제 시도</h3>
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
