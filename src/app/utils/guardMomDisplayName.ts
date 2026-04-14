import { hashSeed } from '../data/virtualDogPhotos';

/** `user_id` 기준 고정 — 동일 보호맘은 항상 같은 호칭 */
const GUARD_MOM_PUBLIC_NICKS = [
  '사랑',
  '뽀숑',
  '하늘',
  '달콤',
  '포근',
  '다정',
  '든든',
  '포슬',
  '솜털',
  '산책',
] as const;

/** 목록·상단에 쓰기 좋은 짧은 지역 라벨 (예: 안양시 만안구 → 안양) */
export function shortGuardMomAreaLabel(mom: { region_si: string; region_gu: string }): string {
  const gu = (mom.region_gu ?? '').trim();
  if (!gu) {
    const si = (mom.region_si ?? '').trim();
    return si.replace(/특별시|광역시|도$/u, '').trim() || '동네';
  }
  const first = gu.split(/\s+/)[0] ?? gu;
  if (/시$/u.test(first)) return first.replace(/시$/u, '');
  if (/구$/u.test(first)) return first.replace(/구$/u, '');
  return first.length <= 4 ? first : first.slice(0, 4);
}

/** 카드·상세 헤더용 공개 호칭 (예: 안양 사랑 보호맘) */
export function displayCertifiedGuardMomBrandName(mom: { user_id: string; region_si: string; region_gu: string }): string {
  const area = shortGuardMomAreaLabel(mom);
  const idx = hashSeed(`guard-mom-public-nick-${mom.user_id}`) % GUARD_MOM_PUBLIC_NICKS.length;
  return `${area} ${GUARD_MOM_PUBLIC_NICKS[idx]} 보호맘`;
}
