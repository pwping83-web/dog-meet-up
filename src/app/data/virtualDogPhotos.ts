import type { DogSitter, Meetup } from '../types';

/**
 * 목업·폴백용 강아지 스톡 사진만 사용합니다. (드론·풍경 등 비반려 이미지 대체용)
 * 동일 시드 → 동일 URL(화면 깜빡임 최소화), 시드마다 풀에서 고르게 분배.
 */
const Q = 'w=960&h=960&fit=crop&q=85';

const VIRTUAL_DOG_PHOTOS: readonly string[] = [
  `https://images.unsplash.com/photo-1548199973-03cce0bbc87b?${Q}`,
  `https://images.unsplash.com/photo-1552053831-71594a27632d?${Q}`,
  `https://images.unsplash.com/photo-1633722715463-d30f4f325e24?${Q}`,
  `https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?${Q}`,
  `https://images.unsplash.com/photo-1505628346881-b72b27e84530?${Q}`,
  `https://images.unsplash.com/photo-1630766786510-85bc1c6f18d4?${Q}`,
  `https://images.unsplash.com/photo-1637076941297-403290f6d028?${Q}`,
  `https://images.unsplash.com/photo-1693897004115-7fbd4f1ae96e?${Q}`,
  `https://images.unsplash.com/photo-1587300003388-59208cc96262?${Q}`,
  `https://images.unsplash.com/photo-1672838565001-3e7e1e96bb52?${Q}`,
  `https://images.unsplash.com/photo-1727302700512-e053b331d61c?${Q}`,
  `https://images.unsplash.com/photo-1704227170709-5e5ddefcb4f7?${Q}`,
  `https://images.unsplash.com/photo-1766114314882-89b64589f2c5?${Q}`,
  `https://images.unsplash.com/photo-1534361960056-177fcc42de35?${Q}`,
  `https://images.unsplash.com/photo-1518717758536-85ae2901b046?${Q}`,
  `https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?${Q}`,
  `https://images.unsplash.com/photo-1560806887-1a535afab1ea?${Q}`,
  `https://images.unsplash.com/photo-1450778410646-35923d1c404c?${Q}`,
  `https://images.unsplash.com/photo-1598131084681-3f9ee6a74abf?${Q}`,
  `https://images.unsplash.com/photo-1529429617124-95b109f810d9?${Q}`,
  `https://images.unsplash.com/photo-1544568100-847a948265bb?${Q}`,
  `https://images.unsplash.com/photo-1612536849822-94e30258c0a0?${Q}`,
  `https://images.unsplash.com/photo-1601758223008-9297a6bc52bc?${Q}`,
  `https://images.unsplash.com/photo-1636890906264-135013858f6b?${Q}`,
];

/** 목업에서 잘못 쓰이기 쉬운 비(또는 논쟁) 반려 이미지 ID → 가상 강아지로 교체 */
const REPLACED_UNSPLASH_IDS = /photo-1583337130417|drone|quadcopter|dji\.com/i;

/** 업로드 JPEG/PNG 앞부분(메타·XMP)에 흔한 드론·스톡 표지 힌트 */
const NON_PET_COVER_HINTS =
  /DJI|dji\.com|\bMavic\b|Phantom|Inspire|Air\s*2S?|Mini\s*[23]|FC[0-9]{4,5}|Autel|Skydio|Parrot|Ryze|Tello|\bUAV\b|quadcopter|Quadcopter|GoPro|Insta360|Unsplash|gettyimages|shutterstock|iStockphoto|Adobe Stock|Depositphotos|Dreamstime|123RF|Alamy|Pond5/i;

let dataUrlCoverHintCache: Map<string, boolean> | null = null;
const DATA_URL_CACHE_MAX = 80;

