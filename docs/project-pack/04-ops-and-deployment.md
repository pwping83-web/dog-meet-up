# 04 — 배포·운영·Secrets 체크리스트

## 4.1 프론트 (Vite)

```bash
npm install
npm run build
```

- 배포 호스트(Vercel/Netlify/정적 S3 등)에 **`VITE_SUPABASE_*`** 환경 변수 설정.
- 빌드 산출물이 **어느 Supabase 프로젝트**를 바라보는지 문서화(프로덕션 ref).

## 4.2 Supabase

- **마이그레이션:** `supabase/migrations/` — 새 환경에는 `db push` 또는 Dashboard SQL.
- **일괄 SQL 예시:** `sql/run-in-dashboard.sql`, `sql/apply-guard-mom-admin-once.sql` — 실행 전 백업.
- **Edge Functions:** `supabase/functions/` — `config.toml`의 `verify_jwt` 함수별 확인.
- **Secrets:** Stripe, `GROQ_API_KEY` / `GEMINI_API_KEY`, Webhook secret 등 — Dashboard와 CLI `secrets set` 동기화.

## 4.3 배포 순서 (AI 도우미 포함)

1. DB 마이그레이션 적용  
2. Secrets 설정  
3. `npx supabase functions deploy <이름> --use-api`  
4. 프론트 빌드·배포  
5. 브라우저에서 로그인 → 기능 스모크 테스트

## 4.4 모니터링

- Supabase **Logs**(Auth, Edge, API).  
- Stripe **Dashboard** 이벤트·Webhook 실패.  
- 클라이언트 에러: 브라우저 콘솔 + 네트워크 탭.

## 4.5 백업·복구

- 정기 **DB 백업**(Supabase 플랜에 따름).  
- 마이그레이션은 Git에만 두지 말고, 운영 적용 일자 기록.

---

*프로젝트 ref·도메인은 공개 저장소에 쓰지 말고 내부 위키나 비공개 메모에만 적습니다.*
