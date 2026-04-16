/**
 * Play 스토어·스토어용 화면 캡처 (모바일 세로 뷰포트).
 *
 * 로컬: 터미널 1에서 `npm run dev` 후
 *   node scripts/capture-screenshots.js
 *
 * 프로덕션 URL로 바로 캡처(배포본 기준):
 *   node scripts/capture-screenshots.js --base https://daengdaengmarket.shop
 *   npm run capture:play-store
 *
 * 최초 1회: `npm run capture:browsers` (Chromium)
 *
 * 환경 변수:
 *   CAPTURE_BASE_URL — 기본 http://localhost:5173
 *   CAPTURE_PATHS    — 쉼표로 구분된 경로 (미설정 시 기본 Play용 목록)
 *   CAPTURE_FULL_PAGE — true면 전체 페이지 스크롤 캡처 (기본 false, 스토어 권장 1화면)
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, '__screenshots__');

function parseArgs(argv) {
  let baseFromArg;
  let fullPageFromArg;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--base' && argv[i + 1]) {
      baseFromArg = argv[++i].replace(/\/$/, '');
    }
    if (argv[i] === '--full-page') fullPageFromArg = true;
  }
  return { baseFromArg, fullPageFromArg };
}

const { baseFromArg, fullPageFromArg } = parseArgs(process.argv);

const BASE_URL = (
  baseFromArg ||
  process.env.CAPTURE_BASE_URL ||
  'http://localhost:5173'
).replace(/\/$/, '');

const FULL_PAGE =
  fullPageFromArg === true ||
  process.env.CAPTURE_FULL_PAGE === '1' ||
  process.env.CAPTURE_FULL_PAGE === 'true';

/** Google Play 휴대전화 스크린샷용 세로 비율 (짧은 변 최소 320px, 권장 품질) */
const PLAY_VIEWPORT = { width: 1080, height: 1920 };
const PLAY_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const DEFAULT_PATHS = [
  '/',
  '/explore',
  '/sitters',
  '/sitters?view=care&care=need',
  '/search',
  '/create-meetup',
  '/chats',
  '/my',
  '/profile/edit',
  '/customer-service',
  '/login',
];

const PATHS = (process.env.CAPTURE_PATHS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const routes = (PATHS.length ? PATHS : DEFAULT_PATHS).map((p) => (p.startsWith('/') ? p : `/${p}`));

function slugForPath(routePath) {
  if (routePath === '/') return 'home';
  return routePath.replace(/^\//, '').replace(/[/:?&=]/g, '_');
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: PLAY_VIEWPORT,
    deviceScaleFactor: 1,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    userAgent: PLAY_USER_AGENT,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  const failures = [];

  for (const routePath of routes) {
    const url = `${BASE_URL}${routePath}`;
    const outFile = path.join(OUT_DIR, `${slugForPath(routePath)}.png`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 2500));
      await page.screenshot({ path: outFile, fullPage: FULL_PAGE });
      console.log(`OK  ${url} -> ${path.relative(ROOT, outFile)}`);
    } catch (e) {
      console.error(`FAIL ${url}`, e.message || e);
      failures.push({ url, error: String(e.message || e) });
    }
  }

  await browser.close();

  if (failures.length) {
    const report = path.join(OUT_DIR, 'capture-errors.json');
    await writeFile(report, JSON.stringify({ failures, baseUrl: BASE_URL }, null, 2), 'utf8');
    console.error(`\n일부 실패. 상세: ${path.relative(ROOT, report)}`);
    process.exit(1);
  }

  console.log(`\n완료: ${OUT_DIR}`);
  console.log(`BASE_URL=${BASE_URL}  fullPage=${FULL_PAGE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
