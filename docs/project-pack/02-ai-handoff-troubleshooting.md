# 02 — 다른 AI에게 문제 발생 시 전달할 내용 (인수인계·디버깅 패킹)

아래 블록을 **통째로 복사**해 새 대화 첫 메시지에 붙이고, 그 아래에 **증상·URL·스크린샷·재현 순서**를 적으면 됩니다.

---

## A. 프로젝트 정체 (복사용)

- **이름:** 댕댕마켓 (Dog Meet-up) — 반려견 지역 커뮤니티·돌봄 연결 웹앱(PWA).
- **저장소 루트:** `Dog meet-up` (Windows 경로 예: `d:\Dog meet-up`).
- **프론트:** Vite + React 18 + React Router 7 + TypeScript + Tailwind v4 + `vite-plugin-pwa`.
- **백엔드:** Supabase — PostgreSQL, Auth(JWT), Row Level Security, Edge Functions(Deno).
- **결제:** Stripe — Edge Functions `create-checkout-session`, `stripe-webhook` 등(실제 이름은 `supabase/functions/` 확인).
- **AI:** Edge Function `daeng-ai-assist` — Secrets `GROQ_API_KEY`(우선) 또는 `GEMINI_API_KEY`. 게이트 `verify_jwt = false`, **함수 내부**에서 `createClient` + 요청 `Authorization`·`apikey`로 `auth.getUser()` 검증.
- **프론트 AI 호출:** `src/lib/daengAiAssist.ts`, 버튼은 `AiDoumiButton` 등 각 페이지.
- **법적 고지 상수:** `src/lib/platformLegalCopy.ts` — 글 올리기 체크박스 등.

## B. 디렉터리 맵 (복사용)

```
src/app/pages/          # 화면
src/app/components/     # AiDoumiButton, RegionSelector 등
src/lib/                # supabase, billing, daengAiAssist, …
supabase/migrations/    # SQL 마이그레이션 (시간순 적용)
supabase/functions/     # Edge Functions 소스
supabase/config.toml    # 함수별 verify_jwt 등
sql/                    # 대시보드용 일괄 SQL 예시
docs/                   # 지원사업 요약, legal-disclaimer, project-pack
```

## C. 환경 변수 (프론트)

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — **배포 도메인의 빌드**가 운영 Supabase 프로젝트와 일치해야 함.
- Stripe·EmailJS 등 — 각 `env.example` / README 참고.

## D. 자주 나는 문제 → 조치

### D1. Edge Function `daeng-ai-assist` 실패 / `invoke` 에러

- Dashboard → Edge Functions에 **`daeng-ai-assist` 배포 여부** 확인.
- Secrets에 **`GROQ_API_KEY` 또는 `GEMINI_API_KEY`** 존재 여부.
- 배포: `npx supabase functions deploy daeng-ai-assist --use-api`
- **401:** `config.toml`에서 해당 함수 `verify_jwt = false`인지, 클라이언트가 세션 `Authorization`을 넘기는지(`daengAiAssist.ts`).
- **본문이 비어 보임:** 함수가 에러 시 **HTTP 200 + `{ ok: false, error }`** 로 내려주도록 설계됨 — 클라이언트 `alert`/`data` 확인.

### D2. 글 올리기·돌봄 폼 / 지역

- 돌봄(`kind=dolbom`)은 `CreateRequestPage.tsx`에서 **지역 블록이 폼 상단**에 옴. `meetupRegionSection`, GPS `applyGpsToFormRegion` — `UserLocationContext` 위치 기반 켜짐 여부.

### D3. RLS / 보호맘 인증

- 마이그레이션·RPC 이름 예: `admin_set_guard_mom_certified`, `certified_guard_moms`, `user_entitlements` 등 — **정확한 이름은 `supabase/migrations/` grep**.
- 관리자 판별: 카카오 메타데이터·이메일 등 마이그레이션에 정의됨 — 구버전과 충돌 시 마이그레이션 순서 확인.

### D4. Stripe

- Webhook 시크릿·가격 ID·성공 URL이 **대시보드·환경**과 코드 상수 일치 여부.
- 로컬은 Stripe CLI 또는 테스트 모드만.

## E. 작업 시 지침 (AI에게 요청할 때)

- **사용자 규칙:** 응답은 한국어 선호, 불필요한 대규모 리팩터 금지, 코드 인용은 `시작줄:끝줄:경로` 형식.
- **민감정보:** API 키·서비스 롤 키를 채팅에 붙이지 말 것. 노출 시 즉시 폐기·Secrets 재설정.

## F. 붙여 넣을 때 템플릿 (증상만 채우기)

```
[프로젝트] 댕댕마켓 — docs/project-pack/02-ai-handoff-troubleshooting.md 내용 참고.

[증상]
-

[환경]
브라우저 / 로컬 or 운영 URL:
Supabase 프로젝트 ref (공개 가능한 수준만):

[재현]
1.
2.

[기대 / 실제]
-

[이미 시도한 것]
-
```

---

*이 파일을 갱신할 때마다 README의 인덱스 설명도 맞춰 주세요.*
