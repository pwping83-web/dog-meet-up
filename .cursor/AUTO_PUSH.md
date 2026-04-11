# 에이전트 종료 시 자동 커밋·푸시

`hooks.json`의 **`stop`** 이벤트에서 `.cursor/hooks/git-auto-push.mjs`가 실행됩니다.

- 에이전트 턴이 **정상 종료(`completed`)** 되었고
- Git 작업 트리에 **변경이 있을 때만**  
  `npm run git:push`와 동일하게 **전부 스테이징 → 커밋 → 현재 브랜치로 push** 합니다.

## 비활성화

1. 프로젝트에 빈 파일 생성: **`.cursor/disable-auto-push`**
2. 또는 환경 변수 **`CURSOR_DISABLE_AUTO_PUSH=1`** (Cursor에서 터미널/훅에 넣는 방법은 환경에 따름)

## 확인

Cursor **설정 → Hooks** 에서 이 프로젝트 훅이 등록됐는지, **출력 → Hooks** 로그에 실행 기록이 있는지 확인하세요. 훅을 켠 뒤에는 **Cursor 재시작**이 필요할 수 있습니다.

## 주의

- **원하지 않는 커밋**이 생길 수 있으니, 중요한 작업 전에는 `disable-auto-push`로 끄세요.
- **`.env` 등 비밀 파일**은 `.gitignore`에 반드시 두세요 (훅은 막지 않습니다).
- Vercel과 GitHub가 연결돼 있으면 **push 후 자동 배포**까지 이어집니다.
