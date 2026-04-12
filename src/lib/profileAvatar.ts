/** DB `profiles.avatar_url`에 캐릭터 테마만 저장할 때 사용 (실제 URL과 구분) */
export const DAENG_AVATAR_THEME_PREFIX = 'daeng-avatar-theme:';

export const PROFILE_THEME_AVATARS = [
  { id: 'default', emoji: '👤', bg: 'bg-slate-100', border: 'border-slate-200' },
  { id: 'pup', emoji: '🐶', bg: 'bg-amber-100', border: 'border-amber-300' },
  { id: 'poodle', emoji: '🐩', bg: 'bg-orange-100', border: 'border-orange-300' },
  { id: 'retriever', emoji: '🦮', bg: 'bg-orange-100', border: 'border-orange-300' },
] as const;

export type ProfileThemeId = (typeof PROFILE_THEME_AVATARS)[number]['id'];

const THEME_IDS = new Set<string>(PROFILE_THEME_AVATARS.map((t) => t.id));

export function encodeProfileAvatarTheme(themeId: string): string {
  const id = THEME_IDS.has(themeId) ? themeId : 'default';
  return `${DAENG_AVATAR_THEME_PREFIX}${id}`;
}

export type ParsedProfileAvatar =
  | { kind: 'theme'; themeId: ProfileThemeId }
  | { kind: 'image'; url: string };

export function parseProfileAvatarUrl(avatar_url: string | null | undefined): ParsedProfileAvatar {
  const raw = (avatar_url ?? '').trim();
  if (!raw) return { kind: 'theme', themeId: 'default' };
  if (raw.startsWith(DAENG_AVATAR_THEME_PREFIX)) {
    const id = raw.slice(DAENG_AVATAR_THEME_PREFIX.length) || 'default';
    const themeId = (THEME_IDS.has(id) ? id : 'default') as ProfileThemeId;
    return { kind: 'theme', themeId };
  }
  return { kind: 'image', url: raw };
}

export function themeAvatarMeta(themeId: string): (typeof PROFILE_THEME_AVATARS)[number] {
  return PROFILE_THEME_AVATARS.find((t) => t.id === themeId) ?? PROFILE_THEME_AVATARS[0];
}

/** 마이·수정 페이지 공통: 썸네일용 (이미지 URL 또는 이모지) */
export function profileAvatarVisual(avatar_url: string | null | undefined): {
  kind: 'image';
  src: string;
} | {
  kind: 'emoji';
  emoji: string;
  bg: string;
  border: string;
} {
  const p = parseProfileAvatarUrl(avatar_url);
  if (p.kind === 'image') return { kind: 'image', src: p.url };
  const t = themeAvatarMeta(p.themeId);
  return { kind: 'emoji', emoji: t.emoji, bg: t.bg, border: t.border };
}

export function profileAvatarAlt(avatar_url: string | null | undefined, nickname: string): string {
  const v = profileAvatarVisual(avatar_url);
  if (v.kind === 'image') return `${nickname} 프로필 사진`;
  return `${nickname} 프로필 (${v.emoji})`;
}
