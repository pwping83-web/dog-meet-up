/** 모이자: 장소·일정 잡고 여럿이 모이는 글 */
export const MOIJA_MEETUP_CATEGORIES = ['공원·장소 모임', '산책·놀이', '카페·체험', '훈련·사회화'] as const;

/** 만나자: 1:1 만남·교배·실종 등 */
export const MANNAJA_MEETUP_CATEGORIES = ['1:1 만남', '교배', '실종'] as const;

export const MOIJA_CATEGORY_SET = new Set<string>(MOIJA_MEETUP_CATEGORIES);
export const MANNAJA_CATEGORY_SET = new Set<string>(MANNAJA_MEETUP_CATEGORIES);

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
