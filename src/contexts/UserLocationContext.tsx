import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { formatRegion } from '../app/data/regions';
import { getCurrentBrowserPosition } from '../lib/browserGeolocation';
import { coord2AddressParts, loadKakaoMapScript } from '../lib/kakaoMaps';
import { matchKakaoAdministrative } from '../lib/matchKakaoToRegion';

const STORAGE_KEY = 'daeng_user_location_v1';

export type UserLocationSnapshot = {
  city: string;
  district: string;
  lat: number | null;
  lng: number | null;
  source: 'default' | 'gps' | 'map' | 'manual';
};

type UserLocationContextValue = {
  location: UserLocationSnapshot;
  shortLabel: string;
  fullLabel: string;
  setManualRegion: (city: string, district: string) => void;
  /** 위·경도로 저장 (카카오 역지오코딩) */
  applyCoordinates: (lat: number, lng: number, source: 'gps' | 'map') => Promise<void>;
  applyGpsLocation: () => Promise<void>;
  resetToDefault: () => void;
};

const DEFAULT: UserLocationSnapshot = {
  city: '서울',
  district: '강남구',
  lat: 37.4979,
  lng: 127.0276,
  source: 'default',
};

function readStorage(): UserLocationSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<UserLocationSnapshot>;
    if (!v || typeof v.city !== 'string' || typeof v.district !== 'string') return null;
    return {
      city: v.city,
      district: v.district,
      lat: typeof v.lat === 'number' ? v.lat : null,
      lng: typeof v.lng === 'number' ? v.lng : null,
      source: v.source ?? 'manual',
    };
  } catch {
    return null;
  }
}

function writeStorage(s: UserLocationSnapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

const UserLocationContext = createContext<UserLocationContextValue | undefined>(undefined);

export function UserLocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<UserLocationSnapshot>(() => readStorage() ?? DEFAULT);

  const persist = useCallback((next: UserLocationSnapshot) => {
    writeStorage(next);
    setLocation(next);
  }, []);

  const applyCoordinates = useCallback(
    async (lat: number, lng: number, source: 'gps' | 'map') => {
      try {
        await loadKakaoMapScript();
        const parts = await coord2AddressParts(lng, lat);
        const m = matchKakaoAdministrative(parts.depth1, parts.depth2, parts.depth3);
        persist({
          city: m.city,
          district: m.district || parts.depth2 || '선택',
          lat,
          lng,
          source,
        });
      } catch {
        setLocation((prev) => {
          const next: UserLocationSnapshot = {
            ...prev,
            lat,
            lng,
            source,
          };
          writeStorage(next);
          return next;
        });
        throw new Error('주소 변환에 실패했습니다. 카카오 앱 키·네트워크를 확인하거나 목록에서 지역을 선택하세요.');
      }
    },
    [persist],
  );

  const setManualRegion = useCallback(
    (city: string, district: string) => {
      persist({
        city,
        district,
        lat: null,
        lng: null,
        source: 'manual',
      });
    },
    [persist],
  );

  const applyGpsLocation = useCallback(async () => {
    const { lat, lng } = await getCurrentBrowserPosition();
    await applyCoordinates(lat, lng, 'gps');
  }, [applyCoordinates]);

  const resetToDefault = useCallback(() => {
    persist({ ...DEFAULT, source: 'default' });
  }, [persist]);

  const value = useMemo<UserLocationContextValue>(() => {
    const shortLabel = location.district || location.city || '지역';
    const fullLabel =
      location.city && location.district
        ? formatRegion(location.city, location.district)
        : location.city || '지역 미설정';
    return {
      location,
      shortLabel,
      fullLabel,
      setManualRegion,
      applyCoordinates,
      applyGpsLocation,
      resetToDefault,
    };
  }, [applyCoordinates, applyGpsLocation, location, setManualRegion, resetToDefault]);

  return <UserLocationContext.Provider value={value}>{children}</UserLocationContext.Provider>;
}

export function useUserLocation() {
  const ctx = useContext(UserLocationContext);
  if (!ctx) throw new Error('useUserLocation 은 UserLocationProvider 안에서만 사용하세요.');
  return ctx;
}
