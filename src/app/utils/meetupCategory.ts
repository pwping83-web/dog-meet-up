/**
 * 카테고리 문자열이 표기 차이(공백/구분자/확장 문구)여도
 * 동일 의미로 판별하기 위한 유틸.
 */
function normalizeCategory(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[·•ㆍ\-_/()]/g, '')
    .replace(/\s+/g, '');
}

export function isCareMeetupCategory(category: string): boolean {
  const normalized = normalizeCategory(category);
  return normalized.includes('돌봄') || normalized.includes('맡기기') || normalized.includes('care');
}

/** 모이자: 장소·일정 잡고 여럿이 모이는 글 */
export const MOIJA_MEETUP_CATEGORIES = ['공원·장소 모임', '산책·놀이', '카페·체험', '훈련·사회화'] as const;

/** 만나자: 1:1 만남·교배·실종 등 */
export const MANNAJA_MEETUP_CATEGORIES = ['1:1 만남', '교배', '실종'] as const;

export const MOIJA_CATEGORY_SET = new Set<string>(MOIJA_MEETUP_CATEGORIES);
export const MANNAJA_CATEGORY_SET = new Set<string>(MANNAJA_MEETUP_CATEGORIES);
const GROUP_CHAT_CATEGORY_SET = new Set<string>([...MOIJA_MEETUP_CATEGORIES, ...MANNAJA_MEETUP_CATEGORIES]);
const GROUP_CHAT_CATEGORY_NORMALIZED_SET = new Set<string>(
  [...GROUP_CHAT_CATEGORY_SET].map((category) => normalizeCategory(category)),
);

export function isGroupChatMeetupCategory(category: string): boolean {
  return GROUP_CHAT_CATEGORY_NORMALIZED_SET.has(normalizeCategory(category));
}

export function meetupCategoryEmoji(category: string): string {
  switch (category) {
    case '공원·장소 모임':
      return '🌳';
    case '산책·놀이':
      return '🐕';
    case '카페·체험':
      return '☕';
    case '훈련·사회화':
      return '🎓';
    case '1:1 만남':
      return '💬';
    case '교배':
      return '💕';
    case '실종':
      return '🚨';
    case '돌봄':
      return '🦴';
    default:
      return '🐾';
  }
}
