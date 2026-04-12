import { useEffect, useRef, useState } from 'react';
import { Crosshair, LocateFixed, MapPin, Navigation, X } from 'lucide-react';
import { RegionSelector } from './RegionSelector';
import { useUserLocation } from '../../contexts/UserLocationContext';
import {
  createMap,
  getKakaoMapAppKey,
  loadKakaoMapScript,
  type KakaoMap,
} from '../../lib/kakaoMaps';
import { getCurrentBrowserPosition } from '../../lib/browserGeolocation';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function LocationPickerModal({ open, onClose }: Props) {
  const {
    location,
    setManualRegion,
    applyCoordinates,
    applyGpsLocation,
    locationBasedEnabled,
    setLocationBasedEnabled,
  } = useUserLocation();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'gps' | 'apply' | 'saveGps' | 'findMe' | null>(null);
  const hasKey = Boolean(getKakaoMapAppKey());

  const [selCity, setSelCity] = useState(location.city);
  const [selDistrict, setSelDistrict] = useState(location.district);

  useEffect(() => {
    if (!open) return;
    setSelCity(location.city);
    setSelDistrict(location.district);
    setError(null);
  }, [open, location.city, location.district]);

  useEffect(() => {
    if (!open || !hasKey || !mapEl.current) return;

    let cancelled = false;

    (async () => {
      try {
        await loadKakaoMapScript();
        if (cancelled || !mapEl.current) return;
        mapEl.current.innerHTML = '';
        const lat = location.lat ?? 37.5665;
        const lng = location.lng ?? 126.978;
        const map = createMap(mapEl.current, { lat, lng }, 5);
        mapRef.current = map;
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current = null;
      if (mapEl.current) mapEl.current.innerHTML = '';
    };
  }, [open, hasKey, location.lat, location.lng]);

  const moveMapTo = (lat: number, lng: number) => {
    const k = window.kakao;
    const map = mapRef.current;
    if (!k?.maps || !map) return;
    map.setCenter(new k.maps.LatLng(lat, lng));
    map.setLevel(4);
  };

  const handlePanToGps = async () => {
    setBusy('gps');
    setError(null);
    try {
      const { lat, lng } = await getCurrentBrowserPosition();
      moveMapTo(lat, lng);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const handleApplyMapCenter = async () => {
    if (!locationBasedEnabled) {
      setError('위치 기반을 켜 주세요.');
      return;
    }
    setBusy('apply');
    setError(null);
    try {
      const map = mapRef.current;
      const k = window.kakao;
      if (!hasKey || !map || !k?.maps) {
        setManualRegion(selCity, selDistrict);
        onClose();
        return;
      }
      const c = map.getCenter();
      await applyCoordinates(c.getLat(), c.getLng(), 'map');
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const handleSaveGpsDirect = async () => {
    setBusy('saveGps');
    setError(null);
    try {
      await applyGpsLocation();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  /** 시·구 선택란 근처: GPS → 역지오코딩 후 저장 + 목록·지도 동기화 (모달 유지) */
  const handleFindMyLocation = async () => {
    if (!locationBasedEnabled) {
      setError('위치 기반을 먼저 켜 주세요.');
      return;
    }
    setBusy('findMe');
    setError(null);
    try {
      const snap = await applyGpsLocation();
      setSelCity(snap.city);
      setSelDistrict(snap.district);
      if (hasKey && snap.lat != null && snap.lng != null) {
        moveMapTo(snap.lat, snap.lng);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const handleManualOnly = () => {
    setError(null);
    try {
      setManualRegion(selCity, selDistrict);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[101] flex w-full max-w-md flex-col rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl max-h-[92vh] overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-600" />
            <h2 className="text-base font-extrabold text-slate-900">내 동네 설정</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-900">위치 기반</p>
              <p className="mt-0.5 text-[11px] font-medium leading-snug text-slate-600">
                켜면 우리 동네 기준, 끄면 전국. 켜고 동네를 맞추면 내 주변 글·모임이 보여요.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={locationBasedEnabled}
              onClick={(ev) => {
                ev.stopPropagation();
                setLocationBasedEnabled(!locationBasedEnabled);
              }}
              className={`relative z-10 h-8 w-14 shrink-0 cursor-pointer rounded-full transition-colors duration-300 ${
                locationBasedEnabled ? 'bg-orange-600 shadow-inner' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  locationBasedEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {!locationBasedEnabled && (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-600">
              지금은 전국 기준이에요. 켜면 동네·지도·GPS를 쓸 수 있어요.
            </p>
          )}

          {/* 카카오/키 관련 설명은 고객 화면에 노출하지 않음 — 로컬 개발 시에만 힌트 */}
          {import.meta.env.DEV && !hasKey && (
            <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-2.5 py-1.5 font-mono text-[10px] text-amber-900">
              [dev] 지도: .env에 VITE_KAKAO_MAP_APP_KEY
            </p>
          )}

          {hasKey && (
            <>
              <div className={`flex flex-wrap gap-2 ${!locationBasedEnabled ? 'pointer-events-none opacity-40' : ''}`}>
                <button
                  type="button"
                  disabled={busy !== null || !locationBasedEnabled}
                  onClick={() => void handlePanToGps()}
                  className="inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  <Navigation className="h-4 w-4" />
                  {busy === 'gps' ? '위치 가져오는 중…' : '지도를 현재 위치로'}
                </button>
                <button
                  type="button"
                  disabled={busy !== null || !locationBasedEnabled}
                  onClick={() => void handleSaveGpsDirect()}
                  className="inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm font-bold text-orange-800 disabled:opacity-50"
                >
                  <Crosshair className="h-4 w-4" />
                  {busy === 'saveGps' ? '저장 중…' : 'GPS로 바로 저장'}
                </button>
              </div>

              <p className="text-xs text-slate-500">
                지도를 움직인 뒤 <strong>지도 중심을 내 동네로 저장</strong>을 누르면, 그 지점 기준으로 카카오
                주소를 읽어 시·구를 맞춥니다.
              </p>

              <div
                ref={mapEl}
                className={`h-[220px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${!locationBasedEnabled ? 'opacity-40 pointer-events-none' : ''}`}
              />

              <button
                type="button"
                disabled={busy !== null || !locationBasedEnabled}
                onClick={() => void handleApplyMapCenter()}
                className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 py-3.5 text-sm font-extrabold text-white shadow-md disabled:opacity-50"
              >
                {busy === 'apply' ? '저장 중…' : '지도 중심을 내 동네로 저장'}
              </button>
            </>
          )}

          <div
            className={`border-t border-slate-100 pt-4 ${!locationBasedEnabled ? 'rounded-2xl bg-slate-50/40 px-1' : ''}`}
          >
            <p className="mb-2 text-xs font-bold text-slate-500">또는 시·구 선택</p>
            <button
              type="button"
              disabled={busy !== null || !locationBasedEnabled}
              onClick={() => void handleFindMyLocation()}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 py-3.5 text-sm font-extrabold text-white shadow-md transition-transform active:scale-[0.99] disabled:opacity-50"
            >
              <LocateFixed className="h-5 w-5 shrink-0" aria-hidden />
              {busy === 'findMe' ? '현재 위치 확인 중…' : '현재 위치로 시·구 맞추기'}
            </button>
            <RegionSelector
              layout="modal"
              selectedCity={selCity}
              selectedDistrict={selDistrict}
              onCityChange={setSelCity}
              onDistrictChange={setSelDistrict}
              placeholder="시·도와 구·군을 선택하세요"
            />
            <button
              type="button"
              disabled={!locationBasedEnabled}
              onClick={handleManualOnly}
              className="mt-3 w-full rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              선택한 시·구만 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
