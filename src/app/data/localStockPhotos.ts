/**
 * `public/images` 번들 사진 — 역할별로만 참조해 견종·용도가 겹치지 않게 함.
 *
 * - `LOCAL_HERO`: 랜딩 배너·탐색 강조(복수 견종/활동 컷 포함 가능)
 * - `LOCAL_BREED_REPRESENTATIVE`: 앱 6견종 중 **로컬로 둘 수 있는 대표 샷**(한 파일 = 한 견종 슬롯)
 * - `LOCAL_WELSH_CORGI_SCENE`: 웰시코기 캐릭터용(단독 샷은 Unsplash `breedStockPhotos` 유지)
 * - `LOCAL_MEETUP_SCENE`: 모임 썸네일용 **테마** (위 견종 대표 파일과 경로 중복 없음)
 * - `LOCAL_SMALL_BREED_EXTRA`: 품종 6종에 없는 소형견 컷 — 폴백·목업 보조만
 */
export const LOCAL_HERO = {
  hangangBanner: '/images/hero/hero-border-collie-ball.jpg',
  beachPuppy: '/images/hero/main-hero.jpg',
  corgiWithSmallDogRun: '/images/hero/hero-corgi-terrier-duo.jpg',
} as const;

/** 포메·골든·비글 — 로컬 단독(또는 품종 명확) 대표 컷 */
export const LOCAL_BREED_REPRESENTATIVE = {
  pomeranian: '/images/stock/stock-white-spitz-grass.jpg',
  goldenRetriever: '/images/stock/stock-golden-path.jpg',
  beagle: '/images/stock/stock-beagle-red-collar.jpg',
} as const;

export const LOCAL_WELSH_CORGI_SCENE = {
  runWithSmallDog: LOCAL_HERO.corgiWithSmallDogRun,
  twoCorgisSmiling: '/images/stock/stock-corgi-duo-smile.jpg',
} as const;

/** 모임 목록 키별 — 견종 대표(`LOCAL_BREED_REPRESENTATIVE`)와 파일 겹침 없음 */
export const LOCAL_MEETUP_SCENE = {
  walkPairLake: '/images/stock/stock-two-dogs-lake-log.jpg',
  socialPuppies: '/images/stock/stock-aussie-puppies-litter.jpg',
  dachshundBeach: '/images/stock/stock-dachshund-beach.jpg',
  smallCuteCavalier: '/images/stock/stock-cavalier-grass.jpg',
  groupWalkPark: '/images/stock/stock-five-dogs-park-log.jpg',
} as const;

/** 요크셔·치와와·골든 새끼 줄 — 콩이 폴백·프로모 등 보조 */
export const LOCAL_SMALL_BREED_EXTRA = {
  yorkieBall: '/images/stock/stock-yorkie-kong-ball.jpg',
  chihuahuaPortrait: '/images/stock/stock-chihuahua-longhair.jpg',
  goldenPuppiesRow: '/images/stock/stock-golden-puppies-row.jpg',
} as const;

/**
 * 하위 호환: 기존 `LOCAL_STOCK.*` import — 내부적으로 위 그룹에 매핑.
 * 새 코드는 `LOCAL_MEETUP_SCENE` / `LOCAL_BREED_REPRESENTATIVE` 등을 직접 쓰는 것을 권장.
 */
export const LOCAL_STOCK = {
  whiteSpitzGrass: LOCAL_BREED_REPRESENTATIVE.pomeranian,
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
