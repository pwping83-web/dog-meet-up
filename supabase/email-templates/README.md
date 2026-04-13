# 댕댕마켓 — 인증 이메일 & 네이버 SMTP (프로덕션)

레포의 HTML은 **로컬** `supabase/config.toml`과 연결되어 있고, **호스팅(supabase.com)** 에는 대시보드에 **직접 붙여넣어** 적용합니다.

## 1) 예쁜 템플릿 적용 (프로덕션)

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 → **Authentication** → **Email Templates**
2. 각 타입별로 아래 파일 내용을 **전체 복사**해 에디터에 붙여넣기  
   - **Confirm signup** → `confirmation.html`  
   - **Magic Link** → `magic_link.html`  
   - **Reset Password** → `recovery.html`
3. **Subject** 는 `config.toml`의 `subject` 문구와 맞춰도 됩니다.

템플릿 변수(Go template): `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}` 등 [공식 문서](https://supabase.com/docs/guides/auth/auth-email-templates) 참고.

## 2) `tseizou@naver.com` 으로 발송 (네이버 SMTP)

Supabase 기본 메일은 발신·도메인 제한이 있어, **프로덕션에서는 Custom SMTP** 권장.

1. Dashboard → **Project Settings** → **Auth** → **SMTP Settings** → **Enable Custom SMTP**
2. 네이버 메일에서 **2단계 인증** 후 **앱 비밀번호** 발급 (네이버 ID → 보안 → 2단계 인증 → 앱 비밀번호)
3. 대략 다음 값 입력 (네이버 안내가 우선):

| 항목 | 값 |
|------|-----|
| Host | `smtp.naver.com` |
| Port | `465` (SSL) 또는 `587` (STARTTLS) — 네이버 안내에 맞출 것 |
| Username | `tseizou@naver.com` |
| Password | (발급한 **앱 비밀번호**, 일반 로그인 비밀번호 아님) |
| Sender email | `tseizou@naver.com` |
| Sender name | `댕댕마켓` (원하는 표시 이름) |

4. **Save** 후 테스트 가입으로 메일 수신 확인.

> 비밀번호는 **절대 Git에 커밋하지 마세요.** `supabase/config.toml` 안의 SMTP 예시 블록은 주석 처리되어 있습니다. 로컬에서만 쓸 때는 환경 변수 등으로 `pass`를 주입하세요.

## 3) 로컬 개발 (`supabase start`)

이 저장소의 `supabase/config.toml`에 템플릿 경로가 이미 연결되어 있습니다. SMTP는 주석 해제 후 `pass`만 안전하게 설정하면 Inbucket 대신 네이버로도 보낼 수 있습니다(개발 시엔 Inbucket 권장).
