import { useSyncExternalStore } from 'react';

/**
 * 성장 단계 — 유료 노출 **락(기본 무료)**.
 *
 * 우선순위: **`app_settings.is_promo_mode`(DB)** 가 `PromoModeProvider`에서 로드되면 그 값을 쓰고,
 * 테이블이 없거나 조회 실패 시 **`VITE_PROMO_FREE_LISTINGS`** 로 폴백합니다.
 *
 * @see supabase/migrations/20260420120000_app_settings_promo.sql
 * @see src/contexts/PromoModeProvider.tsx
 */
let dbPromoOverride: boolean | null = null;
const promoListeners = new Set<() => void>();

function emitPromo(): void {
  promoListeners.forEach((l) => l());
}

/** DB `app_settings` 조회 후 호출. `null`이면 env 폴백. */
export function setDbPromoOverride(value: boolean | null): void {
  dbPromoOverride = value;
  emitPromo();
}

function subscribePromo(listener: () => void): () => void {
  promoListeners.add(listener);
  return () => promoListeners.delete(listener);
}

/** 환경 변수만 반영(폴백용). */
export function isPromoFreeListingsEnv(): boolean {
  const v = import.meta.env.VITE_PROMO_FREE_LISTINGS;
  if (v === undefined || v === '') return true;
  if (v === 'false' || v === '0') return false;
  return v === 'true' || v === '1';
}

export function getPromoFreeSnapshot(): boolean {
  if (dbPromoOverride !== null) return dbPromoOverride;
  return isPromoFreeListingsEnv();
}

/** 비 React 코드·콜백용 스냅샷. 화면 갱신은 `usePromoFreeListings` 권장. */
export function isPromoFreeListings(): boolean {
  return getPromoFreeSnapshot();
}

export function usePromoFreeListings(): boolean {
  return useSyncExternalStore(subscribePromo, getPromoFreeSnapshot, getPromoFreeSnapshot);
}

/**
 * 인증 보호맘 탭에서 DB 결과가 비었을 때 목업 카드를 채울지.
 * 기본: 개발 서버에서만 true(로컬 UI 확인용). 운영 빌드는 false.
 * 운영에서도 데모가 필요하면 VITE_SHOW_CERTIFIED_GUARD_MOM_DEMOS=true
 */
export function showCertifiedGuardMomDemosWhenEmpty(): boolean {
  const v = import.meta.env.VITE_SHOW_CERTIFIED_GUARD_MOM_DEMOS;
  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0') return false;
  return Boolean(import.meta.env.DEV);
}
