/**
 * 강아지 MBTI 시스템
 * 
 * 성격과 나이 기반 매칭을 위한 강아지 프로필 데이터
 */

export type DogMbtiType = 
  | 'shy' // 소심한아이
  | 'active' // 활발한아이
  | 'senior' // 노견
  | 'social' // 사교적인아이
  | 'independent' // 독립적인아이
  | 'curious' // 호기심쟁이
  | 'gentle' // 순한아이
  | 'playful'; // 장난꾸러기

export type DogAgeGroup = 
  | 'puppy' // 퍼피 (0-1년)
  | 'young' // 청년기 (1-3년)
  | 'adult' // 성견 (3-7년)
  | 'senior'; // 노견 (7년+)

export interface DogMbtiResult {
  type: DogMbtiType;
  name: string;
  emoji: string;
  description: string;
  traits: string[];
  color: string;
  bestMatch: DogMbtiType[];
  activities: string[];
}

export const dogMbtiResults: Record<DogMbtiType, DogMbtiResult> = {
  shy: {
    type: 'shy',
    name: '소심한아이',
    emoji: '🥺',
    description: '조용하고 차분한 성격으로 낯을 많이 가려요. 안전하고 편안한 환경에서 천천히 친해지는 스타일입니다.',
    traits: ['조용함', '차분함', '신중함', '예민함'],
    color: 'bg-amber-100 text-amber-800',
    bestMatch: ['gentle', 'social', 'senior'],
    activities: ['조용한 산책', '소규모 모임', '실내 놀이'],
  },
  active: {
    type: 'active',
    name: '활발한아이',
    emoji: '⚡',
    description: '에너지가 넘치고 항상 움직이는 걸 좋아해요! 달리기와 놀이를 즐기는 활동적인 성격입니다.',
    traits: ['에너제틱', '활동적', '긍정적', '적극적'],
    color: 'bg-orange-100 text-orange-600',
    bestMatch: ['playful', 'curious', 'active'],
    activities: ['러닝', '공놀이', '활동적인 산책'],
  },
  senior: {
    type: 'senior',
    name: '노견',
    emoji: '🦮',
    description: '차분하고 경험이 풍부한 시니어 댕댕이. 여유롭고 안정적인 성격으로 편안한 산책을 좋아합니다.',
    traits: ['차분함', '경험많음', '안정적', '여유로움'],
    color: 'bg-orange-100 text-orange-700',
    bestMatch: ['gentle', 'shy', 'senior'],
    activities: ['느긋한 산책', '휴식', '건강 관리'],
  },
  social: {
    type: 'social',
    name: '사교적인아이',
    emoji: '🤗',
    description: '다른 강아지들과 잘 어울리고 사람도 좋아해요! 친구 사귀는 걸 즐기는 인싸 댕댕이입니다.',
    traits: ['친화적', '사교적', '밝음', '호감형'],
    color: 'bg-amber-50 text-orange-600',
    bestMatch: ['playful', 'active', 'social'],
    activities: ['강아지 파티', '그룹 산책', '사회화 훈련'],
  },
  independent: {
    type: 'independent',
    name: '독립적인아이',
    emoji: '😎',
    description: '혼자만의 시간도 즐기고 자기주장이 뚜렷해요. 자유로운 영혼의 소유자입니다.',
    traits: ['독립적', '자유로움', '자기주장', '침착함'],
    color: 'bg-gray-100 text-gray-600',
    bestMatch: ['independent', 'senior', 'gentle'],
    activities: ['자유 산책', '탐험', '개인 훈련'],
  },
  curious: {
    type: 'curious',
    name: '호기심쟁이',
    emoji: '🔍',
    description: '새로운 것에 관심이 많고 탐험을 좋아해요. 모든 게 궁금한 탐험가 댕댕이입니다.',
    traits: ['호기심많음', '탐험가', '영리함', '모험적'],
    color: 'bg-yellow-100 text-yellow-600',
    bestMatch: ['curious', 'active', 'playful'],
    activities: ['새로운 장소 탐험', '후각 훈련', '모험 산책'],
  },
  gentle: {
    type: 'gentle',
    name: '순한아이',
    emoji: '😇',
    description: '온순하고 착한 성격으로 누구에게나 사랑받아요. 평화로운 분위기를 만드는 천사 댕댕이입니다.',
    traits: ['온순함', '착함', '평화로움', '순종적'],
    color: 'bg-orange-50 text-orange-700',
    bestMatch: ['gentle', 'shy', 'senior'],
    activities: ['평화로운 산책', '힐링 타임', '기본 훈련'],
  },
  playful: {
    type: 'playful',
    name: '장난꾸러기',
    emoji: '🎾',
    description: '놀이를 사랑하고 장난치는 걸 좋아해요! 언제나 즐거운 에너지를 가진 파티 메이커입니다.',
    traits: ['장난기', '즐거움', '쾌활함', '재미있음'],
    color: 'bg-amber-100 text-orange-800',
    bestMatch: ['playful', 'active', 'social'],
    activities: ['장난감 놀이', '숨바꼭질', '활동적인 놀이'],
  },
};

// MBTI 테스트 질문
export interface MbtiQuestion {
  id: number;
  question: string;
  options: {
    text: string;
    emoji: string;
    scores: Partial<Record<DogMbtiType, number>>;
  }[];
}

