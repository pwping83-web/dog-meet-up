import { supabase } from './supabase';

/** 결제·상품 화면에서 노출하는 Stripe 상품 (유료 돌봄 목록 7일 노출 등) */
export type BillingProductKey = 'guard_mom_listing_7d';

export const BILLING_PRODUCTS: {
  key: BillingProductKey;
  title: string;
  description: string;
  badge?: string;
}[] = [
  {
    key: 'guard_mom_listing_7d',
    title: '인증 보호맘 란 노출 (7일)',
    description:
      '운영팀 인증을 받은 보호맘만 구매할 수 있어요. 「유료 돌봄」 탭에 7일간 노출되며, 잔여 기간이 있으면 이어서 연장돼요.',
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
