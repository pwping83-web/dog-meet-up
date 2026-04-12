import type { Meetup } from '../types';

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
  if (!/^https?:\/\//i.test(t)) return false;
  return REPLACED_UNSPLASH_IDS.test(t);
}

/** 썸네일 없거나 비반려·논쟁 URL이면 글 ID 기준 가상 강아지 커버 1장 */
export function enrichMeetupWithVirtualDogCover(m: Meetup): Meetup {
  const raw = m.images ?? [];
  const first = raw.find((u) => typeof u === 'string' && u.trim().length > 8) ?? '';
  if (first && !shouldUseVirtualDogPhoto(first)) return m;
  const seed = m.category === '돌봄' ? `dolbom-${m.id}` : `meetup-${m.id}`;
  return { ...m, images: [virtualDogPhotoForSeed(seed)] };
}
