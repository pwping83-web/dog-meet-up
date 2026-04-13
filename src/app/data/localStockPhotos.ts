/**
 * `public/images` 번들 사진 — 역할별로만 참조해 견종·용도가 겹치지 않게 함.
 *
 * - `LOCAL_HERO`: 랜딩 배너·탐색 강조(복수 견종/활동 컷 포함 가능)
 * - `LOCAL_BREED_REPRESENTATIVE`: 앱 6견종 중 **로컬로 둔 대표 샷**
 * - `LOCAL_BREED_ALTERNATE`: 같은 견종·캐릭터용 **추가 컷**(대표와 파일 중복 없음)
 * - `LOCAL_WELSH_CORGI_SCENE`: 웰시코기 캐릭터(단독 달리기·쌍·히어로)
 * - `LOCAL_MEETUP_SCENE`: 모임 썸네일 **테마**
 * - `LOCAL_SMALL_BREED_EXTRA`: 품종 6종 밖 소형견 보조
 */
export const LOCAL_HERO = {
  hangangBanner: '/images/hero/hero-border-collie-ball.jpg',
  beachPuppy: '/images/hero/main-hero.jpg',
  corgiWithSmallDogRun: '/images/hero/hero-corgi-terrier-duo.jpg',
} as const;

/** 포메(갈색)·골든·비글 야외 — 한 견종 키당 로컬 1슬롯 */
export const LOCAL_BREED_REPRESENTATIVE = {
  pomeranian: '/images/stock/stock-pomeranian-outdoor.jpg',
  goldenRetriever: '/images/stock/stock-golden-path.jpg',
  beagle: '/images/stock/stock-beagle-red-collar.jpg',
} as const;

/** 뽀삐: 흰 스피츠형(이전 대표) — 포메 대표와 다른 파일 */
export const LOCAL_BREED_ALTERNATE = {
  pomeranianSpitzWhite: '/images/stock/stock-white-spitz-grass.jpg',
} as const;

export const LOCAL_WELSH_CORGI_SCENE = {
  runWithSmallDog: LOCAL_HERO.corgiWithSmallDogRun,
  twoCorgisSmiling: '/images/stock/stock-corgi-duo-smile.jpg',
  /** 단독 달리기(무료 Unsplash — 사용자 프리미엄 ID는 CDN 404) */
  runningSolo: '/images/stock/stock-welsh-corgi-running.jpg',
} as const;

/** 모임 목록 키별 — 견종 대표 경로와 파일 겹침 없음 */
export const LOCAL_MEETUP_SCENE = {
  walkPairLake: '/images/stock/stock-two-dogs-lake-log.jpg',
  socialPuppies: '/images/stock/stock-aussie-puppies-litter.jpg',
  dachshundBeach: '/images/stock/stock-dachshund-beach.jpg',
  smallCuteCavalier: '/images/stock/stock-cavalier-grass.jpg',
  groupWalkPark: '/images/stock/stock-five-dogs-park-log.jpg',
  indoorBeagleSofa: '/images/stock/stock-beagle-sofa-indoor.jpg',
} as const;

export const LOCAL_SMALL_BREED_EXTRA = {
  yorkieBall: '/images/stock/stock-yorkie-kong-ball.jpg',
  chihuahuaPortrait: '/images/stock/stock-chihuahua-longhair.jpg',
  goldenPuppiesRow: '/images/stock/stock-golden-puppies-row.jpg',
} as const;

/**
 * 하위 호환: 기존 `LOCAL_STOCK.*` import.
 */
export const LOCAL_STOCK = {
  whiteSpitzGrass: LOCAL_BREED_ALTERNATE.pomeranianSpitzWhite,
  beagleRedCollar: LOCAL_BREED_REPRESENTATIVE.beagle,
  yorkieKongBall: LOCAL_SMALL_BREED_EXTRA.yorkieBall,
  goldenPath: LOCAL_BREED_REPRESENTATIVE.goldenRetriever,
  dachshundBeach: LOCAL_MEETUP_SCENE.dachshundBeach,
  aussiePuppiesLitter: LOCAL_MEETUP_SCENE.socialPuppies,
  goldenPuppiesRow: LOCAL_SMALL_BREED_EXTRA.goldenPuppiesRow,
  cavalierGrass: LOCAL_MEETUP_SCENE.smallCuteCavalier,
  chihuahuaLonghair: LOCAL_SMALL_BREED_EXTRA.chihuahuaPortrait,
  twoDogsLakeLog: LOCAL_MEETUP_SCENE.walkPairLake,
  fiveDogsParkLog: LOCAL_MEETUP_SCENE.groupWalkPark,
  corgiDuoSmile: LOCAL_WELSH_CORGI_SCENE.twoCorgisSmiling,
} as const;
