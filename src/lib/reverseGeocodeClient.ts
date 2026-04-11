/**
 * 카카오맵 키 없이 브라우저에서 좌표 → 행정구역(시·구) 추정.
 * BigDataCloud 클라이언트용 엔드포인트(CORS 허용, 키 불필요).
 * @see https://www.bigdatacloud.com/packages/reverse-geocoding
 */

import { matchAdministrativeNames, matchKakaoAdministrative } from './matchKakaoToRegion';

/** 영문 광역 단위 → 카카오식 depth1 (matchKakaoAdministrative 입력과 호환) */
const EN_SUBDIV_TO_DEPTH1: Record<string, string> = {
  Seoul: '서울특별시',
  Busan: '부산광역시',
  Daegu: '대구광역시',
  Incheon: '인천광역시',
  Gwangju: '광주광역시',
  Daejeon: '대전광역시',
  Ulsan: '울산광역시',
  Sejong: '세종특별자치시',
  Gyeonggi: '경기도',
  Gangwon: '강원특별자치도',
  'North Chungcheong': '충청북도',
  'South Chungcheong': '충청남도',
  'North Jeolla': '전북특별자치도',
  'South Jeolla': '전라남도',
  'North Gyeongsang': '경상북도',
  'South Gyeongsang': '경상남도',
  Jeju: '제주특별자치도',
};

function toDepth1(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (/[가-힣]/.test(t)) {
    if (t.endsWith('시') || t.endsWith('도') || t.includes('특별')) return t;
    return t;
  }
  return EN_SUBDIV_TO_DEPTH1[t] || EN_SUBDIV_TO_DEPTH1[t.replace(/-si$/i, '').trim()] || t;
}

/**
 * 위·경도로 행정 단서 문자열을 만든 뒤 앱 regions 와 맞춤.
 */
export async function reverseGeocodeToKoreaAdmin(
  lat: number,
  lng: number,
): Promise<{ depth1: string; depth2: string; depth3: string }> {
  const u = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
  u.searchParams.set('latitude', String(lat));
  u.searchParams.set('longitude', String(lng));
  u.searchParams.set('localityLanguage', 'ko');

  const res = await fetch(u.toString());
  if (!res.ok) {
    throw new Error(`역지오코딩 요청 실패 (${res.status})`);
  }

  const j = (await res.json()) as Record<string, unknown>;

  const admin = j.localityInfo as { administrative?: Array<{ name?: string }> } | undefined;
  const adminNames = (admin?.administrative ?? []).map((x) => String(x.name ?? ''));

  const fromStack = matchAdministrativeNames(adminNames);
  if (fromStack.matched) {
    const depth1Ko =
      Object.entries({
        서울: '서울특별시',
        부산: '부산광역시',
        대구: '대구광역시',
        인천: '인천광역시',
        광주: '광주광역시',
        대전: '대전광역시',
        울산: '울산광역시',
        세종: '세종특별자치시',
        경기: '경기도',
        강원: '강원특별자치도',
        충북: '충청북도',
        충남: '충청남도',
        전북: '전북특별자치도',
        전남: '전라남도',
        경북: '경상북도',
        경남: '경상남도',
        제주: '제주특별자치도',
      }).find(([key]) => key === fromStack.city)?.[1] ?? fromStack.city;

    return { depth1: depth1Ko, depth2: fromStack.district, depth3: '' };
  }

  const principal = String(j.principalSubdivision ?? '');
  const city = String(j.city ?? '');
  const locality = String(j.locality ?? '');
  const admin0 = adminNames[0] ?? '';

  const depth1 = toDepth1(principal || city) || toDepth1(locality);
  const depth2 = locality || admin0 || city || '';
  const depth3 = '';

  if (!depth1 && !depth2) {
    throw new Error('이 위치의 시·구 정보를 가져오지 못했습니다.');
  }

  return { depth1: depth1 || depth2, depth2, depth3 };
}

/** 좌표 → 앱에서 쓰는 city, district (regions.ts 기준) */
export async function reverseGeocodeToRegion(lat: number, lng: number) {
  const parts = await reverseGeocodeToKoreaAdmin(lat, lng);
  return matchKakaoAdministrative(parts.depth1, parts.depth2, parts.depth3);
}
