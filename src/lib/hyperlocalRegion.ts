export type HyperlocalRegion = {
  regionSi: string;
  regionGu: string;
};

const USER_LOCATION_STORAGE_KEY = 'daeng_user_location_v1';

const SI_ALIAS: Record<string, string> = {
  서울특별시: '서울',
  서울시: '서울',
  경기도: '경기',
  인천광역시: '인천',
  부산광역시: '부산',
  대구광역시: '대구',
  광주광역시: '광주',
  대전광역시: '대전',
  울산광역시: '울산',
  세종특별자치시: '세종',
};

function normalizeSi(raw: string): string {
  const t = raw.trim();
  return SI_ALIAS[t] ?? t;
}

export function inferRegionFromLocationAndDistrict(
  location?: string | null,
  district?: string | null,
): HyperlocalRegion | null {
  const gu = (district ?? '').trim();
  if (!gu) return null;

  const tokens = String(location ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const si = tokens.length > 0 ? normalizeSi(tokens[0]!) : '';
  return {
    regionSi: si,
    regionGu: gu,
  };
}

export function readPrimaryRegionFromUserStorage(): HyperlocalRegion | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { city?: unknown; district?: unknown };
    const city = typeof parsed.city === 'string' ? normalizeSi(parsed.city) : '';
    const district = typeof parsed.district === 'string' ? parsed.district.trim() : '';
    if (!city || !district) return null;
    return { regionSi: city, regionGu: district };
  } catch {
    return null;
  }
}

