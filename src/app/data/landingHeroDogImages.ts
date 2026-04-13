/**
 * 랜딩 히어로(뽀삐·초코·보리·콩이) — 견종 고정 URL + 초코·콩이만 선명도·로드 실패 대비 보조 컷.
 */
import { BREED_STOCK_PHOTO_UNSPLASH, MEETUP_LIST_COVER_PHOTOS } from './breedStockPhotos';

export const landingHeroDogImgChains = {
  ppori: [BREED_STOCK_PHOTO_UNSPLASH.pomeranian],
  /** 웰시코기: 해변 코기(선명) → 견종 스톡 */
  choco: [MEETUP_LIST_COVER_PHOTOS.walkOutdoor, BREED_STOCK_PHOTO_UNSPLASH.welshCorgi],
  bori: [BREED_STOCK_PHOTO_UNSPLASH.goldenRetriever],
  /** 비글: 견종 스톡 → 밝은 소형견 컷 폴백 */
  kong: [BREED_STOCK_PHOTO_UNSPLASH.beagle, MEETUP_LIST_COVER_PHOTOS.smallCute],
} as const;
