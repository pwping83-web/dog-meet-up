import { supabase } from './supabase';

/** 결제·상품 화면에서 노출하는 Stripe 상품 (인증 돌봄 목록 7일 노출 등) */
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
      '운영 인증을 마친 보호맘만 목록 노출을 신청할 수 있어요. 「인증 돌봄」 탭에 7일간 보이며, 잔여 기간이 있으면 이어서 연장돼요. 과금은 이 목록에 올라가 보이는 기간에만 해당하고, 돌봄·맡김 내용과 그 이후 일정·분쟁은 보호맘 본인과 맡기는 분이 직접 책임지고 조율해 주세요.',
    badge: '7일',
  },
];

async function invokeCheckoutSession(body: Record<string, unknown>): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
    'create-checkout-session',
    { body },
  );

  if (error) {
    throw new Error(error.message ?? '다음 단계로 이동할 수 없습니다.');
  }

  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error));
  }

  const url = data && typeof data === 'object' && 'url' in data ? data.url : undefined;
  if (!url) {
    throw new Error('연결을 완료할 수 없습니다. 잠시 후 다시 시도해 주세요.');
  }

  window.location.assign(url);
}

export async function startStripeCheckout(productKey: BillingProductKey): Promise<void> {
  await invokeCheckoutSession({ productKey });
}

export async function startGuardMomCareCheckout(bookingId: string): Promise<void> {
  await invokeCheckoutSession({ productKey: 'guard_mom_care_day', bookingId });
}
