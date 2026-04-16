/**
 * Google Play Console 등록용 카피 (한국어).
 * 스토어 콘솔에 복사해 붙여 넣으면 됩니다.
 */

export const PLAY_STORE_APP_NAME = '댕댕마켓';

/** 짧은 설명 — Play 최대 80자 권장 */
export const PLAY_STORE_SHORT_DESCRIPTION =
  '우리 동네 모이자·만나자·돌봄 맡기기. 인증 보호맘·댕집사와 하이퍼로컬로 연결되는 반려견 앱.';

/** 전체 설명 — 불릿 위주, 짧게 */
export const PLAY_STORE_FULL_DESCRIPTION = [
  '댕댕마켓은 반려견 견주가 동네에서 모이고, 만나고, 돌봄을 맡길 수 있도록 돕는 앱이에요.',
  '',
  '【주요 기능】',
  '· 모이자 — 공원·산책·카페 등 모임 글과 피드',
  '· 만나자 — 1:1 만남·교배·실종 등 주제별 글',
  '· 돌봄 맡기기 — 맡기기·방문 돌봄 요청과 연결',
  '· 인증 보호맘·댕집사 — 운영 인증 기반 돌봄 목록',
  '· 채팅 — 1:1 대화, 모이자·만나자 모임 단톡',
  '· 위치 기반 — 동네 우선 노출과 거리 표시',
  '',
  '【안내】',
  '· 서비스는 정보·연결을 제공하며, 모임·돌봄 등은 이용자 간 책임이에요.',
  '· 자세한 내용은 앱 내 고객센터 법적 고지를 확인해 주세요.',
].join('\n');

/** 스크린샷 순서 안내 (`npm run capture:play-store` → __screenshots__) */
export const PLAY_STORE_SCREENSHOT_ORDER = [
  'home.png — 첫 화면',
  'explore.png — 피드·모이자·만나자·돌봄',
  'sitters.png — 댕집사·모이자·만나자',
  'sitters_view_care_care_need.png — 돌봄 맡기기',
  'search.png — 검색',
  'create-meetup.png — 글 올리기',
  'chats.png — 채팅',
  'my.png — 내댕댕',
  'profile_edit.png — 프로필 수정',
  'customer-service.png — 고객센터',
  'login.png — 로그인',
] as const;
