import type { Meetup } from '../types';
import { getPromoFreeSnapshot } from '../../lib/promoFlags';

/** 목록·피드에 보일 수 있는 글인지(교배는 유료 노출 기한이 있어야 공개 — 한시적 무료 시 완화) */
export function meetupVisibleInPublicFeed(m: Meetup, promoFree?: boolean): boolean {
  const promo = promoFree ?? getPromoFreeSnapshot();
  if (m.category !== '교배') return true;
  if (promo) return true;
  const u = m.listingVisibleUntil;
  if (u == null) return false;
  const t = typeof u === 'string' ? Date.parse(u) : u instanceof Date ? u.getTime() : NaN;
  return !Number.isNaN(t) && t > Date.now();
}
