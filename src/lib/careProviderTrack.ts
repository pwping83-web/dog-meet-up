const STORAGE_KEY = 'daeng-care-provider-track';

/** 프로필·돌봄 목표(서버 없이 기기에만 저장) */
export type CareProviderTrack = 'unset' | 'sitter_only' | 'guard_mom';

export function readCareProviderTrack(): CareProviderTrack {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'sitter_only' || v === 'guard_mom') return v;
  } catch {
    /* ignore */
  }
  return 'unset';
}

export function writeCareProviderTrack(v: CareProviderTrack): void {
  try {
    if (v === 'unset') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, v);
  } catch {
    /* ignore */
  }
}
