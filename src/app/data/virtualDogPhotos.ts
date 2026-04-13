import type { DogSitter, Meetup } from '../types';
import { isCareMeetupCategory } from '../utils/meetupCategory';
import { BREED_STOCK_UNSPLASH_LIST, isBreedStockPhotoUrl, isPreservedMeetupCoverUrl } from './breedStockPhotos';

/**
 * 목업·폴백용 강아지 스톡 — 견종별 고정 Unsplash 6종만 순환 (`breedStockPhotos`).
 * 동일 시드 → 동일 URL(화면 깜빡임 최소화).
 */
const VIRTUAL_DOG_PHOTOS: readonly string[] = BREED_STOCK_UNSPLASH_LIST;

/** 목업에서 잘못 쓰이기 쉬운 비반려·드론 이미지(구체 ID만). 푸들용 `photo-1583337130417-3346a1be7dee`는 제외 */
const REPLACED_UNSPLASH_IDS = /photo-1583337130417-33480f6d3eaa|drone|quadcopter|dji\.com/i;

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
  if (first && !shouldUseVirtualDogPhoto(first) && (!isUnsplashStock || isPreservedMeetupCoverUrl(first))) return m;
  const seed = isCareMeetupCategory(m.category) ? `dolbom-${m.id}` : `meetup-${m.id}`;
  return { ...m, images: [virtualDogPhotoForSeed(seed)] };
}

/** 목록·썸네일·상세 대표 이미지 (항상 비어 있지 않은 URL) */
export function meetupCoverImageUrl(m: Meetup): string {
  const e = enrichMeetupWithVirtualDogCover(m);
  const u = e.images?.find((x) => typeof x === 'string' && x.trim().length > 0)?.trim();
  if (u) return u;
  const seed = isCareMeetupCategory(m.category) ? `dolbom-${m.id}` : `meetup-${m.id}`;
  return virtualDogPhotoForSeed(seed);
}

/** 댕집사·근처 댕친 목록용 프로필 사진 (비어 있거나 스톡·비반려면 가상 강아지) */
export function resolveDogSitterPortraitUrl(s: Pick<DogSitter, 'id' | 'profileImage'>): string {
  const raw = typeof s.profileImage === 'string' ? s.profileImage.trim() : '';
  if (!raw) return virtualDogPhotoForSeed(`mock-sitter-${s.id}`);
  if (shouldUseVirtualDogPhoto(raw)) return virtualDogPhotoForSeed(`mock-sitter-${s.id}`);
  if (/^https:\/\/images\.unsplash\.com\//i.test(raw) && !isBreedStockPhotoUrl(raw))
    return virtualDogPhotoForSeed(`mock-sitter-${s.id}`);
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
  if (/^https:\/\/images\.unsplash\.com\//i.test(raw) && !isBreedStockPhotoUrl(raw))
    return virtualDogPhotoForSeed(`db-dog-${dog.id}`);
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

/**
 * 탐색 카드용: `dog_profiles.photo_url` 우선, 비면 보호자 `profiles.avatar_url` 사용 후 가상 강아지.
 * (공개 상세 `sanitizeDogProfileForPublicDisplay`에서 `owner_avatar_url`을 넘기면 동일 규칙 적용)
 */
export function resolveExploreDogPhotoUrl(input: {
  id: string;
  photo_url?: string | null;
  owner_avatar_url?: string | null;
}): string {
  const resolved = resolveDogProfilePhotoUrl(input);
  const virtualOnly = virtualDogPhotoForSeed(`db-dog-${input.id}`);
  if (resolved !== virtualOnly) return resolved;

  const av = typeof input.owner_avatar_url === 'string' ? input.owner_avatar_url.trim() : '';
  if (av && /^https?:\/\//i.test(av)) {
    if (!shouldUseVirtualDogPhoto(av)) {
      try {
        if (!PLACEHOLDER_OR_STOCK_HOST.test(new URL(av).hostname)) {
          return av;
        }
      } catch {
        return av;
      }
    }
  }
  return virtualOnly;
}

/** `source.unsplash.com` 서비스 종료로, 동일 용도의 Unsplash CDN + Pixabay 시드 URL(안정적). */
export function exploreDogCardImageFallbackChain(dogId: string): readonly string[] {
  const u1 = virtualDogPhotoForSeed(`explore-card-fb-a-${dogId}`);
  const u2 = virtualDogPhotoForSeed(`explore-card-fb-b-${dogId}`);
  const u3 = virtualDogPhotoForSeed(`explore-card-fb-c-${dogId}`);
  const pix = EXPLORE_DOG_PIXABAY_FALLBACKS[hashSeed(dogId) % EXPLORE_DOG_PIXABAY_FALLBACKS.length]!;
  return [u1, u2, u3, pix];
}

const EXPLORE_DOG_PIXABAY_FALLBACKS: readonly string[] = [
  'https://cdn.pixabay.com/photo/2019/07/30/05/53/dog-4372039_640.jpg',
  'https://cdn.pixabay.com/photo/2016/01/19/17/41/golden-retriever-1149724_640.jpg',
  'https://cdn.pixabay.com/photo/2016/11/22/23/37/dog-1850464_640.jpg',
  'https://cdn.pixabay.com/photo/2020/11/04/18/54/pomeranian-5711687_640.jpg',
];

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
  /** `profiles.avatar_url` — 탐색 카드 등에서만 전달 */
  owner_avatar_url?: string | null;
}): DogProfilePublicDisplay {
  const rawUrl = typeof dog.photo_url === 'string' ? dog.photo_url.trim() : '';
  const photoUrl = resolveExploreDogPhotoUrl({
    id: dog.id,
    photo_url: dog.photo_url,
    owner_avatar_url: dog.owner_avatar_url ?? null,
  });
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
