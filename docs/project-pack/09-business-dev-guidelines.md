# 09 — 비즈니스·아키텍처 개발 가이드라인

> **목적:** 댕댕마켓 코드 작성·리팩터링·DB 설계 시 공통으로 지켜야 할 **비즈니스 원칙**과 **기술 경계**를 한곳에 둡니다.  
> Cursor·인수인계·PR 리뷰 시 이 문서를 1차 기준으로 삼습니다.

---

## 1. 수익화 모델 임시 홀드 (Promo Mode 우선)

### 원칙

- **콜드스타트** 단계에서는 **유저·공급자 유입이 최우선**. Stripe·유료 노출 RLS는 **삭제하지 않고**, 기본 동작은 **무료 프로모션 우회**로 둔다.
- 유/무료는 **환경 변수·(필요 시) DB 플래그**로 전환 가능해야 하며, “무료 = 코드 제거”가 되어서는 안 된다.

### 현재 구현 기준점

| 구분 | 위치 | 비고 |
|------|------|------|
| 클라이언트 무료 락 | `src/lib/promoFlags.ts` → `isPromoFreeListings()` | `VITE_PROMO_FREE_LISTINGS` 미설정·빈 값 = **무료** |
| 유료 전환 | 동일 env를 `false`/`0` + **RLS 마이그레이션 복원** | 예: `20260415100001_paid_guard_mom_listing_select.sql` |
| 결제 UI | `BillingPage`, `CreateRequestPage`, `meetupPublicVisibility` 등 | `isPromoFreeListings()` 분기 유지 |

### 개발 시 할 일

- 새 유료 게이트를 넣을 때도 **동일 플래그(또는 확장 플래그)** 와 짝을 지을 것.
- 프로덕션 배포 전 **`.env`에 실수로 유료만 켜지지 않았는지** 확인(체크리스트는 `08-bm-monetization-strategy.md`).

---

## 2. 하이퍼로컬(Hyper-local) 지역 기반 타겟팅

### 원칙

- 전국 피드가 아니라 **동·구 단위**에서 먼저 밀도를 쌓는 전제로 설계한다.
- 모이자·만나자·돌봄 글과 **인증 보호맘** 목록은 **지역 필터가 쿼리 최우선**이 되도록 인덱스·RLS·API를 맞춘다.

### 프론트·제품 (현재)

- 사용자 동네: `UserLocationContext`, 지역 선택·GPS 등 — 하이퍼로컬 실험 시 **기본 반경·행정구역**을 좁히는 UI/설정과 연동.

### DB·Supabase (권장 방향)

- 글이 **DB 테이블**로 옮겨질 때(또는 이미 있는 경우):
  - **`region_gu` / `region_si` / 행정코드** 등 필터 컬럼을 명시하고, **목록 쿼리의 `WHERE` 첫 축**으로 사용.
  - 복합 인덱스 예: `(district 또는 region_gu, created_at DESC)`, 필요 시 `(user_id, …)`.
- **좌표 기반**이 필요해지면:
  - **PostGIS**(`geometry`/`geography`, `ST_DWithin`) 확장 도입을 **별도 마이그레이션**으로 검토(의존성·백업·RLS 영향 분리).
  - 당장 PostGIS 없이도 **구 단위 문자열 + 인덱스**만으로도 1단계 하이퍼로컬은 가능.

### 마이그레이션

- 지역 컬럼 추가·인덱스는 반드시 `supabase/migrations/`에 타임스탬프 파일로 남긴다(아래 §4).

---

## 3. 인증 보호맘 — 관리자 검증 로직 고도화

### 원칙

- **오프라인 검증**(신분·주거·자격 등) 후 승인/반려를 반영할 수 있게 **상태값을 세분화**한다.
- 기존 **`certified_at` + 관리자 RPC** 패턴은 유지하되, 최종 “공개 목록 노출”과 연동되는 규칙을 **명시적 상태**와 일치시킨다.

### 현재 구현 기준점

- 테이블: `public.certified_guard_moms` (`certified_at` 등).
- 관리자 갱신: `admin_set_guard_mom_certified` RPC (`SECURITY DEFINER`, RLS 우회) — `supabase/migrations/20260416140000_admin_set_guard_mom_certified_rpc.sql` 등.

### 권장 스키마 방향 (향후 마이그레이션)

- `verification_status` **ENUM** (또는 `text` + check): 예) `PENDING` | `APPROVED` | `REJECTED` (필요 시 `SUSPENDED`).
- 의미 정리 예:
  - **APPROVED** + `certified_at IS NOT NULL` → 목록·피드 노출(프로모/유료 RLS와 조합).
  - **PENDING** → 본인/관리자만 조회 또는 제한적 노출(정책에 맞게 RLS).
  - **REJECTED** → 공개 노출 금지, 사유·일시 컬럼은 선택.
- **관리자 대시보드**(`AdminPage` 등): 상태별 필터·일괄 작업·감사 로그(선택)를 고려.

### RPC

- 기존 RPC를 **확장**하거나, 상태 전용 RPC를 추가할 때도 **마이그레이션 파일**로만 배포하고, 트리거가 `certified_at`을 덮어쓰는지 반드시 검증한다.

---

## 4. 기술 스택 무결성 및 마이그레이션 엄수

### 고정 스택

- **클라이언트:** React + Vite + TypeScript + Tailwind, **PWA**.
- **백엔드:** Supabase — Auth, PostgreSQL, **RLS**, Edge Functions.
- **결제(옵션):** Stripe(Webhook 등) — Promo Mode에서 경로는 살리되 기본은 우회.

이 스택을 **임의로 바꾸는 제안**(예: 백엔드 전면 교체)은 별도 의사결정 없이 진행하지 않는다.

### 마이그레이션 규칙

- **새 테이블·컬럼·인덱스·RLS·RPC·트리거** 변경은 전부 **`supabase/migrations/`** 에 `YYYYMMDDHHMMSS_description.sql` 형태로 추가.
- 로컬·스테이징·프로덕션 **적용 순서**를 README 또는 `04-ops-and-deployment.md`와 맞출 것.
- RLS 정책은 **프로모 무료 / 유료** 두 버전이 공존할 수 있으므로, 파일명·주석에 의도를 남긴다(기존 `promo_free_*` / `paid_*` 패턴 참고).

---

## 5. 관련 문서

| 문서 | 내용 |
|------|------|
| `08-bm-monetization-strategy.md` | 초기 무료·유료 전환 BM 메모 |
| `04-ops-and-deployment.md` | 배포·Secrets·마이그레이션 |
| `지원사업용_프로젝트_요약서.md` | 사업·기능 요약 |

---

*이 가이드는 제품·법무·운영 정책이 바뀌면 함께 갱신합니다.*
