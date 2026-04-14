/** 돌봄 글 `estimatedCost`에 포함된 희망 유형 (CreateRequestPage 저장 형식과 동기) */
export type CareNeedTarget = 'dog_sitter' | 'guard_mom' | 'both';

export function parseCareNeedTargetFromEstimatedCost(estimatedCost?: string | null): CareNeedTarget {
  const s = (estimatedCost ?? '').trim();
  if (s.includes('댕집사 희망')) return 'dog_sitter';
  if (s.includes('보호맘 희망')) return 'guard_mom';
  if (s.includes('댕집사·보호맘 모두 가능') || s.includes('모두 가능')) return 'both';
  return 'both';
}

export type CertifiedCareRole = 'dog_sitter' | 'guard_mom';

export function certifiedProviderMatchesNeed(
  need: CareNeedTarget,
  providerKind: CertifiedCareRole | null,
): boolean {
  if (providerKind == null) return false;
  if (need === 'both') return true;
  return need === providerKind;
}
