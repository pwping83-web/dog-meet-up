#!/usr/bin/env node
/**
 * 변경분을 모두 스테이징 → 커밋 → 현재 브랜치로 push
 * 사용: npm run git:push -- "커밋 메시지"
 * 메시지 생략 시: chore: update
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

if (!existsSync(join(root, '.git'))) {
  console.error('이 폴더는 git 저장소가 아닙니다. 먼저 git init 후 원격을 설정하세요.');
  process.exit(1);
}

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', cwd: root, ...opts });
}

const messageFromArgs = process.argv.slice(2).join(' ').trim();
const message = messageFromArgs || 'chore: update';

run('git add -A');

let hasStaged = false;
try {
  execSync('git diff --cached --quiet', { cwd: root, stdio: 'ignore' });
} catch {
  hasStaged = true;
}

if (!hasStaged) {
  console.log('커밋할 변경이 없습니다. push만 시도합니다.');
  try {
    run('git push');
  } catch {
    process.exit(1);
  }
  process.exit(0);
}

run(`git commit -m ${JSON.stringify(message)}`);
run('git push');
