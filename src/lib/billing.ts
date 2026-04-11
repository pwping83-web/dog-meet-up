import { supabase } from './supabase';

export type BillingProductKey = 'premium_month' | 'meetup_boost';

export const BILLING_PRODUCTS: {
  key: BillingProductKey;
  title: string;
  description: string;
  badge?: string;
}[] = [
  {
    key: 'premium_month',
    title: '댕댕 프리미엄 (월)',
    description: '댕집사 노출 우선, 모임 상단 부스트 등 혜택(Stripe 구독으로 실제 과금)',
    badge: '구독',
  },
  {
    key: 'meetup_boost',
    title: '모임 부스트 (1회)',
    description: '내 모임을 탐색·검색 상단에 더 자주 노출(Stripe 일회 결제)',
    badge: '1회',
  },
];

export async function startStripeCheckout(productKey: BillingProductKey): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
    'create-checkout-session',
    { body: { productKey } },
  );

  if (error) {
    throw new Error(error.message ?? '결제 세션을 열 수 없습니다.');
  }

  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error));
  }

  const url = data && typeof data === 'object' && 'url' in data ? data.url : undefined;
  if (!url) {
    throw new Error('Checkout URL이 비어 있습니다. Edge Function과 Stripe Price ID를 확인하세요.');
  }

  window.location.assign(url);
}
