/**
 * Distance Calculation Utility
 *
 * 행정구역 라벨(저장된 시·구 문자열)을 대략적인 위경도로 매칭해 거리(km)를 추정합니다.
 * 인증 돌봄 목록 등은 안양 만안 기준으로 보여 주도록 페이지에서 기준점을 고를 수 있습니다.
 */

import { regions } from '../data/regions';

const PREFIX_STRIP =
  /^(서울특별시|서울시|경기도|부산광역시|인천광역시|대구광역시|광주광역시|대전광역시|울산광역시)\s*/u;

// 대략 구청·중심부 근처 좌표 (데모·목록 거리 표기용)
const districtCoordinates: { [key: string]: { lat: number; lng: number } } = {
  강남구: { lat: 37.5172, lng: 127.0473 },
  서초구: { lat: 37.4837, lng: 127.0324 },
  송파구: { lat: 37.5145, lng: 127.1059 },
  강동구: { lat: 37.5301, lng: 127.1238 },
  관악구: { lat: 37.4784, lng: 126.9516 },
  동작구: { lat: 37.5124, lng: 126.9393 },
  마포구: { lat: 37.5663, lng: 126.9019 },
  분당구: { lat: 37.3826, lng: 127.1188 },
  노원구: { lat: 37.6542, lng: 127.0568 },
  '안양시 만안구': { lat: 37.3896, lng: 126.9278 },
  '안양시 동안구': { lat: 37.3942, lng: 126.9569 },
  만안구: { lat: 37.3896, lng: 126.9278 },
  동안구: { lat: 37.3942, lng: 126.9569 },
  해운대구: { lat: 35.1631, lng: 129.1636 },
  수성구: { lat: 35.8581, lng: 128.6311 },
  남동구: { lat: 37.4486, lng: 126.7317 },
};

const SORTED_KEYS = Object.keys(districtCoordinates).sort((a, b) => b.length - a.length);

// 시/도 중심 좌표 (좌표가 없는 구/군은 시/도 중심 + 작은 보정으로 거리 계산)
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  서울: { lat: 37.5665, lng: 126.9780 },
  부산: { lat: 35.1796, lng: 129.0756 },
  인천: { lat: 37.4563, lng: 126.7052 },
  대구: { lat: 35.8714, lng: 128.6014 },
  광주: { lat: 35.1595, lng: 126.8526 },
  대전: { lat: 36.3504, lng: 127.3845 },
  울산: { lat: 35.5384, lng: 129.3114 },
  세종: { lat: 36.4800, lng: 127.2890 },
  경기: { lat: 37.4138, lng: 127.5183 },
  강원: { lat: 37.8228, lng: 128.1555 },
  충북: { lat: 36.6357, lng: 127.4917 },
  충남: { lat: 36.5184, lng: 126.8000 },
  전북: { lat: 35.7175, lng: 127.1530 },
  전남: { lat: 34.8679, lng: 126.9910 },
  경북: { lat: 36.4919, lng: 128.8889 },
  경남: { lat: 35.4606, lng: 128.2132 },
  제주: { lat: 33.4890, lng: 126.4983 },
};

const districtCityCandidates = new Map<string, Set<string>>();
for (const region of regions) {
  for (const district of region.districts) {
    const key = district.trim();
    if (!key) continue;
    const set = districtCityCandidates.get(key) ?? new Set<string>();
    set.add(region.city);
    districtCityCandidates.set(key, set);
  }
}
const uniqueDistrictToCity = new Map<string, string>();
for (const [district, citySet] of districtCityCandidates.entries()) {
  if (citySet.size === 1) uniqueDistrictToCity.set(district, [...citySet][0]);
}

/** 인증 돌봄 탭 등「안양 기준」거리 표기 시 사용하는 행정구 키 */
export const ANYANG_MANAN_DISTANCE_ORIGIN = '안양시 만안구';

function normalizeDistrictLabel(raw: string): string {
  return raw.trim().replace(PREFIX_STRIP, '').trim();
}

function compactDistrictLabel(raw: string): string {
  return raw
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hashToJitter(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) % 100000;
  }
  // -0.08 ~ +0.08 정도 보정 (동일 시/도 내 카드가 같은 거리로 뭉치지 않게)
  return ((h % 161) - 80) / 1000;
}

function detectCity(label: string): string | null {
  const t = label.trim();
  if (!t) return null;
  for (const city of Object.keys(cityCoordinates)) {
    if (t === city || t.startsWith(`${city} `) || t.includes(`${city} `)) return city;
  }
  return null;
}

function getCoord(raw: string): { lat: number; lng: number } | null {
  const t = raw.trim();
  if (!t) return null;
  if (districtCoordinates[t]) return districtCoordinates[t];
  const n = compactDistrictLabel(normalizeDistrictLabel(t));
  if (districtCoordinates[n]) return districtCoordinates[n];
  for (const key of SORTED_KEYS) {
    if (n === key || n.endsWith(key) || n.includes(key)) return districtCoordinates[key];
  }
  const cityFromLabel = detectCity(n) ?? detectCity(t);
  if (cityFromLabel && cityCoordinates[cityFromLabel]) {
    const base = cityCoordinates[cityFromLabel];
    const j = hashToJitter(n || t);
    return { lat: base.lat + j, lng: base.lng - j };
  }
  // 시/도 표기가 없더라도, 전국에서 유일한 구/군 이름이면 해당 시/도 중심으로 추정
  for (const [district, city] of uniqueDistrictToCity.entries()) {
    if (n === district || n.endsWith(district) || n.includes(district)) {
      const base = cityCoordinates[city];
      if (!base) continue;
      const j = hashToJitter(`${city}-${district}`);
      return { lat: base.lat + j, lng: base.lng - j };
    }
  }
  return null;
}

/**
 * 두 지역 라벨 간 대략 거리(km). 매칭 실패 시 999 (호출부에서 폴백 처리 가능)
 */
export function calculateDistance(district1: string, district2: string): number {
  const coord1 = getCoord(district1);
  const coord2 = getCoord(district2);

  if (!coord1 || !coord2) {
    return 999;
  }

  const latDiff = coord1.lat - coord2.lat;
  const lngDiff = coord1.lng - coord2.lng;
  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;

  return Math.round(distance * 10) / 10;
}

/**
 * formatDistance(999) → "거리 정보 없음" 등으로 바꾸지 않고, 계산 단계에서 999가 나오지 않게 하는 편이 좋음
 */
export function formatDistance(km: number): string {
  if (km >= 900) return '—';
  if (km <= 0.15) return '근처';
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km}km`;
}
