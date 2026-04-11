import type { User } from '@supabase/supabase-js';

/** 카카오로 로그인한 이 계정만 관리자 화면 접근 */
const APP_ADMIN_EMAIL = 'pwping83@gmail.com';

function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

export function getUserEmailForAdminCheck(user: User): string | null {
  const direct = user.email?.trim();
  if (direct) return normalizeEmail(direct);
  const fromMeta = user.user_metadata?.email;
  if (typeof fromMeta === 'string' && fromMeta.trim()) return normalizeEmail(fromMeta);
  return null;
}

export function userSignedInWithKakao(user: User): boolean {
  return user.identities?.some((id) => id.provider === 'kakao') ?? false;
}

export function isAppAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  if (!userSignedInWithKakao(user)) return false;
  const email = getUserEmailForAdminCheck(user);
  return email === normalizeEmail(APP_ADMIN_EMAIL);
}
