/**
 * Distance Calculation Utility
 *
 * 행정구역 라벨(저장된 시·구 문자열)을 대략적인 위경도로 매칭해 거리(km)를 추정합니다.
 * 인증 돌봄 목록 등은 안양 만안 기준으로 보여 주도록 페이지에서 기준점을 고를 수 있습니다.
 */

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
  해운대구: { lat: 35.1631, lng: 129.1636 },
  수성구: { lat: 35.8581, lng: 128.6311 },
  남동구: { lat: 37.4486, lng: 126.7317 },
};

const SORTED_KEYS = Object.keys(districtCoordinates).sort((a, b) => b.length - a.length);

/** 인증 돌봄 탭 등「안양 기준」거리 표기 시 사용하는 행정구 키 */
export const ANYANG_MANAN_DISTANCE_ORIGIN = '안양시 만안구';

function normalizeDistrictLabel(raw: string): string {
  return raw.trim().replace(PREFIX_STRIP, '').trim();
}

function getCoord(raw: string): { lat: number; lng: number } | null {
  const t = raw.trim();
  if (!t) return null;
  if (districtCoordinates[t]) return districtCoordinates[t];
  const n = normalizeDistrictLabel(t);
  if (districtCoordinates[n]) return districtCoordinates[n];
  for (const key of SORTED_KEYS) {
    if (n === key || n.endsWith(key)) return districtCoordinates[key];
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