function dataUrlBinarySuggestsNonPetCover(url: string): boolean {
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(url)) return false;
  const idx = url.indexOf('base64,');
  if (idx < 0) return false;
  const raw = url.slice(idx + 7).replace(/\s/g, '');
  /** PNG tEXt/iTXt·JPEG APPn·XMP가 뒤쪽에 있을 수 있어 앞부분을 넉넉히 검사 */
  const max = Math.min(raw.length, 200_000);
  let b64 = raw.slice(0, max);
  const pad = (4 - (b64.length % 4)) % 4;
  const cacheKey = `${url.length}:${b64.slice(0, 64)}`;
  if (dataUrlCoverHintCache?.has(cacheKey)) return dataUrlCoverHintCache.get(cacheKey)!;
  if (!dataUrlCoverHintCache) dataUrlCoverHintCache = new Map();
  if (dataUrlCoverHintCache.size >= DATA_URL_CACHE_MAX) dataUrlCoverHintCache.clear();
  let bin: string;
  try {
    bin = atob(b64 + '='.repeat(pad));
  } catch {
    dataUrlCoverHintCache.set(cacheKey, false);
    return false;
  }
  const bad = NON_PET_COVER_HINTS.test(bin);
  dataUrlCoverHintCache.set(cacheKey, bad);
  return bad;
}

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function virtualDogPhotoForSeed(seed: string): string {
  const idx = hashSeed(seed) % VIRTUAL_DOG_PHOTOS.length;
  return VIRTUAL_DOG_PHOTOS[idx]!;
}

