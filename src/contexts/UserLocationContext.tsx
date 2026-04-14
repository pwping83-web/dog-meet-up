import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { formatDistrictWithDong, formatRegion } from '../app/data/regions';
import { getCurrentBrowserPosition } from '../lib/browserGeolocation';
import { coord2AddressParts, loadKakaoMapScript } from '../lib/kakaoMaps';
import { matchKakaoAdministrative } from '../lib/matchKakaoToRegion';
import { reverseGeocodeToRegion } from '../lib/reverseGeocodeClient';
import { getKakaoMapAppKey } from '../lib/kakaoMaps';
import { supabase } from '../lib/supabase';
import { displayNameFromUser } from '../lib/ensurePublicProfile';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'daeng_user_location_v1';
const STORAGE_LOCATION_BASED = 'daeng_location_based_v1';

export type UserLocationSnapshot = {
  city: string;
  district: string;
  /** 카카오 region_3depth 등(잠실동 등). 수동 시·구만 고르면 빈 문자열 */
  dong: string;
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
  applyCoordinates: (lat: number, lng: number, source: 'gps' | 'map') => Promise<UserLocationSnapshot>;
  applyGpsLocation: () => Promise<UserLocationSnapshot>;
  resetToDefault: () => void;
};

const DEFAULT: UserLocationSnapshot = {
  city: '서울',
  district: '강남구',
  dong: '역삼동',
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
      dong: typeof v.dong === 'string' ? v.dong : '',
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

/** 로컬에 저장된 적 없거나, 앱 기본 동네(강남)만 있는 상태 */
function isUnsetOrAppDefaultLocation(s: UserLocationSnapshot | null): boolean {
  if (!s) return true;
  return s.city === DEFAULT.city && s.district === DEFAULT.district && s.source === 'default';
}

async function upsertProfileRegionsForSnapshot(userId: string, snapshot: UserLocationSnapshot, authUser: User | null) {
  const si = snapshot.city?.trim();
  const gu = snapshot.district?.trim();
  if (!si || !gu) return;
  try {
    const { data: p } = await supabase.from('profiles').select('name, phone, avatar_url').eq('id', userId).maybeSingle();
    const name = (p?.name?.trim() || (authUser ? displayNameFromUser(authUser) : '') || '회원').slice(0, 10);
    const { error } = await supabase.from('profiles').upsert(
      {
        id: userId,
        name: name || '회원',
        phone: p?.phone ?? null,
        avatar_url: p?.avatar_url ?? null,
        region_si: si,
        region_gu: gu,
      },
      { onConflict: 'id' },
    );
    if (error) {
      console.warn('[UserLocation] profiles 동네 저장:', error.message);
    }
  } catch (e) {
    console.warn('[UserLocation] profiles 동네 저장:', (e as Error).message);
  }
}

const UserLocationContext = createContext<UserLocationContextValue | undefined>(undefined);

export function UserLocationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const [location, setLocation] = useState<UserLocationSnapshot>(() => readStorage() ?? DEFAULT);
  const [locationBasedEnabled, setLocationBasedEnabledState] = useState(readLocationBasedEnabled);

  const setLocationBasedEnabled = useCallback((enabled: boolean) => {
    writeLocationBasedEnabled(enabled);
    setLocationBasedEnabledState(enabled);
  }, []);

  const persist = useCallback((next: UserLocationSnapshot) => {
    writeStorage(next);
    setLocation(next);
    const uid = userRef.current?.id;
    const authUser = userRef.current;
    if (uid) {
      void upsertProfileRegionsForSnapshot(uid, next, authUser);
    }
  }, []);

  /** 로그아웃 후 재로그인: 기기 로컬 동네를 서버에 맞추고, 로컬이 비었으면 profiles 동네로 복원 */
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    void (async () => {
      const uid = user.id;
      const stored = readStorage();
      const defaultLike = isUnsetOrAppDefaultLocation(stored);

      const { data: profile } = await supabase
        .from('profiles')
        .select('region_si, region_gu')
        .eq('id', uid)
        .maybeSingle();
      if (cancelled) return;

      const prsi = profile?.region_si?.trim();
      const prgu = profile?.region_gu?.trim();

      if (stored && stored.city?.trim() && stored.district?.trim() && !defaultLike) {
        await upsertProfileRegionsForSnapshot(uid, stored, user);
        return;
      }

      if (prsi && prgu && defaultLike) {
        const next: UserLocationSnapshot = {
          city: prsi,
          district: prgu,
          dong: '',
          lat: null,
          lng: null,
          source: 'manual',
        };
        writeStorage(next);
        setLocation(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const applyCoordinates = useCallback(
    async (lat: number, lng: number, source: 'gps' | 'map'): Promise<UserLocationSnapshot> => {
      if (!locationBasedEnabled) {
        throw new Error('위치 기반을 켜 주세요. 내댕댕에서 스위치를 켜면 내 주변 글·동네 설정을 쓸 수 있어요.');
      }

      const persistFromMatch = (m: ReturnType<typeof matchKakaoAdministrative>, districtFallback: string) => {
        const next: UserLocationSnapshot = {
          city: m.city,
          district: m.district || districtFallback || '선택',
          dong: (m.dong ?? '').trim(),
          lat,
          lng,
          source,
        };
        persist(next);
        return next;
      };

      try {
        if (getKakaoMapAppKey()) {
          try {
            await loadKakaoMapScript();
            const parts = await coord2AddressParts(lng, lat);
            const m = matchKakaoAdministrative(parts.depth1, parts.depth2, parts.depth3);
            return persistFromMatch(m, parts.depth2);
          } catch {
            /* 키 오류·네트워크 등 → 무료 역지오코딩 폴백 */
          }
        }

        const m = await reverseGeocodeToRegion(lat, lng);
        return persistFromMatch(m, '');
      } catch (e) {
        // 이전 동네(기본값 강남 등)를 유지한 채 좌표만 바꾸면 라벨이 강남으로 "고정"된 것처럼 보임 → 저장하지 않고 안내만
        throw new Error(
          (e as Error)?.message ||
            '주소 변환에 실패했습니다. 네트워크를 확인하거나 목록에서 시·구를 직접 선택해 주세요.',
        );
      }
    },
    [persist, locationBasedEnabled],
  );

  const setManualRegion = useCallback(
    (city: string, district: string) => {
      if (!locationBasedEnabled) {
        throw new Error('위치 기반을 먼저 켜 주세요.');
      }
      persist({
        city,
        district,
        dong: '',
        lat: null,
        lng: null,
        source: 'manual',
      });
    },
    [persist, locationBasedEnabled],
  );

  const applyGpsLocation = useCallback(async (): Promise<UserLocationSnapshot> => {
    if (!locationBasedEnabled) {
      throw new Error('위치 기반을 켜 주세요.');
    }
    const { lat, lng } = await getCurrentBrowserPosition();
    return applyCoordinates(lat, lng, 'gps');
  }, [applyCoordinates, locationBasedEnabled]);

  const resetToDefault = useCallback(() => {
    if (!locationBasedEnabled) return;
    persist({ ...DEFAULT, source: 'default' });
  }, [persist, locationBasedEnabled]);

  const value = useMemo<UserLocationContextValue>(() => {
    const dongTrim = (location.dong ?? '').trim();
    const regionShortLabel =
      location.district || dongTrim
        ? formatDistrictWithDong(location.district, dongTrim || undefined) || location.city || '지역'
        : location.city || '지역';
    const regionFullLabel =
      location.city && location.district
        ? formatRegion(location.city, location.district, dongTrim || undefined)
        : location.city || '지역 미설정';

    const shortLabel = locationBasedEnabled ? regionShortLabel : '전국';
    const fullLabel = locationBasedEnabled
      ? regionFullLabel
      : '전국 · 위치 기반 끔';

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
