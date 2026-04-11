const STORAGE_KEY = 'daeng_certified_care_extra_regions_v1';

export type ExtraCareRegion = { id: string; city: string; district: string };

export function readExtraCareRegions(): ExtraCareRegion[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is ExtraCareRegion =>
        x != null &&
        typeof x === 'object' &&
        typeof (x as ExtraCareRegion).id === 'string' &&
        typeof (x as ExtraCareRegion).city === 'string' &&
        typeof (x as ExtraCareRegion).district === 'string',
    );
  } catch {
    return [];
  }
}

export function writeExtraCareRegions(regions: ExtraCareRegion[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(regions));
    window.dispatchEvent(new CustomEvent('daeng-extra-care-regions'));
  } catch {
    /* ignore */
  }
}
