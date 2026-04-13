/**
 * 랜딩 히어로(뽀삐·초코·보리·콩이) — 견종·장면별로 다른 파일만 체인에 넣음.
 */
import { MOCK_IMG_HERO_CORGI_TERRIER_DUO } from './mockPromoImages';
import {
  BREED_STOCK_FALLBACK_UNSPLASH,
  BREED_STOCK_PHOTO_UNSPLASH,
  MEETUP_LIST_COVER_PHOTOS,
} from './breedStockPhotos';
import { LOCAL_BREED_REPRESENTATIVE, LOCAL_SMALL_BREED_EXTRA, LOCAL_WELSH_CORGI_SCENE } from './localStockPhotos';

export const landingHeroDogImgChains = {
  /** 흰 스피츠형 로컬 → 포메 Unsplash 폴백 */
  ppori: [LOCAL_BREED_REPRESENTATIVE.pomeranian, BREED_STOCK_FALLBACK_UNSPLASH.pomeranian],
  /** 코기+소형 달리기 → 코기 쌍 → 산책(호수) → 웰시 단독 스톡 */
  choco: [
    MOCK_IMG_HERO_CORGI_TERRIER_DUO,
    LOCAL_WELSH_CORGI_SCENE.twoCorgisSmiling,
    MEETUP_LIST_COVER_PHOTOS.walkOutdoor,
    BREED_STOCK_PHOTO_UNSPLASH.welshCorgi,
  ],
  /** 골든 산책 로컬 → 새끼 줄 → 골든 Unsplash 폴백 */
  bori: [
    LOCAL_BREED_REPRESENTATIVE.goldenRetriever,
    LOCAL_SMALL_BREED_EXTRA.goldenPuppiesRow,
    BREED_STOCK_FALLBACK_UNSPLASH.goldenRetriever,
  ],
  /** 비글 로컬 초상 → 비글 스톡 → 요크셔(소형 활동 폴백, 캐벌리어 모임 컷과 구분) */
  kong: [
    LOCAL_BREED_REPRESENTATIVE.beagle,
    BREED_STOCK_FALLBACK_UNSPLASH.beagle,
    LOCAL_SMALL_BREED_EXTRA.yorkieBall,
  ],
} as const;
