/** 카카오맵 JavaScript SDK 로드 (services: 주소 ↔ 좌표) */

declare global {
  interface Window {
    kakao?: KakaoNamespace;
  }
}

/** 최소 타입 (전역 선언만으로 충분할 때) */
export type KakaoNamespace = {
  maps: {
    load: (cb: () => void) => void;
    Map: new (container: HTMLElement, options: { center: unknown; level: number }) => KakaoMap;
    LatLng: new (lat: number, lng: number) => unknown;
    services: {
      Geocoder: new () => {
        coord2Address: (
          lng: number,
          lat: number,
          cb: (result: KakaoCoord2AddressResult[], status: unknown) => void,
        ) => void;
      };
      Status: { OK: unknown };
    };
  };
};

export type KakaoAddrFields = {
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
};

export type KakaoCoord2AddressResult = {
  address?: KakaoAddrFields;
  road_address?: KakaoAddrFields;
};

export type KakaoMap = {
  getCenter: () => { getLat: () => number; getLng: () => number };
  setCenter: (latlng: unknown) => void;
  setLevel: (n: number) => void;
  relayout?: () => void;
};

const SCRIPT_ATTR = 'data-kakao-maps-sdk';

export function getKakaoMapAppKey(): string | undefined {
  const k = import.meta.env.VITE_KAKAO_MAP_APP_KEY;
  return typeof k === 'string' && k.trim().length > 0 ? k.trim() : undefined;
}

export function loadKakaoMapScript(): Promise<void> {
  const key = getKakaoMapAppKey();
  if (!key) {
    return Promise.reject(new Error('카카오맵 앱 키가 없습니다. VITE_KAKAO_MAP_APP_KEY 를 설정하세요.'));
  }

  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저에서만 사용할 수 있습니다.'));
  }

  const w = window as Window & { kakao?: KakaoNamespace };
  if (w.kakao?.maps?.load) {
    return new Promise((resolve) => {
      w.kakao!.maps.load(() => resolve());
    });
  }

  const existing = document.querySelector(`script[${SCRIPT_ATTR}]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      const done = () => {
        if (w.kakao?.maps?.load) w.kakao.maps.load(() => resolve());
        else reject(new Error('카카오맵 SDK 초기화에 실패했습니다.'));
      };
      existing.addEventListener('load', done, { once: true });
      existing.addEventListener('error', () => reject(new Error('카카오맵 스크립트 로드 실패')), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.setAttribute(SCRIPT_ATTR, '1');
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(
      key,
    )}&libraries=services&autoload=false`;
    script.onload = () => {
      try {
        w.kakao!.maps.load(() => resolve());
      } catch (e) {
        reject(e);
      }
    };
    script.onerror = () => reject(new Error('카카오맵 스크립트를 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });
}

export function coord2AddressParts(
  lng: number,
  lat: number,
): Promise<{ depth1: string; depth2: string; depth3: string; addressName: string }> {
  const kakao = window.kakao;
  if (!kakao?.maps?.services) {
    return Promise.reject(new Error('카카오맵 서비스가 준비되지 않았습니다.'));
  }

  const Geocoder = kakao.maps.services.Geocoder;
  const Status = kakao.maps.services.Status;
  const geocoder = new Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status !== Status.OK || !result?.length) {
        reject(new Error('주소를 찾지 못했습니다.'));
        return;
      }
      const row = result[0];
      const addr = row.address ?? row.road_address;
      if (!addr) {
        reject(new Error('주소 정보가 없습니다.'));
        return;
      }
      resolve({
        depth1: addr.region_1depth_name ?? '',
        depth2: addr.region_2depth_name ?? '',
        depth3: addr.region_3depth_name ?? '',
        addressName: addr.address_name ?? '',
      });
    });
  });
}

export function createMap(
  el: HTMLElement,
  center: { lat: number; lng: number },
  level = 5,
): KakaoMap {
  const kakao = window.kakao!;
  const pos = new kakao.maps.LatLng(center.lat, center.lng);
  return new kakao.maps.Map(el, { center: pos, level }) as KakaoMap;
}