export function shouldUseVirtualDogPhoto(url: string | undefined | null): boolean {
  if (url == null) return true;
  const t = url.trim();
  if (t.length < 12) return true;
  /** 올리기(FileReader)로 들어온 base64: EXIF/XMP 등에 드론·스톡 문자열이 있으면 강아지 커버로 교체 */
  if (/^data:image\//i.test(t)) return dataUrlBinarySuggestsNonPetCover(t);
  if (!/^https?:\/\//i.test(t)) return false;
  return REPLACED_UNSPLASH_IDS.test(t);
}

/** 썸네일 없거나 비반려·논쟁 URL·Unsplash 스톱이면 글 ID 기준 가상 강아지 커버 1장 */
export function enrichMeetupWithVirtualDogCover(m: Meetup): Meetup {
  const raw = m.images ?? [];
  const first = raw.find((u) => typeof u === 'string' && u.trim().length > 8) ?? '';
  const isUnsplashStock = /^https:\/\/images\.unsplash\.com\//i.test(first);
  if (first && !shouldUseVirtualDogPhoto(first) && !isUnsplashStock) return m;
  const seed = m.category === '돌봄' ? `dolbom-${m.id}` : `meetup-${m.id}`;
  return { ...m, images: [virtualDogPhotoForSeed(seed)] };
}

/** 목록·썸네일·상세 대표 이미지 (항상 비어 있지 않은 URL) */
export function meetupCoverImageUrl(m: Meetup): string {
  const e = enrichMeetupWithVirtualDogCover(m);
  const u = e.images?.find((x) => typeof x === 'string' && x.trim().length > 0)?.trim();
  if (u) return u;
  const seed = m.category === '돌봄' ? `dolbom-${m.id}` : `meetup-${m.id}`;
  return virtualDogPhotoForSeed(seed);
}

/** 댕집사·근처 댕친 목록용 프로필 사진 (비어 있거나 스톡·비반려면 가상 강아지) */
export function resolveDogSitterPortraitUrl(s: Pick<DogSitter, 'id' | 'profileImage'>): string {
  const raw = typeof s.profileImage === 'string' ? s.profileImage.trim() : '';
  if (!raw) return virtualDogPhotoForSeed(`mock-sitter-${s.id}`);
  if (shouldUseVirtualDogPhoto(raw)) return virtualDogPhotoForSeed(`mock-sitter-${s.id}`);
  if (/^https:\/\/images\.unsplash\.com\//i.test(raw)) return virtualDogPhotoForSeed(`mock-sitter-${s.id}`);
  return raw;
}

const PLACEHOLDER_OR_STOCK_HOST =
  /picsum\.photos|placehold|placeholder|loremflickr|dummyimage/i;

/** `dog_profiles.photo_url` — 비어 있거나 플레이스홀더·일러스트 스톡·비반려면 가상 강아지 */
export function resolveDogProfilePhotoUrl(dog: { id: string; photo_url?: string | null }): string {
  const raw = typeof dog.photo_url === 'string' ? dog.photo_url.trim() : '';
  if (!raw) return virtualDogPhotoForSeed(`db-dog-${dog.id}`);
  if (shouldUseVirtualDogPhoto(raw)) return virtualDogPhotoForSeed(`db-dog-${dog.id}`);
  if (/^https:\/\/images\.unsplash\.com\//i.test(raw)) return virtualDogPhotoForSeed(`db-dog-${dog.id}`);
  if (/undraw\.co|storyset\.com|drawkit\.io|illustrations\.unsplash/i.test(raw)) {
    return virtualDogPhotoForSeed(`db-dog-${dog.id}`);
  }
  if (/grazing|sheep|\blamb\b|mee{2,}p|illustrat|freepik\.com\/photo|vecteezy/i.test(raw)) {
    return virtualDogPhotoForSeed(`db-dog-${dog.id}`);
  }
  try {
    if (PLACEHOLDER_OR_STOCK_HOST.test(new URL(raw).hostname)) {
      return virtualDogPhotoForSeed(`db-dog-${dog.id}`);
    }
  } catch {
    /* invalid URL — still try as img src; empty already handled */
  }
  return raw;
}

const VIRTUAL_DOG_PROFILE_NAMES = [
  '초코',
  '보리',
  '두부',
  '몽이',
  '뽀삐',
  '콩이',
  '나비',
  '하늘이',
  '루루',
  '봄이',
] as const;
const VIRTUAL_DOG_PROFILE_BREEDS = [
  '말티즈',
  '골든 리트리버',
  '포메라니안',
  '비글',
  '웰시코기',
  '푸들',
  '믹스',
  '시츄',
] as const;

export function virtualDogPersonaName(dogId: string): string {
  return VIRTUAL_DOG_PROFILE_NAMES[hashSeed(dogId) % VIRTUAL_DOG_PROFILE_NAMES.length]!;
}

export function virtualDogPersonaBreed(dogId: string): string {
  return VIRTUAL_DOG_PROFILE_BREEDS[hashSeed(`${dogId}-breed`) % VIRTUAL_DOG_PROFILE_BREEDS.length]!;
}

export function virtualDogPersonaAge(dogId: string): number {
  return 2 + (hashSeed(`${dogId}-age`) % 7);
}

export function virtualDogPersonaGender(dogId: string): string {
  return hashSeed(`${dogId}-gender`) % 2 === 0 ? '남아' : '여아';
}

function isGarbageDogNameForPublic(name: string | null | undefined): boolean {
  const n = (name ?? '').trim();
  if (!n) return true;
  if (/^\d{1,4}$/.test(n)) return true;
  if (n.length === 1) return true;
  return false;
}

function isGarbageDogBreedForPublic(breed: string | null | undefined): boolean {
  const b = (breed ?? '').trim();
  if (!b) return false;
  if (/^\d+$/.test(b)) return true;
  if (b.length === 1) return true;
  return false;
}

function isGarbageDogAgeForPublic(age: number | null | undefined): boolean {
  if (age == null) return false;
  if (!Number.isFinite(age)) return true;
  if (age < 0 || age > 22) return true;
  return false;
}

function isGarbageDogGenderForPublic(gender: string | null | undefined): boolean {
  const g = (gender ?? '').trim();
  if (!g) return false;
  if (/^\d+$/.test(g)) return true;
  if (g.length === 1) return true;
  return false;
}

export type DogProfilePublicDisplay = {
  name: string;
  breed: string | null;
  age: number | null;
  gender: string | null;
  photoUrl: string;
  /** DB가 비정상·플레이스홀더여서 화면용으로 고친 경우 */
  usedExamplePersona: boolean;
};

/** 공개 댕친 프로필: 숫자만 있는 이름·품종 등은 가상 예시로 바꿔 표시 */
export function sanitizeDogProfileForPublicDisplay(dog: {
  id: string;
  name: string;
  breed: string | null;
  age: number | null;
  gender: string | null;
  photo_url: string | null;
}): DogProfilePublicDisplay {
  const rawUrl = typeof dog.photo_url === 'string' ? dog.photo_url.trim() : '';
  const photoUrl = resolveDogProfilePhotoUrl(dog);
  const photoSanitized = !rawUrl || photoUrl !== rawUrl;

  const badName = isGarbageDogNameForPublic(dog.name);
  const badBreed = isGarbageDogBreedForPublic(dog.breed);
  const badAge = isGarbageDogAgeForPublic(dog.age);
  const badGender = isGarbageDogGenderForPublic(dog.gender);

  return {
    name: badName ? virtualDogPersonaName(dog.id) : dog.name.trim(),
    breed: badBreed ? virtualDogPersonaBreed(dog.id) : dog.breed?.trim() || null,
    age: badAge ? virtualDogPersonaAge(dog.id) : dog.age,
    gender: badGender ? virtualDogPersonaGender(dog.id) : dog.gender?.trim() || null,
    photoUrl,
    usedExamplePersona: badName || badBreed || badAge || badGender || photoSanitized,
  };
}
