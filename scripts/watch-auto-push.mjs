#!/usr/bin/env node
/**
 * 주기적으로 git 변경을 감지해 커밋·푸시합니다.
 * 사용: npm run watch:push
 * 터미널 탭 하나에 켜두면 에이전트 없이 직접 수정할 때도 버튼 없이 올라갑니다. Ctrl+C 로 중지.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const INTERVAL_MS = Number(process.env.WATCH_PUSH_INTERVAL_MS) || 45_000;

const disableFile = join(root, '.cursor', 'disable-auto-push');
if (existsSync(disableFile) || process.env.CURSOR_DISABLE_AUTO_PUSH === '1') {
  console.error('[watch-auto-push] 비활성화됨 (.cursor/disable-auto-push 또는 CURSOR_DISABLE_AUTO_PUSH=1)');
  process.exit(0);
}

if (!existsSync(join(root, '.git'))) {
  console.error('[watch-auto-push] git 저장소가 아닙니다.');
  process.exit(1);
}

function isDirty() {
  try {
    const o = execFileSync('git', ['status', '--porcelain'], {
      cwd: root,
      encoding: 'utf8',
    });
    return o.trim().length > 0;
  } catch {
    return false;
  }
}

function runPush() {
  const msg = `chore: watch sync ${new Date().toISOString().slice(0, 19)}`;
  try {
    execFileSync(process.execPath, ['scripts/git-commit-push.mjs', msg], {
      cwd: root,
      stdio: 'inherit',
    });
  } catch {
    /* git-commit-push가 실패해도 다음 주기에 재시도 */
  }
}

console.log(`[watch-auto-push] ${INTERVAL_MS / 1000}초마다 확인합니다. 중지: Ctrl+C`);
setInterval(() => {
  if (isDirty()) runPush();
}, INTERVAL_MS);
