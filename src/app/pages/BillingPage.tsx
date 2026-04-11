import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowLeft, CreditCard, Crown, Loader2, ShieldCheck } from 'lucide-react';
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

export function BillingPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<BillingProductKey | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const checkoutStatus = searchParams.get('checkout');

  const loadBilling = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setPremiumUntil(null);
      setListLoading(false);
      return;
    }
    setListLoading(true);
    setPageError(null);

    const [ordersRes, entRes] = await Promise.all([
      supabase
        .from('billing_orders')
        .select('id,product_key,status,created_at,paid_at')
        .order('created_at', { ascending: false })
        .limit(30),
      supabase.from('user_entitlements').select('premium_until').eq('user_id', user.id).maybeSingle(),
    ]);

    if (ordersRes.error) {
      setPageError(
        '결제 내역을 불러오지 못했습니다. Supabase에 billing_orders 마이그레이션을 적용했는지 확인하세요.',
      );
      setOrders([]);
    } else {
      setOrders((ordersRes.data ?? []) as OrderRow[]);
    }

    if (!entRes.error && entRes.data?.premium_until) {
      setPremiumUntil(entRes.data.premium_until);
    } else {
      setPremiumUntil(null);
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

  const isPremium =
    premiumUntil != null && !Number.isNaN(Date.parse(premiumUntil)) && new Date(premiumUntil) > new Date();

  return (
    <div className="min-h-full bg-slate-50 pb-28">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link
            to="/my"
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-orange-600"
            aria-label="뒤로"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-extrabold text-slate-800">결제 · 프리미엄</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {checkoutStatus === 'success' && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            결제가 완료되었습니다. Stripe 웹훅이 반영되면 아래 상태가 갱신됩니다.
          </div>
        )}
        {checkoutStatus === 'cancel' && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            결제를 취소했습니다.
          </div>
        )}

        {pageError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {pageError}
          </div>
        )}

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-orange-500" />
            <h2 className="text-base font-extrabold text-slate-800">실제 과금 안내</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Stripe Checkout으로 카드 결제가 이루어집니다. Supabase Edge Function에{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">STRIPE_SECRET_KEY</code>,{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">PUBLIC_SITE_URL</code>, Price ID
            시크릿을 넣고, 대시보드에서 웹훅을 <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">stripe-webhook</code>{' '}
            URL로 연결해야 운영 환경에서 정상 동작합니다.
          </p>
        </div>

        {authLoading ? (
          <div className="flex justify-center py-16 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !user ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
            <p className="mb-4 text-sm font-medium text-slate-600">결제하려면 로그인이 필요합니다.</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 px-6 py-3 text-sm font-bold text-white shadow-md"
            >
              로그인하기
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-inner">
                  <Crown className="h-6 w-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-700/80">프리미엄 상태</p>
                  <p className="mt-1 text-lg font-black text-slate-900">
                    {isPremium ? '이용 중' : '미가입'}
                  </p>
                  {premiumUntil && (
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      만료 예정:{' '}
                      {format(new Date(premiumUntil), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="px-1 text-sm font-extrabold text-slate-500">상품</h3>
              {BILLING_PRODUCTS.map((p) => (
                <div
                  key={p.key}
                  className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-slate-900">{p.title}</h4>
                        {p.badge && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{p.description}</p>
                    </div>
                    <CreditCard className="h-5 w-5 shrink-0 text-slate-300" />
                  </div>
                  <button
                    type="button"
                    disabled={checkoutLoading !== null}
                    onClick={() => void handlePay(p.key)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 py-3.5 text-sm font-bold text-white shadow-md transition-transform active:scale-[0.98] disabled:opacity-60"
                  >
                    {checkoutLoading === p.key ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        이동 중…
                      </>
                    ) : (
                      'Stripe로 결제하기'
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-extrabold text-slate-500">최근 결제 시도</h3>
              {listLoading ? (
                <div className="flex justify-center py-8 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-sm text-slate-500">아직 기록이 없습니다.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div>
                        <p className="font-bold text-slate-800">{o.product_key}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(o.created_at), 'M월 d일 HH:mm', { locale: ko })}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          o.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
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
