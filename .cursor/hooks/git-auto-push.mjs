#!/usr/bin/env node
/**
 * Cursor 훅 (`stop` | `subagentStop` | `sessionEnd`): 변경이 있으면 커밋 + 푸시합니다.
 * - `stop`: 에이전트 턴 종료
 * - `subagentStop`: 서브에이전트(Task) 종료
 * - `sessionEnd`: 채팅 세션 종료(창 닫기 등)
 * 비활성화: 프로젝트 루트에 빈 파일 `.cursor/disable-auto-push` 생성
 * 또는 환경 변수 CURSOR_DISABLE_AUTO_PUSH=1
 *
 * stdout에는 반드시 JSON 한 줄만 출력합니다 (훅 프로토콜).
 */
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');

function out(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

let input = '';
try {
  input = readFileSync(0, 'utf8');
} catch {
  input = '';
}

let status = 'completed';
try {
  const j = JSON.parse(input || '{}');
  if (j.status != null && String(j.status).length > 0) status = String(j.status);
} catch {
  /* ignore */
}

const disableFile = join(projectRoot, '.cursor', 'disable-auto-push');
if (existsSync(disableFile) || process.env.CURSOR_DISABLE_AUTO_PUSH === '1') {
  out({});
  process.exit(0);
}

/* 훅마다 status 문자열이 다름. 취소·실패만 스킵하고 나머지는 푸시 시도 */
const skipPush = new Set(
  ['cancelled', 'canceled', 'error', 'aborted', 'failed', 'rejected'].map((s) => s.toLowerCase()),
);
if (skipPush.has(status.toLowerCase())) {
  out({});
  process.exit(0);
}

if (!existsSync(join(projectRoot, '.git'))) {
  out({});
  process.exit(0);
}

let dirty = true;
try {
  const porcelain = execFileSync('git', ['status', '--porcelain'], {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  dirty = porcelain.length > 0;
} catch {
  out({});
  process.exit(0);
}

if (!dirty) {
  out({});
  process.exit(0);
}

const msg = `chore: agent sync ${new Date().toISOString().slice(0, 19)}`;

try {
  const stdout = execFileSync(process.execPath, ['scripts/git-commit-push.mjs', msg], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
  if (stdout) process.stderr.write(stdout);
} catch (e) {
  let detail = String(e);
  if (e && typeof e === 'object' && 'stderr' in e) {
    const se = /** @type {{ stderr?: Buffer }} */ (e).stderr;
    detail = Buffer.isBuffer(se) ? se.toString('utf8') : String(se ?? detail);
  }
  process.stderr.write(`[git-auto-push] ${detail}\n`);
}

out({});
