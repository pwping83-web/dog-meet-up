/**
 * 목업·가상 프로필용 견종별 대표 이미지 + 모임 썸네일.
 * 로컬 번들(`localStockPhotos`)은 견종/테마별로만 배정해 같은 파일이 다른 의미로 겹치지 않게 함.
 */
import { LOCAL_BREED_REPRESENTATIVE, LOCAL_MEETUP_SCENE } from './localStockPhotos';

const BREED_UNSPLASH_Q = 'q=80&w=400&h=400&auto=format&fit=crop';

/** 로드 실패·체인 폴백용 — 전부 기존 Unsplash ID (DB·캐시 호환) */
export const BREED_STOCK_FALLBACK_UNSPLASH = {
  pomeranian: `https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?${BREED_UNSPLASH_Q}`,
  welshCorgi: `https://images.unsplash.com/photo-1615332579037-3c44b3660b53?${BREED_UNSPLASH_Q}`,
  goldenRetriever: `https://images.unsplash.com/photo-1633722715463-d30f4f325e24?${BREED_UNSPLASH_Q}`,
  beagle: `https://images.unsplash.com/photo-1537151608804-ea6d1522e51e?${BREED_UNSPLASH_Q}`,
  maltese: `https://images.unsplash.com/photo-1516382760297-f57951a70014?${BREED_UNSPLASH_Q}`,
  poodle: `https://images.unsplash.com/photo-1583337130417-3346a1be7dee?${BREED_UNSPLASH_Q}`,
} as const;

/**
 * 앱에서 쓰는 견종 키별 **주** 이미지 (로컬 우선, 코기·말티즈·푸들은 Unsplash만).
 * 이름은 역사적 이유로 `UNSPLASH` 유지.
 */
export const BREED_STOCK_PHOTO_UNSPLASH = {
  pomeranian: LOCAL_BREED_REPRESENTATIVE.pomeranian,
  welshCorgi: BREED_STOCK_FALLBACK_UNSPLASH.welshCorgi,
  goldenRetriever: LOCAL_BREED_REPRESENTATIVE.goldenRetriever,
  beagle: LOCAL_BREED_REPRESENTATIVE.beagle,
  maltese: BREED_STOCK_FALLBACK_UNSPLASH.maltese,
  poodle: BREED_STOCK_FALLBACK_UNSPLASH.poodle,
} as const;

/** `virtualDogPhotoForSeed` 등 순환용 (순서 고정) */
export const BREED_STOCK_UNSPLASH_LIST: readonly string[] = [
  BREED_STOCK_PHOTO_UNSPLASH.pomeranian,
  BREED_STOCK_PHOTO_UNSPLASH.welshCorgi,
  BREED_STOCK_PHOTO_UNSPLASH.goldenRetriever,
  BREED_STOCK_PHOTO_UNSPLASH.beagle,
  BREED_STOCK_PHOTO_UNSPLASH.maltese,
  BREED_STOCK_PHOTO_UNSPLASH.poodle,
];

const BREED_STOCK_ID_SNIPPETS = [
  'photo-1596492784531-6e6eb5ea9993',
  'photo-1615332579037-3c44b3660b53',
  'photo-1633722715463-d30f4f325e24',
  'photo-1537151608804-ea6d1522e51e',
  'photo-1516382760297-f57951a70014',
  'photo-1583337130417-3346a1be7dee',
] as const;

const BREED_STOCK_LOCAL_PRIMARY_PATHS: readonly string[] = [
  LOCAL_BREED_REPRESENTATIVE.pomeranian,
  LOCAL_BREED_REPRESENTATIVE.goldenRetriever,
  LOCAL_BREED_REPRESENTATIVE.beagle,
];

/**
 * 모이자·만나자·돌봄 목록 썸네일 — `LOCAL_MEETUP_SCENE`만 사용 (견종 대표 경로와 파일 중복 없음).
 * `enrichMeetupWithVirtualDogCover`에서 Unsplash 예전 ID면 목업 유지.
 */
export const MEETUP_LIST_COVER_PHOTOS = {
  walkOutdoor: LOCAL_MEETUP_SCENE.walkPairLake,
  indoorCare: `https://images.unsplash.com/photo-1517849845537-4d257902454a?${BREED_UNSPLASH_Q}`,
  socialization: LOCAL_MEETUP_SCENE.socialPuppies,
  dachshund: LOCAL_MEETUP_SCENE.dachshundBeach,
  smallCute: LOCAL_MEETUP_SCENE.smallCuteCavalier,
  largeDog: LOCAL_MEETUP_SCENE.groupWalkPark,
} as const;

const MEETUP_LIST_COVER_ID_SNIPPETS = [
  'photo-1548199973-03cce0bbc87b',
  'photo-1517849845537-4d257902454a',
  'photo-1535930891776-0c2dfb7fda1a',
  'photo-1612236359045-8ed96bd95d0d',
  'photo-1583511655857-d19b40a7a54e',
  'photo-1534361960057-19889db9621e',
] as const;

export function isMeetupListCoverPhotoUrl(url: string | undefined | null): boolean {
  if (url == null) return false;
  const t = url.trim();
  if (!t) return false;
  return MEETUP_LIST_COVER_ID_SNIPPETS.some((id) => t.includes(id));
}

/** 견종 스톡 등 — 프로필·댕집사 치환에서 유지 */
export function isBreedStockPhotoUrl(url: string | undefined | null): boolean {
  if (url == null) return false;
  const t = url.trim();
  if (!t) return false;
  if (BREED_STOCK_ID_SNIPPETS.some((id) => t.includes(id))) return true;
  return BREED_STOCK_LOCAL_PRIMARY_PATHS.some((path) => t === path);
}

/** 모임 썸네일: 견종 6종 + 모임용 6컷 — `enrichMeetupWithVirtualDogCover`에서 유지 */
export function isPreservedMeetupCoverUrl(url: string | undefined | null): boolean {
  return isBreedStockPhotoUrl(url) || isMeetupListCoverPhotoUrl(url);
}
