/**
 * 랜딩 히어로(뽀삐·초코·보리·콩이) — `breedStockPhotos` 견종 고정 URL.
 */
import { BREED_STOCK_PHOTO_UNSPLASH } from './breedStockPhotos';

export const landingHeroDogImgChains = {
  ppori: [BREED_STOCK_PHOTO_UNSPLASH.pomeranian],
  choco: [BREED_STOCK_PHOTO_UNSPLASH.welshCorgi],
  bori: [BREED_STOCK_PHOTO_UNSPLASH.goldenRetriever],
  kong: [BREED_STOCK_PHOTO_UNSPLASH.beagle],
} as const;
