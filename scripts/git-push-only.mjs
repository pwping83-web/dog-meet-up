#!/usr/bin/env node
/**
 * 현재 브랜치만 push (커밋 훅용)
 * 실패해도 exit 0 — 커밋 자체는 이미 완료된 상태이므로 훅이 막지 않음
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

if (!existsSync(join(root, '.git'))) {
  process.exit(0);
}

try {
  execSync('git push', { cwd: root, stdio: 'inherit' });
} catch {
  console.error('[git-push-only] push 실패 — 원격(upstream)과 네트워크를 확인하세요.');
  process.exit(0);
}
