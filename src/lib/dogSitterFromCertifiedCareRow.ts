import type { Database } from './supabase';
import type { DogSitter } from '../app/types';
import { getCertifiedGuardMomHeroImageUrl } from '../app/data/mockCertifiedGuardMoms';

export type CertifiedGuardMomRow = Database['public']['Tables']['certified_guard_moms']['Row'];

/** 인증 돌봄 행(provider_kind=dog_sitter) → 돌집사 카드/프로필용 모델 */
export function dogSitterFromCertifiedCareRow(
  m: CertifiedGuardMomRow,
  careDisplayName?: string | null,
): DogSitter {
  const gu = (m.region_gu ?? '').trim() || (m.region_si ?? '').trim() || '동네';
  const nick = (careDisplayName ?? '').trim();
  return {
    id: m.user_id,
    name: nick || `댕집사·${gu}`,
    profileImage: getCertifiedGuardMomHeroImageUrl(m),
    location: [m.region_si, m.region_gu].filter(Boolean).join(' ').trim() || gu,
    district: gu,
    specialties: ['방문 돌봄'],
    rating: 5,
    reviewCount: 0,
    experience: '인증',
    description: (m.intro ?? '').slice(0, 400),
    estimatedPrices: [{ category: '방문', priceRange: `1일 약 ${m.per_day_fee_krw.toLocaleString()}원` }],
  };
}
