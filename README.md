# 댕댕마켓 (Dog Meet-up)

반려견 견주를 위한 **지역 기반 커뮤니티·돌봄 연결** 웹앱입니다. 당근마켓식 모바일 UI에 **모이자·만나자·돌봄 맡기기**, **인증 보호맘**(Supabase + 운영자 인증 + Stripe), 반려견 프로필·MBTI 등을 담습니다.

**English:** A mobile-first PWA for Korean dog owners: meetups, care requests, verified “guard mom” sitters (DB-backed with RLS and admin certification), and community features.

---

## 주요 기능

| 영역 | 설명 |
|------|------|
| **모이자·만나자** | 소모임·1:1·교배·실종 등 카테고리 글 작성·탐색·상세·참여(데모 데이터 + 로컬 저장 글). |
| **인증 돌봄** | `/sitters` — 댕집사(목업 카드), **인증 보호맘**(DB), 맡기는 사람(돌봄 글) 탭. |
| **보호맘** | 등록·상세·예약·결제, 관리자 RPC로 `certified_at` 인증. |
| **회원** | Supabase Auth(카카오 등), 마이페이지·프로필·탈퇴. |
| **결제** | Stripe Checkout + Webhook(Edge Functions). |
| **AI 도우미** | Edge Function `daeng-ai-assist` — 글 초안 등(로그인 후). Secret **`GROQ_API_KEY`**(우선, Groq) 또는 **`GEMINI_API_KEY`**(Gemini). |

---

## 기술 스택

- **프론트:** React 18, React Router 7, Vite, TypeScript, Tailwind CSS v4, PWA (`vite-plugin-pwa`)
- **백엔드:** Supabase (PostgreSQL, Auth, Row Level Security, Edge Functions)
- **결제:** Stripe
- **기타:** EmailJS(문의 등), `date-fns`(한국어 로케일)

---

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` — 탐색(`/explore`), 글 올리기(`/create-meetup`), 인증 돌봄(`/sitters?view=care&care=guard`) 등.

```bash
npm run build
npm run preview
```

---

## Supabase·배포

- 마이그레이션: `supabase/migrations/`
- 대시보드에서 한 번에 실행할 SQL 예시: `sql/run-in-dashboard.sql`, `sql/apply-guard-mom-admin-once.sql`
- Stripe 등: `supabase/functions/` 아래 함수 배포 + 대시보드 Secrets
- CLI 예시: `npm run supabase:link` 후 `npx supabase db push` / `npx supabase functions deploy …`

### AI 도우미 (`daeng-ai-assist`) — 운영에서 막힐 때

앱에서 **「Failed to send a request to the Edge Function」** 이 나오면, 거의 항상 **해당 프로젝트에 함수가 없거나** Secrets가 비어 있는 경우입니다.

1. Supabase Dashboard → **Edge Functions** → `daeng-ai-assist` 가 목록에 있는지 확인 (없으면 배포 필요).
2. **Edge Functions → Secrets** 에 **`GROQ_API_KEY`**([Groq Console](https://console.groq.com/keys), `gsk_…`) 또는 **`GEMINI_API_KEY`**([AI Studio](https://aistudio.google.com/apikey), `AIza…`) 추가. **둘 다 있으면 Groq가 우선**입니다.
3. 터미널에서(프로젝트 루트, Supabase CLI 로그인·링크 후):

```bash
npx supabase secrets set GROQ_API_KEY=gsk_여기에_본인_키
npx supabase functions deploy daeng-ai-assist --use-api
```

4. `daeng-ai-assist`는 게이트 `verify_jwt=false`이고, **함수 안에서 `auth.getUser()`** 로 로그인 여부를 검사합니다(ES256 세션에서 게이트만 켤 때 401 나는 경우 대비).

---

## 저장소 구조 (요약)

```
src/app/
  routes.ts          # 라우팅
  pages/             # 화면 컴포넌트
  components/        # 공통 UI (AiDoumiButton 등)
src/lib/             # Supabase 클라이언트, 결제, AI 호출 등
supabase/
  migrations/        # SQL 마이그레이션
  functions/         # Edge Functions (Stripe, AI 등)
```

---

## 라이선스

MIT — 자유롭게 수정·배포 가능합니다.

## 크레딧

- UI는 국내 모바일 커머스/커뮤니티 사용성을 참고했습니다.
- 아이콘: Lucide React
