# 자동 커밋·푸시 (버튼 없이)

`hooks.json`에서 아래 이벤트마다 `.cursor/hooks/git-auto-push.mjs`가 실행됩니다.

| 이벤트 | 언제 |
|--------|------|
| **`stop`** | 에이전트 턴이 끝날 때 |
| **`subagentStop`** | 서브에이전트(Task)가 끝날 때 |
| **`sessionEnd`** | 채팅 세션을 닫을 때 |
| **`afterAgentResponse`** | 에이전트가 답을 보낸 직후(턴 끝 전에도 한 번 시도) |

- stdin의 `status`가 **취소/실패**(cancelled, error, aborted 등)가 아니고
- Git 작업 트리에 **변경이 있을 때만**  
  `npm run git:push`와 같이 **전부 스테이징 → 커밋 → 현재 브랜치로 push** 합니다.

## Cursor에서 꼭 할 일 (안 되면 여기부터)

1. **설정 → Cursor Settings → Hooks**(또는 **기능 → Hooks**)에서 **프로젝트 훅**이 켜져 있는지 확인합니다.
2. 이 저장소를 연 채로 **Cursor를 한 번 재시작**하면 훅이 잘 읽힙니다.
3. **출력(Output)** 패널에서 채널을 **Hooks**로 바꿔, 훅 실행·오류 로그가 찍히는지 봅니다.
4. PC에 **`node`**가 PATH에 있어야 합니다 (`node -v`로 확인).

### 에이전트/터미널마다 “승인” 누르기 싫을 때

- **Cursor IDE**: 설정에서 `auto run` / `agent` / `terminal` 관련 항목을 검색해, 이 저장소에 대해 **자동 실행·신뢰**에 가깝게 맞춥니다. (버전마다 메뉴 이름이 다릅니다.)
- **Cursor CLI**만 쓰는 경우: `~/.cursor/cli-config.json`의 **`approvalMode`**를 `"unrestricted"`로 두면 도구 승인 없이 진행됩니다. **보안상 본인 PC·신뢰 프로젝트에서만** 사용하세요.

## 터미널에 켜두기 (훅과 별도)

에이전트 없이 파일만 고칠 때도 자동으로 올리려면, 프로젝트 루트에서:

```bash
npm run watch:push
```

기본 **45초마다** 변경이 있으면 `git add` → 커밋 → `push` 합니다. 간격은 `WATCH_PUSH_INTERVAL_MS=30000` 처럼 환경 변수로 바꿀 수 있습니다. **Ctrl+C**로 끕니다.

## 비활성화

1. 프로젝트에 빈 파일 생성: **`.cursor/disable-auto-push`**
2. 또는 환경 변수 **`CURSOR_DISABLE_AUTO_PUSH=1`** (Cursor에서 터미널/훅에 넣는 방법은 환경에 따름)

## 확인

Cursor **설정 → Hooks** 에서 이 프로젝트 훅이 등록됐는지, **출력 → Hooks** 로그에 실행 기록이 있는지 확인하세요. 훅을 켠 뒤에는 **Cursor 재시작**이 필요할 수 있습니다.

## 주의

- **원하지 않는 커밋**이 생길 수 있으니, 중요한 작업 전에는 `disable-auto-push`로 끄세요.
- **`.env` 등 비밀 파일**은 `.gitignore`에 반드시 두세요 (훅은 막지 않습니다).
- Vercel과 GitHub가 연결돼 있으면 **push 후 자동 배포**까지 이어집니다.
