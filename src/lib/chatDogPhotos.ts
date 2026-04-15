import { supabase } from './supabase';
import { resolveDogProfilePhotoUrl } from '../app/data/virtualDogPhotos';

export type DogProfilePhotoRow = {
  id: string;
  owner_id: string | null;
  photo_url: string | null;
  created_at: string;
};

/** owner_id당 가장 최근 등록된 강아지 1마리 사진 URL */
export async function fetchLatestDogPhotoUrlByOwnerIds(ownerIds: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ownerIds.map((x) => x.trim()).filter(Boolean))];
  if (unique.length === 0) return {};
  const { data, error } = await supabase
    .from('dog_profiles')
    .select('id, owner_id, photo_url, created_at')
    .in('owner_id', unique);
  if (error || !data?.length) return {};
  const sorted = [...(data as DogProfilePhotoRow[])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const out: Record<string, string> = {};
  for (const row of sorted) {
    const oid = typeof row.owner_id === 'string' ? row.owner_id.trim() : '';
    if (!oid || out[oid]) continue;
    out[oid] = resolveDogProfilePhotoUrl({ id: row.id, photo_url: row.photo_url });
  }
  return out;
}
