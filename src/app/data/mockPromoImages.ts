/**
 * 랜딩·목업 썸네일 — 모임 목록과 동일 출처의 고정 Unsplash.
 * 로컬 히어로: `public/images/hero/*.jpg` — 파일 교체 시 경로만 맞추면 됨.
 */
import { BREED_STOCK_PHOTO_UNSPLASH, MEETUP_LIST_COVER_PHOTOS } from './breedStockPhotos';

/** 랜딩 하단 배너(가로) — 활동 산책 컷 */
export const MOCK_IMG_HANGANG_HERO = '/images/hero/hero-border-collie-ball.jpg';

/** 예전 해변 강아지 히어로 — `MOCK_IMG_HANGANG_HERO`에 다시 지정 가능 */
export const MOCK_IMG_HERO_BEACH_PUPPY = '/images/hero/main-hero.jpg';

/** 초코(웰시코기) 카드 1순위 등 — 코기+소형견 함께 달리는 세로 컷 */
export const MOCK_IMG_HERO_CORGI_TERRIER_DUO = '/images/hero/hero-corgi-terrier-duo.jpg';

export const MOCK_IMG_HANGANG_LARGE_WALK = MEETUP_LIST_COVER_PHOTOS.largeDog;

export const MOCK_IMG_DOLBOM_MALTESE_TRIP = BREED_STOCK_PHOTO_UNSPLASH.maltese;

export const MOCK_IMG_LANDING_PPORI = BREED_STOCK_PHOTO_UNSPLASH.pomeranian;

export const MOCK_IMG_LANDING_BORI = BREED_STOCK_PHOTO_UNSPLASH.goldenRetriever;
