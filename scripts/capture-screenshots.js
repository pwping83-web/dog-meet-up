/**
 * 로컬 dev 서버(기본 http://localhost:5173)의 주요 화면을 모바일 뷰포트로 캡처합니다.
 *
 * 사용: 터미널 1에서 `npm run dev` 실행 후, 터미널 2에서 `npm run capture`
 *
 * 최초 1회: Chromium 설치 — `npx playwright install chromium`
 *
 * 환경 변수:
 *   CAPTURE_BASE_URL — 기본 http://localhost:5173
 *   CAPTURE_PATHS    — 쉼표로 구분된 경로 목록 (미설정 시 아래 기본값)
 *
 * 기본 캡처 경로는 홈·탐색·돌봄·마이 + 검색·글쓰기·프로필 편집 등입니다.
 * (CAPTURE_PATHS 로 덮어쓰기 가능)
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, devices } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, '__screenshots__');

const BASE_URL = (process.env.CAPTURE_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');

const DEFAULT_PATHS = [
  '/',
  '/explore',
  '/sitters',
  '/my',
  '/search',
  '/create-meetup',
  '/profile/edit',
  '/chats',
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
    ...devices['iPhone 13'],
    locale: 'ko-KR',
  });

  const page = await context.newPage();
  const failures = [];

  for (const routePath of routes) {
    const url = `${BASE_URL}${routePath}`;
    const outFile = path.join(OUT_DIR, `${slugForPath(routePath)}.png`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
      // 전체 페이지 캡처 전 레이아웃·이미지 안정화 (~2초, waitForTimeout 과 동일 목적)
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: outFile, fullPage: true });
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
