/**
 * 랜딩·목업 썸네일 — `localStockPhotos` 역할별 그룹만 참조.
 */
import { BREED_STOCK_PHOTO_UNSPLASH, MEETUP_LIST_COVER_PHOTOS } from './breedStockPhotos';
import {
  LOCAL_BREED_REPRESENTATIVE,
  LOCAL_HERO,
  LOCAL_MEETUP_SCENE,
  LOCAL_SMALL_BREED_EXTRA,
  LOCAL_WELSH_CORGI_SCENE,
} from './localStockPhotos';

/** 랜딩 하단 배너(가로) — 보더콜리 활동 컷 */
export const MOCK_IMG_HANGANG_HERO = LOCAL_HERO.hangangBanner;

/** 해변 강아지 — 배너 교체 후보 */
export const MOCK_IMG_HERO_BEACH_PUPPY = LOCAL_HERO.beachPuppy;

/** 초코(웰시코기) 카드 1순위 — 코기+소형견 달리기 */
export const MOCK_IMG_HERO_CORGI_TERRIER_DUO = LOCAL_WELSH_CORGI_SCENE.runWithSmallDog;

export const MOCK_IMG_HANGANG_LARGE_WALK = MEETUP_LIST_COVER_PHOTOS.largeDog;

export const MOCK_IMG_DOLBOM_MALTESE_TRIP = BREED_STOCK_PHOTO_UNSPLASH.maltese;

export const MOCK_IMG_LANDING_PPORI = LOCAL_BREED_REPRESENTATIVE.pomeranian;

export const MOCK_IMG_LANDING_BORI = LOCAL_BREED_REPRESENTATIVE.goldenRetriever;

/** 목업·다른 화면 보조 (견종 6종 풀 밖 소형·사회화 컷) */
export const MOCK_IMG_STOCK_YORKIE = LOCAL_SMALL_BREED_EXTRA.yorkieBall;
export const MOCK_IMG_STOCK_CHIHUAHUA = LOCAL_SMALL_BREED_EXTRA.chihuahuaPortrait;
export const MOCK_IMG_STOCK_AUSSIE_PUPPIES = LOCAL_MEETUP_SCENE.socialPuppies;
