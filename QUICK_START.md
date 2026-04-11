# 🚀 수리마켓 - 빠른 시작 가이드

## 📦 프로젝트 개요

**수리마켓**은 당근마켓 스타일의 지역 기반 중국 제품 수리 중개 플랫폼입니다.

- **문제**: 중국 제품 AS가 안 되는 문제
- **솔루션**: 개인 수리 기사와 고객 연결
- **비즈니스 모델**: 입찰 시스템 (수리 요청 → 견적 제출 → 딜 성사)

---

## ⚡ 5분 안에 시작하기

### 1️⃣ Supabase 데이터베이스 설정

```bash
# 1. Supabase 대시보드 접속
https://supabase.com/dashboard/project/kqchqaqsbqdvchwxekfx

# 2. SQL Editor 열기
좌측 메뉴 → SQL Editor → New Query

# 3. 스키마 실행
프로젝트 루트의 supabase-schema.sql 파일 내용 복사
→ SQL Editor에 붙여넣기 → Run 클릭

# 4. 이메일 인증 끄기 (개발용)
Authentication → Providers → Email → Confirm email OFF
```

### 2️⃣ EmailJS 이메일 알림 설정

```bash
# 1. EmailJS 대시보드 접속
https://dashboard.emailjs.com/

# 2. Service 추가
Email Services → Add Service (Gmail/Outlook 등)
→ Service ID 복사

# 3. 코드에 Service ID 적용
/src/lib/emailjs.ts 파일 열기
→ 'default_service'를 실제 Service ID로 변경

# 4. 템플릿 설정
Email Templates → template_tfb0g9l 선택
→ 아래 템플릿 코드 붙여넣기
```

**EmailJS 템플릿 (복사해서 사용하세요):**

<details>
<summary>📧 기본 템플릿 (클릭하여 펼치기)</summary>

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
          © 2026 수리마켓. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
```

</details>

<details>
<summary>💬 메시지 카드 템플릿 (채팅 스타일)</summary>

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
  
  <!-- 헤더 -->
  <div style="background: linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%); color: white; padding: 30px; text-align: center;">
    <div style="font-size: 40px; margin-bottom: 10px;">🔧</div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 800;">수리마켓</h1>
    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 13px;">동네 수리 중개 플랫폼</p>
  </div>

  <!-- 본문 -->
  <div style="padding: 30px;">
    <div style="color: #475569; margin-bottom: 20px;">
      안녕하세요 <strong>{{to_name}}</strong>님!
    </div>

    <!-- 메시지 카드 -->
    <div style="margin: 20px 0; padding: 20px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #4F46E5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: top; width: 60px;">
            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #4F46E5, #3B82F6); border-radius: 12px; text-align: center; line-height: 50px; font-size: 24px;">
              👤
            </div>
          </td>
          <td style="vertical-align: top; padding-left: 15px;">
            <div style="font-weight: 700; color: #1e293b; font-size: 15px; margin-bottom: 4px;">
              {{from_name}}
            </div>
            <div style="color: #94a3b8; font-size: 12px; margin-bottom: 10px;">
              방금 전
            </div>
            <div style="color: #334155; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
              {{message}}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- 푸터 -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
      <p style="margin: 5px 0;">이 메일은 수리마켓에서 자동으로 발송되었습니다.</p>
      <p style="margin: 10px 0;">
        <a href="#" style="color: #4F46E5; text-decoration: none; margin: 0 8px;">고객센터</a>
        <a href="#" style="color: #4F46E5; text-decoration: none; margin: 0 8px;">알림 설정</a>
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin-top: 15px;">
        © 2026 수리마켓. All rights reserved.
      </p>
    </div>
  </div>
</div>
```

</details>

### 3️⃣ 테스트 이메일 발송

브라우저 콘솔에서:

```javascript
import { sendWelcomeEmail } from './src/lib/emailjs';

// 본인 이메일로 테스트
await sendWelcomeEmail({
  userEmail: 'your-email@gmail.com',
  userName: '테스트 유저'
});
```

---

## 🗂️ 프로젝트 구조

```
/src
├── /app
│   ├── App.tsx                    # 메인 앱 (AuthProvider 포함)
│   ├── routes.tsx                 # 라우터 설정
│   ├── /pages                     # 모든 페이지 컴포넌트
│   │   ├── HomePage.tsx           # 홈 (수리 요청 목록)
│   │   ├── CreateRequestPage.tsx  # 수리 요청 작성
│   │   ├── RequestDetailPage.tsx  # 수리 요청 상세
│   │   ├── ChatsPage.tsx          # 채팅 목록
│   │   └── MyPage.tsx             # 마이페이지
│   └── /components                # 재사용 컴포넌트
│
├── /lib
│   ├── supabase.ts                # Supabase 클라이언트
│   ├── emailjs.ts                 # EmailJS 설정 + 이메일 함수
│   └── email-examples.ts          # EmailJS 사용 예시
│
├── /contexts
│   └── AuthContext.tsx            # 인증 Context (로그인/회원가입)
│
└── /styles
    ├── theme.css                  # 테마 변수
    └── fonts.css                  # 폰트

/supabase-schema.sql               # 데이터베이스 스키마
/SUPABASE_SETUP.md                 # Supabase 설정 가이드
/EMAILJS_SETUP.md                  # EmailJS 설정 가이드
/QUICK_START.md                    # 이 파일!
```

