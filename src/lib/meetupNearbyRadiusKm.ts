/** 모이자·만나자 목록: 저장된 동네 기준 최대 거리(km). 0 = 제한 없음(구 단위만). */

const STORAGE_KEY = 'daeng_moija_mannaja_radius_km_v1';

export const MEETUP_NEARBY_RADIUS_OPTIONS = [3, 5, 10, 20, 30, 50, 100, 0] as const;
export type MeetupNearbyRadiusKm = (typeof MEETUP_NEARBY_RADIUS_OPTIONS)[number];

const DEFAULT_KM: MeetupNearbyRadiusKm = 30;

function isAllowed(n: number): n is MeetupNearbyRadiusKm {
  return (MEETUP_NEARBY_RADIUS_OPTIONS as readonly number[]).includes(n);
}

export function readMeetupNearbyRadiusKm(): MeetupNearbyRadiusKm {
  if (typeof window === 'undefined') return DEFAULT_KM;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return DEFAULT_KM;
    const n = Number(raw);
    return isAllowed(n) ? n : DEFAULT_KM;
  } catch {
    return DEFAULT_KM;
  }
}

export function writeMeetupNearbyRadiusKm(km: MeetupNearbyRadiusKm): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, String(km));
  } catch {
    /* ignore */
  }
}

export function labelMeetupNearbyRadiusKm(km: MeetupNearbyRadiusKm): string {
  if (km === 0) return '제한 없음';
  return `${km}km`;
}
