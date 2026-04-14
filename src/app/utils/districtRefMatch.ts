/** 비교용으로 공백 제거 */
export function compactDistrictLabel(s: string): string {
  return s.replace(/\s+/g, '').trim();
}

/**
 * 내 동네(ref) 한 줄과 글의 district가 같은 권역으로 볼 수 있는지.
 * 예: ref "안양시" ↔ 글 "안양시 만안구", ref "강남구" ↔ 글 "강남구"
 */
export function districtMatchesOneReference(meetupDistrict: string, refDistrict: string): boolean {
  const m = compactDistrictLabel(meetupDistrict);
  const r = compactDistrictLabel(refDistrict);
  if (!m || !r) return false;
  if (m === r) return true;
  if (m.startsWith(r) || r.startsWith(m)) return true;
  if (r.length >= 3 && m.includes(r)) return true;
  if (m.length >= 3 && r.includes(m)) return true;
  return false;
}

export function districtMatchesAnyReference(meetupDistrict: string, refs: readonly string[]): boolean {
  if (!refs.length) return false;
  return refs.some((ref) => ref && districtMatchesOneReference(meetupDistrict, ref));
}
