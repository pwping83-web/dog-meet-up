import { supabase } from './supabase';

export type BillingProductKey =
  | 'premium_month'
  | 'meetup_boost'
  | 'guard_mom_listing_7d';

export const BILLING_PRODUCTS: {
  key: BillingProductKey;
  title: string;
  description: string;
  badge?: string;
}[] = [
  {
    key: 'premium_month',
    title: '댕댕 프리미엄 (월)',
    description: '유료 돌봄(댕집사) 노출 우선, 만남 글 부스트 등 혜택(Stripe 구독)',
    badge: '구독',
  },
  {
    key: 'meetup_boost',
    title: '만남 글 부스트 (1회)',
    description: '모이자·만나자 글을 탐색·검색 상단에 더 자주 노출(Stripe 일회 결제)',
    badge: '1회',
  },
  {
    key: 'guard_mom_listing_7d',
    title: '인증 보호맘 노출 (7일)',
    description:
      '운영팀 인증을 받은 보호맘만 이용 가능. 소액으로 「보호맘 란」에 7일 동안 노출돼요 (잔여 기간이 있으면 이어서 연장)',
    badge: '7일',
  },
];

async function invokeCheckoutSession(body: Record<string, unknown>): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
    'create-checkout-session',
    { body },
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

export async function startStripeCheckout(productKey: BillingProductKey): Promise<void> {
  await invokeCheckoutSession({ productKey });
}

export async function startGuardMomCareCheckout(bookingId: string): Promise<void> {
  await invokeCheckoutSession({ productKey: 'guard_mom_care_day', bookingId });
}
