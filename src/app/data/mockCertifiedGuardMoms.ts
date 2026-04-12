/**
 * 가상 인증 보호맘 — Supabase 목록이 비었을 때 인증 돌봄 탭 데모용.
 * 상세(/guard-mom/:id)는 getMockCertifiedGuardMomById 로 동일 데이터를 씁니다.
 */
const ISO_PAST = '2026-03-01T12:00:00.000+09:00';
const ISO_FUTURE = '2027-12-31T23:59:59.000+09:00';

export const mockCertifiedGuardMoms = [
  {
    id: 'a1000000-0000-4000-8000-000000000001',
    created_at: ISO_PAST,
    updated_at: ISO_PAST,
    user_id: 'b1000000-0000-4000-8000-000000000001',
    intro:
      '강남에서 소형견 맡기기 8년 차예요. 말티즈·포메 위주로 집에서 편안하게 케어하고, 단지 산책로·근처 공원으로 하루 3번 산책해요. 예방접종·심장사상충 확인 후 맡아요.',
    region_si: '서울특별시',
    region_gu: '강남구',
    region_dong: '역삼동',
    per_day_fee_krw: 35000,
    offers_daeng_pickup: true,
    certified_at: ISO_PAST,
    listing_visible_until: ISO_FUTURE,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000002',
    created_at: ISO_PAST,
    updated_at: ISO_PAST,
    user_id: 'b1000000-0000-4000-8000-000000000002',
    intro:
      '분당에서 비글·코기 등 중형견 맡아요. 마당은 없지만 옆 공원이 가까워서 활동량 맞춰 산책합니다. 첫 만남 시 성향 체크 후 일정 조율할게요.',
    region_si: '경기도',
    region_gu: '분당구',
    per_day_fee_krw: 28000,
    offers_daeng_pickup: false,
    certified_at: ISO_PAST,
    listing_visible_until: ISO_FUTURE,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000003',
    created_at: ISO_PAST,
    updated_at: ISO_PAST,
    user_id: 'b1000000-0000-4000-8000-000000000003',
    intro:
      '마포·서대문 인근 노견·투약 필요 아이 경험 많아요. 집중 케어 가능하고, 맡기 전 건강 상태·복약 시간 꼭 알려 주세요. 장기 맡김도 상담 가능합니다.',
    region_si: '서울특별시',
    region_gu: '마포구',
    per_day_fee_krw: 42000,
    offers_daeng_pickup: false,
    certified_at: ISO_PAST,
    listing_visible_until: ISO_FUTURE,
  },
] as const;

export const MOCK_GUARD_MOM_IDS = new Set(mockCertifiedGuardMoms.map((m) => m.id));

export function getMockCertifiedGuardMomById(id: string | undefined) {
  if (!id) return null;
  return mockCertifiedGuardMoms.find((m) => m.id === id) ?? null;
}

export function isMockGuardMomId(id: string) {
  return MOCK_GUARD_MOM_IDS.has(id);
}