---

## 🎯 핵심 기능

### 1. 인증 시스템 (Supabase Auth)

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, signIn, signOut } = useAuth();

  // 로그인
  await signIn('email@example.com', 'password123');

  // 회원가입
  await signUp('email@example.com', 'password123', '홍길동');

  // 로그아웃
  await signOut();
}
```

### 2. 데이터베이스 작업 (Supabase)

```typescript
import { supabase } from '@/lib/supabase';

// 수리 요청 목록 가져오기
const { data } = await supabase
  .from('repair_requests')
  .select('*, profiles(name, avatar_url)')
  .eq('status', 'open')
  .order('created_at', { ascending: false });

// 견적 제출
const { error } = await supabase.from('quotes').insert({
  request_id: '123',
  repairer_id: '456',
  amount: 150000,
  message: '정품 배터리로 교체해드립니다',
});
```

### 3. 이메일 알림 (EmailJS)

```typescript
import { sendNewQuoteNotification, trySendEmail } from '@/lib/emailjs';

// 견적 제출 시 고객에게 이메일 전송
await trySendEmail(
  () =>
    sendNewQuoteNotification({
      customerEmail: 'customer@example.com',
      customerName: '김철수',
      repairerName: '박기사',
      amount: '15만원',
      requestTitle: '샤오미 킥보드 배터리 교체',
      requestId: '123',
    }),
  '새 견적 알림'
);
```

---

## 📋 데이터베이스 테이블

### 주요 테이블

1. **profiles** - 사용자 프로필
2. **repairers** - 수리기사 정보
3. **repair_requests** - 수리 요청
4. **quotes** - 견적/입찰
5. **messages** - 채팅 메시지
6. **notifications** - 알림

자세한 스키마는 `supabase-schema.sql` 참고

---

## 🎨 디자인 시스템

- **테마**: 인디고/블루 그라데이션
- **스타일**: Squircle (rounded-3xl), Glassmorphism
- **애니메이션**: 쫀득한 터치 피드백 (active:scale-[0.98])
- **아이콘**: Lucide React
- **철학**: 이모지 중심, 최소한의 텍스트

---

## 🔧 환경 변수 (참고용)

프로젝트에 이미 설정되어 있습니다:

```env
# Supabase
SUPABASE_URL=https://kqchqaqsbqdvchwxekfx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# EmailJS
EMAILJS_PUBLIC_KEY=7-EF2vKlS3sc_N5rp
EMAILJS_TEMPLATE_ID=template_tfb0g9l
```

---

## 🚀 배포 전 체크리스트

- [ ] Supabase 스키마 실행 완료
- [ ] EmailJS Service ID 설정
- [ ] EmailJS 템플릿 적용
- [ ] 이메일 인증 설정 (프로덕션은 ON)
- [ ] Storage bucket 생성 (repair-images)
- [ ] 테스트 이메일 발송 성공
- [ ] 회원가입/로그인 테스트
- [ ] 수리 요청 작성 테스트
- [ ] 견적 제출 테스트

---

## 📚 상세 가이드

- **Supabase 설정**: `/SUPABASE_SETUP.md`
- **EmailJS 설정**: `/EMAILJS_SETUP.md`
- **EmailJS 사용 예시**: `/src/lib/email-examples.ts`

---

## 🐛 문제 해결

### Supabase 오류

```bash
# "relation does not exist" 오류
→ supabase-schema.sql을 SQL Editor에서 실행했는지 확인

# "JWT expired" 오류
→ 로그아웃 후 다시 로그인
```

### EmailJS 오류

```bash
# 이메일 전송 실패
→ EmailJS Service ID가 코드에 반영되었는지 확인
→ EmailJS 대시보드 → Activity Log 확인

# 템플릿 오류
→ Template ID가 'template_tfb0g9l'인지 확인
→ 필수 변수 {{to_name}}, {{message}} 등이 있는지 확인
```

---

## 💡 다음 단계

1. **Storage 설정** - 이미지 업로드 기능 활성화
2. **실시간 채팅** - Supabase Realtime 구독
3. **푸시 알림** - Firebase Cloud Messaging 연동
4. **결제 시스템** - 아임포트/토스페이먼츠 연동
5. **관리자 페이지** - 수리기사 승인 시스템

---

## 🎉 완료!

이제 수리마켓을 사용할 준비가 되었습니다!

궁금한 점이 있으면 각 설정 가이드 파일을 참고하세요:
- `SUPABASE_SETUP.md`
- `EMAILJS_SETUP.md`

Happy Coding! 🚀
