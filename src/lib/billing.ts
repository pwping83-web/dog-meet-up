import { supabase } from './supabase';

/** 결제·상품 화면에서 노출하는 Stripe 상품 (인증 돌봄 목록 7일 노출 등) */
export type BillingProductKey = 'guard_mom_listing_7d' | 'breeding_post_listing_7d';

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
      '인증 보호맘만 신청 가능. 「인증 돌봄」에 7일 노출, 잔여 있으면 연장. 과금은 노출 기간만. 돌봄·분쟁은 당사자 조율.',
    badge: '7일',
  },
  {
    key: 'breeding_post_listing_7d',
    title: '만나자 교배 신청 글 노출 (7일)',
    description:
      '만나자·교배 글은 7일간 목록·피드 노출. 1:1·실종은 무료. 잔여 있으면 연장. 진행·건강·분쟁은 당사자 책임.',
    badge: '교배·7일',
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

export async function startStripeCheckout(
  productKey: BillingProductKey,
  options?: { successPath?: string },
): Promise<void> {
  const body: Record<string, unknown> = { productKey };
  if (options?.successPath) body.successPath = options.successPath;
  await invokeCheckoutSession(body);
}

export async function startGuardMomCareCheckout(bookingId: string): Promise<void> {
  await invokeCheckoutSession({ productKey: 'guard_mom_care_day', bookingId });
}
