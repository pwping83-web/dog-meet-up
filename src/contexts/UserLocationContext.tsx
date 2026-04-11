import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { formatRegion } from '../app/data/regions';
import { getCurrentBrowserPosition } from '../lib/browserGeolocation';
import { coord2AddressParts, loadKakaoMapScript } from '../lib/kakaoMaps';
import { matchKakaoAdministrative } from '../lib/matchKakaoToRegion';

const STORAGE_KEY = 'daeng_user_location_v1';
const STORAGE_LOCATION_BASED = 'daeng_location_based_v1';

export type UserLocationSnapshot = {
  city: string;
  district: string;
  lat: number | null;
  lng: number | null;
  source: 'default' | 'gps' | 'map' | 'manual';
};

type UserLocationContextValue = {
  location: UserLocationSnapshot;
  /** 헤더·요약용. 위치 기반 OFF면 「전국」 */
  shortLabel: string;
  /** 헤더·요약용. 위치 기반 OFF면 안내 문구 */
  fullLabel: string;
  /** GPS·지도·동네 저장 사용 여부 */
  locationBasedEnabled: boolean;
  setLocationBasedEnabled: (enabled: boolean) => void;
  /** 실제 저장된 시·구 (스위치와 무관) */
  regionShortLabel: string;
  regionFullLabel: string;
  setManualRegion: (city: string, district: string) => void;
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

function readLocationBasedEnabled(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_LOCATION_BASED);
    if (v === '0') return false;
    return true;
  } catch {
    return true;
  }
}

function writeLocationBasedEnabled(on: boolean) {
  try {
    localStorage.setItem(STORAGE_LOCATION_BASED, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}

const UserLocationContext = createContext<UserLocationContextValue | undefined>(undefined);

export function UserLocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<UserLocationSnapshot>(() => readStorage() ?? DEFAULT);
  const [locationBasedEnabled, setLocationBasedEnabledState] = useState(readLocationBasedEnabled);

  const setLocationBasedEnabled = useCallback((enabled: boolean) => {
    writeLocationBasedEnabled(enabled);
    setLocationBasedEnabledState(enabled);
  }, []);

  const persist = useCallback((next: UserLocationSnapshot) => {
    writeStorage(next);
    setLocation(next);
  }, []);

  const applyCoordinates = useCallback(
    async (lat: number, lng: number, source: 'gps' | 'map') => {
      if (!locationBasedEnabled) {
        throw new Error('위치 기반 서비스를 켜 주세요. 내댕댕 또는 동네 설정에서 스위치를 켜면 GPS·지도 저장을 쓸 수 있어요.');
      }
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
    [persist, locationBasedEnabled],
  );

  const setManualRegion = useCallback(
    (city: string, district: string) => {
      if (!locationBasedEnabled) {
        throw new Error('위치 기반 서비스를 먼저 켜 주세요.');
      }
      persist({
        city,
        district,
        lat: null,
        lng: null,
        source: 'manual',
      });
    },
    [persist, locationBasedEnabled],
  );

  const applyGpsLocation = useCallback(async () => {
    if (!locationBasedEnabled) {
      throw new Error('위치 기반 서비스를 켜 주세요.');
    }
    const { lat, lng } = await getCurrentBrowserPosition();
    await applyCoordinates(lat, lng, 'gps');
  }, [applyCoordinates, locationBasedEnabled]);

  const resetToDefault = useCallback(() => {
    if (!locationBasedEnabled) return;
    persist({ ...DEFAULT, source: 'default' });
  }, [persist, locationBasedEnabled]);

  const value = useMemo<UserLocationContextValue>(() => {
    const regionShortLabel = location.district || location.city || '지역';
    const regionFullLabel =
      location.city && location.district
        ? formatRegion(location.city, location.district)
        : location.city || '지역 미설정';

    const shortLabel = locationBasedEnabled ? regionShortLabel : '전국';
    const fullLabel = locationBasedEnabled
      ? regionFullLabel
      : '위치 기반 꺼짐 · 동네·GPS 기반 추천을 쓰지 않아요';

    return {
      location,
      shortLabel,
      fullLabel,
      locationBasedEnabled,
      setLocationBasedEnabled,
      regionShortLabel,
      regionFullLabel,
      setManualRegion,
      applyCoordinates,
      applyGpsLocation,
      resetToDefault,
    };
  }, [
    applyCoordinates,
    applyGpsLocation,
    location,
    locationBasedEnabled,
    setLocationBasedEnabled,
    setManualRegion,
    resetToDefault,
  ]);

  return <UserLocationContext.Provider value={value}>{children}</UserLocationContext.Provider>;
}

export function useUserLocation() {
  const ctx = useContext(UserLocationContext);
  if (!ctx) throw new Error('useUserLocation 은 UserLocationProvider 안에서만 사용하세요.');
  return ctx;
}