export const mbtiQuestions: MbtiQuestion[] = [
  {
    id: 1,
    question: '산책 나갔을 때 우리 강아지는?',
    options: [
      {
        text: '천천히 주변을 탐색해요',
        emoji: '🚶',
        scores: { shy: 2, gentle: 2, senior: 1 },
      },
      {
        text: '신나게 뛰어다녀요',
        emoji: '🏃',
        scores: { active: 3, playful: 2 },
      },
      {
        text: '다른 강아지한테 먼저 다가가요',
        emoji: '👋',
        scores: { social: 3, playful: 1 },
      },
    ],
  },
  {
    id: 2,
    question: '낯선 사람을 만나면?',
    options: [
      {
        text: '숨거나 멀리서 지켜봐요',
        emoji: '😰',
        scores: { shy: 3, independent: 1 },
      },
      {
        text: '꼬리 흔들며 반겨요',
        emoji: '🥰',
        scores: { social: 3, gentle: 2 },
      },
      {
        text: '관심없이 자기 할 일 해요',
        emoji: '😎',
        scores: { independent: 3, senior: 1 },
      },
    ],
  },
  {
    id: 3,
    question: '새로운 장난감을 주면?',
    options: [
      {
        text: '조심스럽게 냄새부터 맡아요',
        emoji: '👃',
        scores: { shy: 2, curious: 2 },
      },
      {
        text: '바로 물고 신나게 놀아요',
        emoji: '🎾',
        scores: { playful: 3, active: 2 },
      },
      {
        text: '꼼꼼히 살펴본 후 놀아요',
        emoji: '🔍',
        scores: { curious: 3, independent: 1 },
      },
    ],
  },
  {
    id: 4,
    question: '집에서 혼자 있을 때는?',
    options: [
      {
        text: '조용히 잠만 자요',
        emoji: '😴',
        scores: { gentle: 2, senior: 3 },
      },
      {
        text: '장난감 물고 계속 놀아요',
        emoji: '🎪',
        scores: { playful: 3, active: 2 },
      },
      {
        text: '집안을 탐험해요',
        emoji: '🗺️',
        scores: { curious: 3, independent: 2 },
      },
    ],
  },
  {
    id: 5,
    question: '다른 강아지를 만나면?',
    options: [
      {
        text: '무서워하거나 피해요',
        emoji: '😨',
        scores: { shy: 3, gentle: 1 },
      },
      {
        text: '신나게 같이 놀자고 해요',
        emoji: '🎉',
        scores: { social: 3, playful: 2 },
      },
      {
        text: '관심없이 지나가요',
        emoji: '🚶‍♂️',
        scores: { independent: 3, senior: 1 },
      },
    ],
  },
  {
    id: 6,
    question: '에너지 레벨은?',
    options: [
      {
        text: '차분하고 조용해요',
        emoji: '🧘',
        scores: { gentle: 2, shy: 2, senior: 2 },
      },
      {
        text: '중간 정도예요',
        emoji: '🚶',
        scores: { independent: 2, curious: 2 },
      },
      {
        text: '항상 에너지가 넘쳐요',
        emoji: '⚡',
        scores: { active: 3, playful: 2 },
      },
    ],
  },
  {
    id: 7,
    question: '훈련 시간에는?',
    options: [
      {
        text: '집중력이 높고 잘 따라해요',
        emoji: '🎓',
        scores: { gentle: 2, curious: 2 },
      },
      {
        text: '산만하고 장난쳐요',
        emoji: '😝',
        scores: { playful: 3, active: 1 },
      },
      {
        text: '자기 하고 싶은 것만 해요',
        emoji: '😤',
        scores: { independent: 3 },
      },
    ],
  },
  {
    id: 8,
    question: '좋아하는 활동은?',
    options: [
      {
        text: '조용히 쉬는 것',
        emoji: '🛋️',
        scores: { senior: 3, gentle: 2 },
      },
      {
        text: '활동적인 놀이',
        emoji: '⚽',
        scores: { active: 3, playful: 2 },
      },
      {
        text: '새로운 곳 탐험',
        emoji: '🗺️',
        scores: { curious: 3, social: 1 },
      },
    ],
  },
];

// 나이 그룹별 추천 활동
export const ageGroupActivities: Record<DogAgeGroup, string[]> = {
  puppy: ['퍼피 사회화', '기본 훈련', '소규모 놀이'],
  young: ['활동적인 산책', '프리스비', '아질리티'],
  adult: ['일반 산책', '훈련', '사교 모임'],
  senior: ['느긋한 산책', '건강 관리', '힐링 타임'],
};

// 나이 그룹 판단 함수
export function getAgeGroup(years: number): DogAgeGroup {
  if (years < 1) return 'puppy';
  if (years < 3) return 'young';
  if (years < 7) return 'adult';
  return 'senior';
}

// MBTI 결과 계산 함수
export function calculateMbti(scores: Record<DogMbtiType, number>): DogMbtiType {
  let maxScore = 0;
  let result: DogMbtiType = 'gentle';
  
  Object.entries(scores).forEach(([type, score]) => {
    if (score > maxScore) {
      maxScore = score;
      result = type as DogMbtiType;
    }
  });
  
  return result;
}
