import type { Meetup } from '../app/types';
import { enrichMeetupWithVirtualDogCover } from '../app/data/virtualDogPhotos';

const STORAGE_KEY = 'daeng-user-meetups-v1';
const MAX_STORED = 50;
const ADMIN_DELETED_IDS_KEY = 'daeng-admin-deleted-meetup-ids-v1';
const ADMIN_OVERRIDE_KEY = 'daeng-admin-meetup-overrides-v1';
const TEMP_FIXED_MEETUP_LOCATION = '경기 안양시 동안구 관양동';
const TEMP_FIXED_MEETUP_DISTRICT = '안양시 동안구 관양동';

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

function serializeMeetupsForStorage(meetups: Meetup[]): unknown[] {
  return meetups.map((m) => ({
    ...m,
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
    listingVisibleUntil:
      m.listingVisibleUntil instanceof Date
        ? m.listingVisibleUntil.toISOString()
        : m.listingVisibleUntil,
  }));
}

function persistUserMeetups(meetups: Meetup[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeMeetupsForStorage(meetups)));
    window.dispatchEvent(new CustomEvent('daeng-user-meetups-changed'));
  } catch {
    /* ignore quota / private mode */
  }
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
    persistUserMeetups(combined);
  } catch {
    /* ignore quota / private mode */
  }
}

/** 사용자 글 삭제(본인 또는 관리자 흐름에서 사용) */
export function removeUserMeetupById(id: string): boolean {
  const prev = readUserMeetups();
  const next = prev.filter((m) => m.id !== id);
  if (next.length === prev.length) return false;
  persistUserMeetups(next);
  return true;
}

/** 사용자 글 일부 수정 */
export function updateUserMeetupInStore(id: string, patch: Partial<Meetup>): boolean {
  const prev = readUserMeetups();
  const idx = prev.findIndex((m) => m.id === id);
  if (idx < 0) return false;
  const cur = prev[idx]!;
  const merged: Meetup = {
    ...cur,
    ...patch,
    createdAt:
      patch.createdAt != null
        ? patch.createdAt instanceof Date
          ? patch.createdAt
          : new Date(String(patch.createdAt))
        : cur.createdAt,
    images: patch.images ?? cur.images,
    status: patch.status ?? cur.status,
  };
  if (Number.isNaN(merged.createdAt.getTime())) merged.createdAt = cur.createdAt;
  const next = [...prev];
  next[idx] = merged;
  persistUserMeetups(next);
  return true;
}

function readAdminDeletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(ADMIN_DELETED_IDS_KEY);
    if (!raw) return new Set();
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return new Set();
    return new Set(p.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function writeAdminDeletedIds(ids: Set<string>): void {
  try {
    localStorage.setItem(ADMIN_DELETED_IDS_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

type MeetupOverrideRow = Record<string, unknown>;

function readAdminOverrides(): Record<string, MeetupOverrideRow> {
  try {
    const raw = localStorage.getItem(ADMIN_OVERRIDE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    if (!p || typeof p !== 'object' || Array.isArray(p)) return {};
    return p as Record<string, MeetupOverrideRow>;
  } catch {
    return {};
  }
}

function writeAdminOverrides(overrides: Record<string, MeetupOverrideRow>): void {
  try {
    localStorage.setItem(ADMIN_OVERRIDE_KEY, JSON.stringify(overrides));
  } catch {
    /* ignore */
  }
}

function patchToStorable(patch: Partial<Meetup>): MeetupOverrideRow {
  const o: MeetupOverrideRow = {};
  if (patch.title !== undefined) o.title = patch.title;
  if (patch.category !== undefined) o.category = patch.category;
  if (patch.description !== undefined) o.description = patch.description;
  if (patch.location !== undefined) o.location = patch.location;
  if (patch.district !== undefined) o.district = patch.district;
  if (patch.userName !== undefined) o.userName = patch.userName;
  if (patch.userId !== undefined) o.userId = patch.userId;
  if (patch.estimatedCost !== undefined) o.estimatedCost = patch.estimatedCost;
  if (patch.status !== undefined) o.status = patch.status;
  if (patch.images !== undefined) o.images = patch.images;
  if (patch.listingVisibleUntil !== undefined) o.listingVisibleUntil = patch.listingVisibleUntil;
  if (patch.createdAt !== undefined) {
    o.createdAt =
      patch.createdAt instanceof Date ? patch.createdAt.toISOString() : String(patch.createdAt);
  }
  return o;
}

function mergeMeetupWithOverride(base: Meetup, id: string): Meetup {
  const ov = readAdminOverrides()[id];
  if (!ov || typeof ov !== 'object') return base;
  const next: Meetup = { ...base };
  if (typeof ov.title === 'string') next.title = ov.title;
  if (typeof ov.category === 'string') next.category = ov.category;
  if (typeof ov.description === 'string') next.description = ov.description;
  if (typeof ov.location === 'string') next.location = ov.location;
  if (typeof ov.district === 'string') next.district = ov.district;
  if (typeof ov.userName === 'string') next.userName = ov.userName;
  if (typeof ov.userId === 'string') next.userId = ov.userId;
  if (typeof ov.estimatedCost === 'string') next.estimatedCost = ov.estimatedCost;
  if (ov.status === 'pending' || ov.status === 'in-progress' || ov.status === 'completed') {
    next.status = ov.status;
  }
  if (Array.isArray(ov.images)) next.images = ov.images as string[];
  if (ov.listingVisibleUntil != null && ov.listingVisibleUntil !== '') {
    next.listingVisibleUntil = String(ov.listingVisibleUntil);
  }
  if (typeof ov.createdAt === 'string') {
    const d = new Date(ov.createdAt);
    if (!Number.isNaN(d.getTime())) next.createdAt = d;
  }
  return next;
}

/** 관리자: 목업 글·사용자 글 모두 피드에서 제거 */
export function adminDeleteMeetupById(id: string): void {
  removeUserMeetupById(id);
  const del = readAdminDeletedIds();
  del.add(id);
  writeAdminDeletedIds(del);
  const ovs = readAdminOverrides();
  if (ovs[id]) {
    delete ovs[id];
    writeAdminOverrides(ovs);
  }
  window.dispatchEvent(new CustomEvent('daeng-user-meetups-changed'));
}

/** 관리자: 글 필드 수정(사용자 글은 스토어에, 목업 글은 오버라이드로 저장) */
export function adminSaveMeetupPatch(id: string, patch: Partial<Meetup>): void {
  if (updateUserMeetupInStore(id, patch)) {
    return;
  }
  const ovs = { ...readAdminOverrides() };
  const prev = ovs[id] ?? {};
  ovs[id] = { ...prev, ...patchToStorable(patch) };
  writeAdminOverrides(ovs);
  window.dispatchEvent(new CustomEvent('daeng-user-meetups-changed'));
}

/** mock 목록 앞에 사용자 글을 붙이고, 최신 생성 순으로 정렬. 관리자 삭제·수정 반영. */
export function getMergedMeetups(mock: Meetup[]): Meetup[] {
  const deleted = readAdminDeletedIds();
  const user = readUserMeetups().filter((m) => !deleted.has(m.id));
  const seen = new Set(user.map((u) => u.id));
  const rest = mock
    .filter((m) => !seen.has(m.id) && !deleted.has(m.id))
    .map((m) => mergeMeetupWithOverride(m, m.id));
  const userMapped = user.map((m) => mergeMeetupWithOverride(m, m.id));
  return [...userMapped, ...rest]
    .map((m) => ({
      ...m,
      // 요청: 모이자·만나자·돌봄 포함 모든 글 위치를 관양동 기준으로 통일(임시)
      location: TEMP_FIXED_MEETUP_LOCATION,
      district: TEMP_FIXED_MEETUP_DISTRICT,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(enrichMeetupWithVirtualDogCover);
}
