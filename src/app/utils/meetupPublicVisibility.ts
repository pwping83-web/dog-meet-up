import type { Meetup } from '../types';

/** 목록·피드에 보일 수 있는 글인지(교배는 유료 노출 기한이 있어야 공개) */
export function meetupVisibleInPublicFeed(m: Meetup): boolean {
  if (m.category !== '교배') return true;
  const u = m.listingVisibleUntil;
  if (u == null) return false;
  const t = typeof u === 'string' ? Date.parse(u) : u instanceof Date ? u.getTime() : NaN;
  return !Number.isNaN(t) && t > Date.now();
}
