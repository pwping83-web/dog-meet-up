# ⚡ EmailJS 빠른 설정 가이드 (5분 완성)

## 🚨 현재 상태: Service 미설정

스크린샷에 나온 오류: **"서비스가 선택되지 않음"**
→ EmailJS에서 Email Service를 먼저 추가해야 합니다!

---

## 📝 설정 순서 (따라하기)

### 1단계: Email Service 추가 ⭐ (가장 중요!)

```bash
1. EmailJS 대시보드 접속
   👉 https://dashboard.emailjs.com/

2. 좌측 메뉴에서 "Email Services" 클릭

3. "Add New Service" 버튼 클릭

4. 서비스 선택:
   ✅ Gmail (추천)
   - Outlook
   - Yahoo Mail
   - 기타 등

5. Gmail 선택 시:
   a. "Connect Account" 클릭
   b. Google 계정으로 로그인
   c. EmailJS 접근 권한 허용

6. ✨ Service ID 복사!
   예: service_abc1234
   예: service_xyz9876
```

### 2단계: 코드에 Service ID 적용

**파일**: `/src/lib/emailjs.ts`

```typescript
// 6번째 줄 수정
const EMAILJS_SERVICE_ID = 'service_abc1234'; // ← 여기에 복사한 Service ID 붙여넣기!
```

**전체 예시:**
```typescript
// EmailJS 설정
const EMAILJS_PUBLIC_KEY = '7-EF2vKlS3sc_N5rp';
const EMAILJS_PRIVATE_KEY = 'xPexQmGxFSJlKC0LVrDIt';
const EMAILJS_TEMPLATE_ID = 'template_tfb0g9l';
const EMAILJS_SERVICE_ID = 'service_abc1234'; // ✅ 실제 Service ID로 변경!
```

### 3단계: 템플릿 HTML 적용

```bash
1. EmailJS 대시보드 → "Email Templates" 클릭

2. "template_tfb0g9l" 템플릿 클릭 (또는 새로 생성)

3. "Edit" 버튼 클릭

4. 아래 HTML 코드 복사 → 붙여넣기
```

**템플릿 HTML:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8fafc;
    }
    .email-container {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 800;
    }
    .header p {
      margin: 8px 0 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      padding: 30px;
    }
    .message-box {
      background: #f1f5f9;
      border-left: 4px solid #4F46E5;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      white-space: pre-wrap;
      font-size: 15px;
      line-height: 1.7;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 13px;
    }
    .footer-links a {
      color: #4F46E5;
      text-decoration: none;
      margin: 0 10px;
    }
    .emoji {
      font-size: 48px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="emoji">🔧</div>
      <h1>수리마켓</h1>
      <p>동네 수리 중개 플랫폼</p>
    </div>

    <div class="content">
      <div style="font-size: 16px; color: #475569; margin-bottom: 10px;">
        안녕하세요 <strong>{{to_name}}</strong>님! 👋
      </div>

      <div class="message-box">{{message}}</div>

      <div class="footer">
        <p>이 메일은 <strong>{{from_name}}</strong>에서 자동으로 발송되었습니다.</p>
        <div style="margin: 15px 0;">
          <a href="#">고객센터</a>
          <a href="#">알림 설정</a>
          <a href="#">수신거부</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">
          © 2026 댕댕마켓. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
```

### 4단계: 테스트!

```bash
# 방법 1: EmailJS 대시보드에서 테스트
Template → Test → Service 선택 → Send Test

# 방법 2: 앱에서 실제로 emailjs.send 를 호출하는 화면(예: 고객센터·문의)에서 확인
# (전용 /email-test 페이지는 제거됨 — 댕댕마켓 정리)
```

---

## ✅ 체크리스트

설정 완료 확인:

- [ ] EmailJS Email Service 추가 완료
- [ ] Service ID 복사 완료
- [ ] `/src/lib/emailjs.ts` 파일에 Service ID 입력
- [ ] EmailJS 템플릿에 HTML 적용
- [ ] 템플릿 저장 완료
- [ ] 대시보드 Test 또는 앱 내 EmailJS 호출로 테스트 이메일 발송
- [ ] `tseizou@naver.com` 메일함 확인 (스팸함도 확인!)

---

## 🐛 문제 해결

### 1. "Service ID가 유효하지 않습니다" 오류

```bash
→ Service ID를 다시 복사했는지 확인
→ EmailJS 대시보드 → Email Services에서 Service ID 재확인
```

### 2. 이메일이 도착하지 않음

```bash
→ 스팸 메일함 확인
→ EmailJS 대시보드 → Activity Log에서 전송 기록 확인
→ Service가 Active 상태인지 확인
```

### 3. "Template not found" 오류

```bash
→ Template ID가 'template_tfb0g9l'인지 확인
→ 또는 새 템플릿 생성 후 ID를 코드에 반영
```

---

## 📊 EmailJS 무료 플랜 제한

- **월 200건** 이메일 전송 제한
- 초과 시 유료 플랜 필요
- 개발/테스트에는 충분!

---

## 🎯 다음 단계

설정이 완료되면(예시 — 실제 연동은 `emailjs.ts`·각 페이지 코드 기준):

1. **회원가입·문의** 등에서 `emailjs.send` 호출로 알림 발송
2. 모임·돌봄 관련 이벤트에 맞춰 템플릿 추가 가능

---

## 💡 참고 파일

- `/src/lib/emailjs.ts` - EmailJS 설정 + 7가지 이메일 함수
- `/src/lib/email-examples.ts` - 사용 예시 코드
- `/EMAILJS_SETUP.md` - 상세 설정 가이드
- `/QUICK_START.md` - 전체 프로젝트 빠른 시작

---

## 🚀 지금 바로 시작하세요!

1. EmailJS 대시보드에서 Service 추가
2. Service ID 복사
3. `/src/lib/emailjs.ts` 파일 수정
4. 저장 후 EmailJS 대시보드에서 Test 발송 또는 앱 연동 화면에서 확인
5. 이메일 발송 테스트!

완료! 🎉
