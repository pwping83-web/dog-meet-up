/**
 * 목업·가상 프로필용 견종별 고정 Unsplash URL (고화질 400²).
 * `virtualDogPhotos` 풀·히어로·목업 데이터에서 공통 사용.
 */
export const BREED_STOCK_PHOTO_UNSPLASH = {
  pomeranian:
    'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?q=80&w=400&h=400&auto=format&fit=crop',
  welshCorgi:
    'https://images.unsplash.com/photo-1615332579037-3c44b3660b53?q=80&w=400&h=400&auto=format&fit=crop',
  goldenRetriever:
    'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?q=80&w=400&h=400&auto=format&fit=crop',
  beagle:
    'https://images.unsplash.com/photo-1537151608804-ea6d1522e51e?q=80&w=400&h=400&auto=format&fit=crop',
  maltese:
    'https://images.unsplash.com/photo-1516382760297-f57951a70014?q=80&w=400&h=400&auto=format&fit=crop',
  poodle:
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400&h=400&auto=format&fit=crop',
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

/**
 * 모이자·만나자·돌봄 목록 썸네일용 (견종 6종과 별도).
 * `enrichMeetupWithVirtualDogCover`에서 Unsplash라도 이 ID면 목업 이미지 유지.
 */
export const MEETUP_LIST_COVER_PHOTOS = {
  walkOutdoor:
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=400&h=400&auto=format&fit=crop',
  indoorCare:
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=400&h=400&auto=format&fit=crop',
  socialization:
    'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?q=80&w=400&h=400&auto=format&fit=crop',
  dachshund:
    'https://images.unsplash.com/photo-1612236359045-8ed96bd95d0d?q=80&w=400&h=400&auto=format&fit=crop',
  smallCute:
    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=400&h=400&auto=format&fit=crop',
  largeDog:
    'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=400&h=400&auto=format&fit=crop',
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

/** 견종 스톡 등 — 프로필·댕집사 치환에서 Unsplash 유지 */
export function isBreedStockPhotoUrl(url: string | undefined | null): boolean {
  if (url == null) return false;
  const t = url.trim();
  if (!t) return false;
  return BREED_STOCK_ID_SNIPPETS.some((id) => t.includes(id));
}

/** 모임 썸네일: 견종 6종 + 모임용 6컷 — `enrichMeetupWithVirtualDogCover`에서 유지 */
export function isPreservedMeetupCoverUrl(url: string | undefined | null): boolean {
  return isBreedStockPhotoUrl(url) || isMeetupListCoverPhotoUrl(url);
}
