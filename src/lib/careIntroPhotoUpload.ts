import { supabase } from './supabase';

export const CARE_INTRO_PHOTO_MAX = 1;

export function normalizeIntroPhotoUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((u): u is string => typeof u === 'string' && /^https?:\/\//i.test(u.trim())).slice(0, CARE_INTRO_PHOTO_MAX);
}

const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'bmp']);

function extFromFileName(file: File): string {
  if (!file.name.includes('.')) return '';
  return file.name.split('.').pop()?.toLowerCase() ?? '';
}

function guessContentType(file: File, ext: string): string {
  if (file.type && file.type.startsWith('image/')) return file.type;
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return 'image/jpeg';
}

export async function uploadCareIntroPhoto(userId: string, file: File): Promise<string> {
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) {
    throw new Error('로그인이 필요해요. 다시 로그인한 뒤 사진을 올려 주세요.');
  }

  const ext = extFromFileName(file);
  const safeExt = ext && IMAGE_EXT.has(ext) ? ext : 'jpg';
  const path = `care-intro/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;
  const contentType = guessContentType(file, safeExt);
  const { error } = await supabase.storage.from('dog-photos').upload(path, file, {
    upsert: false,
    contentType,
    cacheControl: '3600',
  });
  if (error) {
    const em = (error.message || '').toLowerCase();
    if (em.includes('bucket') && (em.includes('not found') || em.includes('does not exist'))) {
      throw new Error(
        'dog-photos 저장소가 없어요. Supabase SQL Editor에서 supabase/migrations/20260425103000_storage_dog_photos_bucket.sql 을 실행해 주세요.',
      );
    }
    throw error;
  }
  const { data } = supabase.storage.from('dog-photos').getPublicUrl(path);
  return data.publicUrl;
}
