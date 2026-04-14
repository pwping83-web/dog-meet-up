/** 모이자·만나자 목록: 저장된 동네 기준 최대 거리(km). 1~30 정수. */

const STORAGE_KEY = 'daeng_moija_mannaja_radius_km_v1';

export const MEETUP_NEARBY_RADIUS_MIN = 1;
export const MEETUP_NEARBY_RADIUS_MAX = 30;

const DEFAULT_KM = 30;

function clampRadius(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_KM;
  const r = Math.round(n);
  return Math.min(MEETUP_NEARBY_RADIUS_MAX, Math.max(MEETUP_NEARBY_RADIUS_MIN, r));
}

/** 예전 저장값(0·50·100 등) → 1~30으로 맞춤 */
export function readMeetupNearbyRadiusKm(): number {
  if (typeof window === 'undefined') return DEFAULT_KM;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return DEFAULT_KM;
    const n = Number(raw);
    if (n === 0) return DEFAULT_KM;
    return clampRadius(n);
  } catch {
    return DEFAULT_KM;
  }
}

export function writeMeetupNearbyRadiusKm(km: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, String(clampRadius(km)));
  } catch {
    /* ignore */
  }
}

export function labelMeetupNearbyRadiusKm(km: number): string {
  return `${clampRadius(km)}km`;
}
