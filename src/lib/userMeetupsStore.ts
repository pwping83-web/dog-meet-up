import type { Meetup } from '../app/types';
import { enrichMeetupWithVirtualDogCover } from '../app/data/virtualDogPhotos';

const STORAGE_KEY = 'daeng-user-meetups-v1';
const MAX_STORED = 50;

function reviveMeetup(row: Record<string, unknown>): Meetup | null {
  if (typeof row.id !== 'string' || typeof row.title !== 'string' || typeof row.category !== 'string') return null;
  const created =
    row.createdAt != null
      ? new Date(String(row.createdAt))
      : new Date();
  if (Number.isNaN(created.getTime())) return null;
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: typeof row.description === 'string' ? row.description : '',
    location: typeof row.location === 'string' ? row.location : '',
    district: typeof row.district === 'string' ? row.district : '',
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    estimatedCost: typeof row.estimatedCost === 'string' ? row.estimatedCost : undefined,
    listingVisibleUntil:
      row.listingVisibleUntil != null && row.listingVisibleUntil !== ''
        ? String(row.listingVisibleUntil)
        : undefined,
    status:
      row.status === 'in-progress' || row.status === 'completed' || row.status === 'pending'
        ? row.status
        : 'pending',
    createdAt: created,
    userId: typeof row.userId === 'string' ? row.userId : '',
    userName: typeof row.userName === 'string' ? row.userName : '댕댕이 집사',
  };
}

/** 사용자 기기에만 저장된 글(모이자·만나자·돌봄). Supabase 연동 전 임시. */
export function readUserMeetups(): Meetup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: Meetup[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const m = reviveMeetup(item as Record<string, unknown>);
      if (m) out.push(m);
    }
    return out;
  } catch {
    return [];
  }
}

export function appendUserMeetup(meetup: Meetup): void {
  try {
    const prev = readUserMeetups();
    const combined = [meetup, ...prev].slice(0, MAX_STORED);
    const serialized = combined.map((m) => ({
      ...m,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
      listingVisibleUntil:
        m.listingVisibleUntil instanceof Date
          ? m.listingVisibleUntil.toISOString()
          : m.listingVisibleUntil,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    window.dispatchEvent(new CustomEvent('daeng-user-meetups-changed'));
  } catch {
    /* ignore quota / private mode */
  }
}

/** mock 목록 앞에 사용자 글을 붙이고, 최신 생성 순으로 정렬 */
export function getMergedMeetups(mock: Meetup[]): Meetup[] {
  const user = readUserMeetups();
  const seen = new Set(user.map((u) => u.id));
  const rest = mock.filter((m) => !seen.has(m.id));
  return [...user, ...rest]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(enrichMeetupWithVirtualDogCover);
}
