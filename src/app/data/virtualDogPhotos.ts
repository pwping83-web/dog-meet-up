import type { DogSitter, Meetup } from '../types';

/**
 * 목업·폴백용 강아지 스톡 사진만 사용합니다. (드론·풍경 등 비반려 이미지 대체용)
 * 동일 시드 → 동일 URL(화면 깜빡임 최소화), 시드마다 풀에서 고르게 분배.
 */
const Q = 'w=960&h=960&fit=crop&q=85';

const VIRTUAL_DOG_PHOTOS: readonly string[] = [
  `https://images.unsplash.com/photo-1543466835-00a7907e9de1?${Q}`,
  `https://images.unsplash.com/photo-1517423440428-a5a00ad493e2?${Q}`,
  `https://images.unsplash.com/photo-1583511665977-2b1c39aace49?${Q}`,
  `https://images.unsplash.com/photo-1596492784531-5997e95e006d?${Q}`,
  `https://images.unsplash.com/photo-1605568427561-40c23fa6adc4?${Q}`,
  `https://images.unsplash.com/photo-1593134257789-471d46b0ce2d?${Q}`,
  `https://images.unsplash.com/photo-1576201836106-db1758fd1c97?${Q}`,
  `https://images.unsplash.com/photo-1568393698422-23a7767527a5?${Q}`,
  `https://images.unsplash.com/photo-1525253086316-d0c936c814f0?${Q}`,
  `https://images.unsplash.com/photo-1507146426986-505756756a54?${Q}`,
  `https://images.unsplash.com/photo-1558788353-f76d92427f16?${Q}`,
  `https://images.unsplash.com/photo-1530281700549-e82cae7f15a5?${Q}`,
  `https://images.unsplash.com/photo-1568572933382-376960a653c3?${Q}`,
  `https://images.unsplash.com/photo-1591169194246-8a933f3d60f4?${Q}`,
  `https://images.unsplash.com/photo-1522276498395-a041d935f22d?${Q}`,
  `https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?${Q}`,
  `https://images.unsplash.com/photo-1604081470199-47f0a6158019?${Q}`,
  `https://images.unsplash.com/photo-1596825145855-89840b290d32?${Q}`,
  `https://images.unsplash.com/photo-1534567115038-b2ed281cd54c?${Q}`,
  `https://images.unsplash.com/photo-1558944351-88b8ce1d8509?${Q}`,
  `https://images.unsplash.com/photo-1560963695-d6a13cf7b96a?${Q}`,
  `https://images.unsplash.com/photo-1529476490802-43c0223ccf7a?${Q}`,
  `https://images.unsplash.com/photo-1577349908390-f407c1f7bcf0?${Q}`,
  `https://images.unsplash.com/photo-1598133894008-8f4523a1d086?${Q}`,
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

/** 동일 시드 → 동일 인덱스(가상 프로필·폴백 문구 등) */
export function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export type GuardMomIntroDisplayInput = {
  id: string;
  intro: string | null | undefined;
  region_si: string | null | undefined;
  region_gu: string | null | undefined;
};

function isGarbageGuardMomIntro(raw: string): boolean {
  const t = raw.trim();
  if (!t) return true;
  const hangulSyllables = (t.match(/[가-힣]/g) ?? []).length;
  if (hangulSyllables >= 4) return false;
  if (t.length >= 36) return false;
  if (/^\d{1,4}$/.test(t)) return true;
  if (/^[\d\s.,~!?]+$/.test(t)) return true;
  if (t.length <= 8 && hangulSyllables === 0) return true;
  if (t.length <= 12 && hangulSyllables <= 1 && /[ㅋㅎㅈㅂㅇㅜㅠ]/.test(t)) return true;
  return false;
}

const GUARD_MOM_FALLBACK_INTROS: readonly ((loc: string) => string)[] = [
  (loc) =>
    `${loc} 인근 집에서 맡기기·단기 돌봄 도와드려요. 산책·식사 루틴 맞춰 드리고, 맡기 전 성향·건강 상태 알려 주시면 더 안심하고 맡기실 수 있어요. 🐾`,
  (loc) =>
    `${loc} 쪽 소형·중형견 위주로 케어해요. 하루 산책 횟수·사료·간식은 사전에 맞춰 주시면 그대로 지켜 드릴게요.`,
  (loc) =>
    `${loc}에서 맞벌이 가정 맡기기 경험이 많아요. 사진 한 장·간단 메모로 안심하고 연락 주세요.`,
  (loc) =>
    `${loc} 인근 예민한 아이도 천천히 적응시키며 돌봐요. 첫 만남(산책 동행) 원하시면 일정만 조율해 주세요.`,
];

/** DB `intro`가 테스트용으로 비어 있거나 너무 짧을 때만 예시 문구로 표시(원문은 DB에 그대로) */
export function displayCertifiedGuardMomIntro(mom: GuardMomIntroDisplayInput): string {
  const raw = typeof mom.intro === 'string' ? mom.intro : '';
  if (!isGarbageGuardMomIntro(raw)) return raw.trim();
  const loc = [mom.region_si, mom.region_gu].filter((x) => typeof x === 'string' && x.trim()).join(' ').trim();
  const place = loc.length > 0 ? loc : '근처';
  const idx = hashSeed(mom.id) % GUARD_MOM_FALLBACK_INTROS.length;
  return GUARD_MOM_FALLBACK_INTROS[idx](place);
}

function isGarbageDolbomMeetupTitle(raw: string): boolean {
  const t = raw.trim();
  if (!t) return true;
  if (/^\d+$/.test(t)) return true;
  const hangul = (t.match(/[가-힣]/g) ?? []).length;
  if (hangul >= 2 && t.length >= 5) return false;
  if (t.length <= 14 && hangul === 0 && /^[a-zA-Z0-9\s._\-!?🐾]+$/u.test(t)) return true;
  return false;
}

function isGarbageDolbomMeetupDescription(raw: string): boolean {
  const t = raw.trim();
  if (!t) return true;
  if (t.length > 80) return false;
  return isGarbageGuardMomIntro(t);
}

const DOLBOM_CARD_TITLE_FALLBACKS: readonly ((d: string) => string)[] = [
  (d) => `${d} · 돌봄·맡기기 도와드려요`,
  (d) => `${d} 근처 방문 돌봄 상담 받아요`,
  (d) => `${d}에서 산책·밥·놀이 맡기기 가능해요`,
  (d) => `${d} 기준 맡기기 일정 조율 중이에요`,
];

const DOLBOM_CARD_DESC_FALLBACKS: readonly ((d: string) => string)[] = [
  (d) =>
    `안녕하세요! ${d}에서 아이 맡기기·방문 돌봄 상담 받고 있어요. 체중·예방접종 여부 알려 주시면 일정 맞춰 볼게요. 🐾`,
  (d) =>
    `${d} 인근 집 돌봄·당일 방문도 가능한지 채팅으로 편하게 물어봐 주세요. 사료·산책 횟수 맞춰 드려요.`,
  (d) =>
    `맞벌이·외출 때 하루 이틀 맡기기 많이 해요. ${d} 쪽이시면 거리·시간 먼저 알려 주세요.`,
  (d) =>
    `${d}에서 소형견 위주로 케어해요. 첫 만남(짧은 산책) 원하시면 미리 말씀 주세요.`,
];

/** 돌봄(맡기는 사람) 목록·상세: 테스트용 제목은 구 기준 예시 문구로 표시 */
export function displayPublicDolbomMeetupTitle(m: Pick<Meetup, 'id' | 'title' | 'district'>): string {
  const raw = (m.title ?? '').trim();
  if (!isGarbageDolbomMeetupTitle(raw)) return raw;
  const d = (m.district ?? '').trim() || '동네';
  const idx = hashSeed(m.id) % DOLBOM_CARD_TITLE_FALLBACKS.length;
  return DOLBOM_CARD_TITLE_FALLBACKS[idx](d);
}

/** 돌봄 맡기기 글 설명: 너무 짧은 테스트 문장은 예시로 표시 */
export function displayPublicDolbomMeetupDescription(m: Pick<Meetup, 'id' | 'description' | 'district'>): string {
  const raw = typeof m.description === 'string' ? m.description : '';
  if (!isGarbageDolbomMeetupDescription(raw)) return raw.trim();
  const d = (m.district ?? '').trim() || '동네';
  const idx = hashSeed(`${m.id}-dolbom-desc`) % DOLBOM_CARD_DESC_FALLBACKS.length;
  return DOLBOM_CARD_DESC_FALLBACKS[idx](d);
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
  let probe = t;
  try {
    probe = `${t} ${decodeURIComponent(t)}`;
  } catch {
    /* ignore */
  }
  const lower = probe.toLowerCase();
  /** CDN·파일명에 드론·항공 촬영 힌트가 있으면 비반려 커버로 간주 */
  if (
    /dji|djifly|\bmavic\b|phantom|\binspire\b|air\s*2s|mini\s*[23]|quadcopter|\bdrone\b|\buav\b|skydio|autel|ryze|tello|fpv|racing\s*quad|항공\s*촬|항공촬|촬영용|드론|aerial\s*photo|aerial[_-]?image/i.test(
      lower,
    )
  ) {
    return true;
  }
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

/** URL 문자열에만 나타나는 비반려·일러스트 힌트(퍼센트 인코딩 디코드 후에도 검사) */
function dogProfilePhotoUrlLooksNonPet(url: string): boolean {
  let probe = url;
  try {
    probe = `${url} ${decodeURIComponent(url)}`;
  } catch {
    probe = url;
  }
  const p = probe.toLowerCase();
  return (
    /grazing|\bsheep\b|\blamb\b|mee{2,}p|illustrat|freepik\.com\/|vecteezy|depositphotos|shutterstock|123rf|alamy|bodybuild|muscle[-_]?man|weight[-_]?lift|humaaans|blush\.design|opendoodles|flaticon|iconfinder|cdn-icons|human[-_]?figure|people[-_]?illustrat/i.test(
      p,
    ) ||
    /undraw\.co|storyset\.com|drawkit\.io|illustrations\.unsplash/i.test(p) ||
    /[/._-]logo\.(png|jpe?g|webp)(\?|#|$)|[/._-]favicon\.(png|ico)(\?|#|$)/i.test(p)
  );
}

/** `dog_profiles.photo_url` — 비어 있거나 플레이스홀더·일러스트 스톡·비반려면 가상 강아지 */
export function resolveDogProfilePhotoUrl(dog: { id: string; photo_url?: string | null }): string {
  const raw = typeof dog.photo_url === 'string' ? dog.photo_url.trim() : '';
  if (!raw) return virtualDogPhotoForSeed(`db-dog-${dog.id}`);
  if (shouldUseVirtualDogPhoto(raw)) return virtualDogPhotoForSeed(`db-dog-${dog.id}`);
  if (/^https:\/\/images\.unsplash\.com\//i.test(raw)) return virtualDogPhotoForSeed(`db-dog-${dog.id}`);
  if (dogProfilePhotoUrlLooksNonPet(raw)) {
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

/** 한글 음절(가~힣) 없이 자모·숫자·영문만 짧게 쓴 테스트 이름 */
function isJamoOrAsciiGarbageName(n: string): boolean {
  const hangulSyllables = (n.match(/[가-힣]/g) ?? []).length;
  if (hangulSyllables > 0) return false;
  if (n.length > 6) return false;
  if (/^[\u3131-\u318E]+$/.test(n)) return true;
  if (/^[a-zA-Z0-9]*$/i.test(n) && n.length <= 3) return true;
  return false;
}

function isGarbageDogNameForPublic(name: string | null | undefined): boolean {
  const n = (name ?? '').trim();
  if (!n) return true;
  if (/^\d+$/.test(n) && n.length <= 10) return true;
  if (n.length === 1) return true;
  if (isJamoOrAsciiGarbageName(n)) return true;
  return false;
}

function isGarbageDogBreedForPublic(breed: string | null | undefined): boolean {
  const b = (breed ?? '').trim();
  if (!b) return false;
  if (/^\d+$/.test(b)) return true;
  if (b.length === 1) return true;
  if (isJamoOrAsciiGarbageName(b)) return true;
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
