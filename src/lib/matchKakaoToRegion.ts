import { regions } from '../app/data/regions';

/** 카카오 region_1depth_name → 앱 regions.ts 의 city 키 */
const DEPTH1_TO_CITY: Record<string, string> = {
  서울특별시: '서울',
  부산광역시: '부산',
  대구광역시: '대구',
  인천광역시: '인천',
  광주광역시: '광주',
  대전광역시: '대전',
  울산광역시: '울산',
  세종특별자치시: '세종',
  경기도: '경기',
  강원특별자치도: '강원',
  강원도: '강원',
  충청북도: '충북',
  충청남도: '충남',
  전북특별자치도: '전북',
  전라북도: '전북',
  전라남도: '전남',
  경상북도: '경북',
  경상남도: '경남',
  제주특별자치도: '제주',
};

function normalizeCity(depth1: string): string | null {
  const t = depth1.trim();
  if (!t) return null;
  if (DEPTH1_TO_CITY[t]) return DEPTH1_TO_CITY[t];
  const compact = t.replace(/특별시|광역시|특별자치시|특별자치도|도$/g, '').trim();
  const direct = regions.find((r) => r.city === t || r.city === compact);
  if (direct) return direct.city;
  return null;
}

function pickDistrict(city: string, depth2: string, depth3: string): string | null {
  const region = regions.find((r) => r.city === city);
  if (!region) return null;
  const blob = `${depth2} ${depth3}`.trim();

  let best: string | null = null;
  for (const d of region.districts) {
    if (!d) continue;
    if (blob.includes(d)) {
      if (!best || d.length > best.length) best = d;
    }
  }
  if (best) return best;

  if (region.districts.includes(depth2)) return depth2;

  const token = depth2.split(' ')[0];
  if (token && region.districts.includes(token)) return token;

  return null;
}

/**
 * BigDataCloud 등에서 오는 행정구역 이름 배열(국→도시→구 순 등)로 시·구 추정.
 * `city`/`locality` 단일 필드만 쓸 때 강남 등으로 잘못 고정되는 경우를 줄입니다.
 */
export function matchAdministrativeNames(adminNames: string[]): {
  city: string;
  district: string;
  matched: boolean;
} {
  const list = adminNames.map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < list.length; i++) {
    const city = normalizeCity(list[i]);
    if (!city) continue;
    for (let j = 0; j < list.length; j++) {
      if (i === j) continue;
      const d = pickDistrict(city, list[j], '');
      if (d) return { city, district: d, matched: true };
    }
  }
  return { city: '', district: '', matched: false };
}

/**
 * 카카오 coord2Address 결과를 앱의 (city, district)로 맞춤.
 * 매칭 실패 시에도 표시용으로 추정 city + depth2 를 돌려줄 수 있음.
 */
function deriveDong(district: string, depth3: string): string {
  const d3 = (depth3 || '').trim();
  if (!d3 || !district) return '';
  if (d3 === district) return '';
  if (district.endsWith(d3)) return '';
  return d3;
}

export function matchKakaoAdministrative(depth1: string, depth2: string, depth3: string) {
  const city = normalizeCity(depth1);
  if (!city) {
    return {
      city: depth1.replace(/특별시|광역시|특별자치시|도$/g, '').trim() || '기타',
      district: [depth2, depth3].filter(Boolean).join(' ').trim() || '',
      dong: '',
      matched: false as const,
    };
  }

  const district = pickDistrict(city, depth2, depth3);
  if (district) {
    return { city, district, dong: deriveDong(district, depth3), matched: true as const };
  }

  const d2 = (depth2 || '').trim();
  const d3 = (depth3 || '').trim();
  const fallback = [d2, d3].filter(Boolean).join(' ').trim();
  const distOnly = fallback || d2 || '';
  // depth2=구·시, depth3=동 인데 regions 매칭 실패 시에도 동까지 표시
  if (d2 && d3 && d3 !== d2) {
    return { city, district: d2, dong: deriveDong(d2, d3), matched: false as const };
  }
  return { city, district: distOnly, dong: '', matched: false as const };
}
