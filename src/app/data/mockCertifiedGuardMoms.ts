/**
 * 가상 인증 보호맘 — DB에 노출 중인 행이 없거나 조회 오류 시 인증 돌봄 탭 데모용.
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
    region_dong: '정자동',
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
    region_dong: '공덕동',
    per_day_fee_krw: 42000,
    offers_daeng_pickup: false,
    certified_at: ISO_PAST,
    listing_visible_until: ISO_FUTURE,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000004',
    created_at: ISO_PAST,
    updated_at: ISO_PAST,
    user_id: 'b1000000-0000-4000-8000-000000000004',
    intro:
      '송파 잠실·문정 쪽 퍼피·소형견 맡기기 좋아해요. 로트와일러 한 마리 키워 본 경험이 있어 대형견 상담도 가능해요. 주말·연휴 일정 미리 말씀 주세요.',
    region_si: '서울특별시',
    region_gu: '송파구',
    region_dong: '잠실동',
    per_day_fee_krw: 32000,
    offers_daeng_pickup: true,
    certified_at: ISO_PAST,
    listing_visible_until: ISO_FUTURE,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000005',
    created_at: ISO_PAST,
    updated_at: ISO_PAST,
    user_id: 'b1000000-0000-4000-8000-000000000005',
    intro:
      '안양·군포 인근 맞벌이 가정 맡기기 많이 해요. 산책·밥·놀이 루틴 맞춰 드리고, 하원 전까지 사진 한 장 보내드릴게요.',
    region_si: '경기도',
    region_gu: '안양시 만안구',
    region_dong: '안양동',
    per_day_fee_krw: 24000,
    offers_daeng_pickup: true,
    certified_at: ISO_PAST,
    listing_visible_until: ISO_FUTURE,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000006',
    created_at: ISO_PAST,
    updated_at: ISO_PAST,
    user_id: 'b1000000-0000-4000-8000-000000000006',
    intro:
      '노원·도봉 쪽에서 하루·이틀 단기 맡기기 위주예요. 예민한 아이는 사전 만남 한 번 추천드려요. 고양이와 함께 키워서 사회성 있는 강아지와 잘 맞아요.',
    region_si: '서울특별시',
    region_gu: '노원구',
    region_dong: '상계동',
    per_day_fee_krw: 30000,
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

/** 목록·상세용 데모 프로필 사진 (실 DB 행에는 없음) */
const MOCK_GUARD_MOM_PHOTO_BY_ID: Record<string, string> = {
  'a1000000-0000-4000-8000-000000000001':
    'https://images.unsplash.com/photo-1630766786510-85bc1c6f18d4?w=400&h=400&fit=crop&q=80',
  'a1000000-0000-4000-8000-000000000002':
    'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=400&h=400&fit=crop&q=80',
  'a1000000-0000-4000-8000-000000000003':
    'https://images.unsplash.com/photo-1587300003388-59208cc96262?w=400&h=400&fit=crop&q=80',
  'a1000000-0000-4000-8000-000000000004':
    'https://images.unsplash.com/photo-1672838565001-3e7e1e96bb52?w=400&h=400&fit=crop&q=80',
  'a1000000-0000-4000-8000-000000000005':
    'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=400&h=400&fit=crop&q=80',
  'a1000000-0000-4000-8000-000000000006':
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop&q=80',
};

export function getCertifiedGuardMomPhotoUrl(id: string | undefined): string | null {
  if (!id) return null;
  return MOCK_GUARD_MOM_PHOTO_BY_ID[id] ?? null;
}
