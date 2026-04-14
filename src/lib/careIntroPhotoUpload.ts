import { supabase } from './supabase';

export const CARE_INTRO_PHOTO_MAX = 3;

export function normalizeIntroPhotoUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((u): u is string => typeof u === 'string' && /^https?:\/\//i.test(u.trim())).slice(0, CARE_INTRO_PHOTO_MAX);
}

export async function uploadCareIntroPhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : '';
  const safeExt = ext && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
  const path = `care-intro/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;
  const { error } = await supabase.storage.from('dog-photos').upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('dog-photos').getPublicUrl(path);
  return data.publicUrl;
}
