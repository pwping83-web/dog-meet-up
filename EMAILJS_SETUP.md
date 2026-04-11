# 📧 EmailJS 설정 가이드

## 🔑 연동 정보

EmailJS가 이미 프로젝트에 연결되어 있습니다!

- **Public Key**: `7-EF2vKlS3sc_N5rp`
- **Private Key**: `xPexQmGxFSJlKC0LVrDIt`
- **Template ID**: `template_tfb0g9l`

---

## 📋 이메일 템플릿 설정 (EmailJS 대시보드)

### 1️⃣ EmailJS 대시보드 접속
https://dashboard.emailjs.com/

### 2️⃣ Email Template 편집

**Template ID**: `template_tfb0g9l`

**필요한 변수:**
```
{{to_email}}      - 받는 사람 이메일
{{to_name}}       - 받는 사람 이름
{{subject}}       - 이메일 제목
{{message}}       - 이메일 본문
{{from_name}}     - 보내는 사람 이름 (기본: 수리마켓)
{{reply_to}}      - 회신 이메일 (기본: noreply@repairmarket.com)
```

**추천 템플릿 구조:**
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
      letter-spacing: -0.5px;
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
    .greeting {
      font-size: 16px;
      color: #475569;
      margin-bottom: 10px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%);
      color: white !important;
      padding: 14px 32px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 700;
      margin: 20px 0;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
      transition: all 0.3s;
    }
    .button:hover {
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
      transform: translateY(-2px);
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 13px;
    }
    .footer-links {
      margin: 15px 0;
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
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .header {
        padding: 30px 20px;
      }
      .content {
        padding: 20px;
      }
      .header h1 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- 헤더 -->
    <div class="header">
      <div class="emoji">🔧</div>
      <h1>수리마켓</h1>
      <p>동네 수리 중개 플랫폼</p>
    </div>

    <!-- 본문 -->
    <div class="content">
      <div class="greeting">
        안녕하세요 <strong>{{to_name}}</strong>님! 👋
      </div>

      <div class="message-box">{{message}}</div>

      <!-- 푸터 -->
      <div class="footer">
        <p style="margin: 5px 0;">이 메일은 <strong>{{from_name}}</strong>에서 자동으로 발송되었습니다.</p>
        
        <div class="footer-links">
          <a href="https://repairmarket.com/help">고객센터</a>
          <a href="https://repairmarket.com/settings">알림 설정</a>
          <a href="https://repairmarket.com/unsubscribe">수신거부</a>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; margin-top: 15px;">
          © 2026 수리마켓. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 🎨 고급 템플릿 (메시지 카드 스타일)

시간과 프로필을 포함한 채팅 스타일 템플릿이 필요하다면:

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
  
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
      <table role="presentation" style="width: 100%;">
        <tr>
          <td style="vertical-align: top; width: 60px;">
            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #4F46E5, #3B82F6); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;">
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

    <!-- CTA 버튼 (선택사항) -->
    <!-- 
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="display: inline-block; background: linear-gradient(135deg, #4F46E5, #3B82F6); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
        지금 바로 확인하기
      </a>
    </div>
    -->

    <!-- 푸터 -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
      <p style="margin: 5px 0;">이 메일은 수리마켓에서 자동으로 발송되었습니다.</p>
      <p style="margin: 10px 0;">
        <a href="#" style="color: #4F46E5; text-decoration: none; margin: 0 8px;">고객센터</a>
        <a href="#" style="color: #4F46E5; text-decoration: none; margin: 0 8px;">알림 설정</a>
        <a href="#" style="color: #4F46E5; text-decoration: none; margin: 0 8px;">수신거부</a>
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin-top: 15px;">
        © 2026 수리마켓. All rights reserved.
      </p>
    </div>
  </div>
</div>
```

---

## 📨 이메일 알림 종류

프로젝트에는 7가지 자동 이메일 알림이 구현되어 있습니다:

### 1. **새 견적 도착** (고객에게)
```typescript
sendNewQuoteNotification({
  customerEmail: 'customer@example.com',
  customerName: '김철수',
  repairerName: '박기사',
  amount: '15만원',
  requestTitle: '샤오미 킥보드 배터리 교체',
  requestId: '123'
});
```

### 2. **견적 채택** (수리기사에게)
```typescript
sendQuoteAcceptedNotification({
  repairerEmail: 'repairer@example.com',
  repairerName: '박기사',
  customerName: '김철수',
  amount: '15만원',
  requestTitle: '샤오미 킥보드 배터리 교체',
  requestId: '123'
});
```

### 3. **새 메시지** (양방향)
```typescript
sendNewMessageNotification({
  recipientEmail: 'user@example.com',
  recipientName: '김철수',
  senderName: '박기사',
  messagePreview: '내일 오전 10시에 방문 가능할까요?',
  chatId: '456'
});
```

### 4. **수리 요청 등록 완료** (본인에게)
```typescript
sendRequestCreatedNotification({
  userEmail: 'customer@example.com',
  userName: '김철수',
  requestTitle: '샤오미 킥보드 배터리 교체',
  requestId: '123'
});
```

### 5. **수리기사 등록 승인**
```typescript
sendRepairerApprovedNotification({
  repairerEmail: 'repairer@example.com',
  repairerName: '박영수',
  businessName: '박기사 수리샵'
});
```

### 6. **리뷰 작성 요청** (수리 완료 후)
```typescript
sendReviewReminderNotification({
  customerEmail: 'customer@example.com',
  customerName: '김철수',
  repairerName: '박기사',
  requestTitle: '샤오미 킥보드 배터리 교체',
  requestId: '123'
});
```

### 7. **환영 이메일** (회원가입 시)
```typescript
sendWelcomeEmail({
  userEmail: 'newuser@example.com',
  userName: '이민준'
});
```

---

## 🔧 사용 방법

### 기본 사용법
```typescript
import { sendNewQuoteNotification, trySendEmail } from '@/lib/emailjs';

// 견적 제출 시
await trySendEmail(
  () => sendNewQuoteNotification({
    customerEmail: 'customer@example.com',
    customerName: '김철수',
    repairerName: '박기사',
    amount: '15만원',
    requestTitle: '샤오미 킥보드 배터리 교체',
    requestId: request.id
  }),
  '새 견적 알림'
);
```

### React 컴포넌트에서 사용
```typescript
import { sendRequestCreatedNotification } from '@/lib/emailjs';
import { toast } from 'sonner';

const handleSubmitRequest = async () => {
  // 수리 요청 등록
  const newRequest = await createRequest(data);
  
  // 이메일 알림 전송 (에러가 나도 앱은 계속 동작)
  try {
    await sendRequestCreatedNotification({
      userEmail: user.email,
      userName: user.name,
      requestTitle: data.title,
      requestId: newRequest.id
    });
    toast.success('이메일 알림이 전송되었습니다!');
  } catch (error) {
    // 이메일 실패해도 요청은 성공
    console.log('이메일 전송 실패 (요청은 정상 처리됨)');
  }
};
```

---

## 🎨 EmailJS 대시보�� 설정 체크리스트

### ✅ Service 설정
1. Dashboard → **Email Services**
2. Service 추가 (Gmail, Outlook 등)
3. Service ID 확인 → 코드에서 `'default_service'` 부분을 실제 Service ID로 변경

### ✅ Template 설정
1. Dashboard → **Email Templates**
2. Template ID: `template_tfb0g9l` 확인
3. 위의 HTML 템플릿 적용
4. Test 버튼으로 테스트 발송

### ✅ API Keys 설정
1. Dashboard → **Account** → **API Keys**
2. Public Key: `7-EF2vKlS3sc_N5rp` 확인
3. Private Key는 백엔드에서만 사용 (프론트엔드는 Public Key만!)

---

## 🚨 주의사항

### ⚠️ 무료 플랜 제한
- **월 200건** 무료 (초과 시 유료 플랜 필요)
- 실시간 알림보다는 중요한 알림만 전송 권장

### 🔒 보안
- ✅ Public Key는 프론트엔드에 노출해도 안전
- ❌ Private Key는 절대 프론트엔드에 노출 금지!
- ✅ EmailJS 대시보드에서 도메인 화이트리스트 설정 권장

### 📧 스팸 방지
- 너무 많은 이메일 발송 자제
- 사용자가 이메일 알림 ON/OFF 설정 기능 제공 권장
- Unsubscribe 링크 제공

### 💡 베스트 프랙티스
```typescript
// ✅ 좋은 예: 에러가 나도 앱은 계속 동작
await trySendEmail(
  () => sendNewQuoteNotification(params),
  '견적 알림'
);

// ❌ 나쁜 예: 이메일 실패 시 앱 전체가 멈춤
await sendNewQuoteNotification(params); // throw 발생 가능
```

---

## 🧪 테스트 방법

### 1. 콘솔에서 직접 테스트
```typescript
import { sendWelcomeEmail } from '@/lib/emailjs';

// 본인 이메일로 테스트
await sendWelcomeEmail({
  userEmail: 'your-email@gmail.com',
  userName: '테스트 유저'
});
```

### 2. 실제 플로우 테스트
1. 회원가입 → 환영 이메일 수신
2. 수리 요청 작성 → 등록 완료 이메일 수신
3. 견적 제출 → 고객에게 알림 이메일
4. 견적 채택 → 수리기사에게 알림 이메일

---

## 🔗 EmailJS Service ID 변경

코드에서 `'default_service'`를 실제 Service ID로 변경하세요:

`/src/lib/emailjs.ts` 파일:
```typescript
const response = await emailjs.send(
  'YOUR_SERVICE_ID',  // ← 여기를 EmailJS 대시보드의 Service ID로 변경
  EMAILJS_TEMPLATE_ID,
  templateParams
);
```

---

## ✅ 설정 완료!

이제 모든 이메일 알림이 자동으로 작동합니다! 🎉

문제가 발생하면:
- EmailJS 대시보드 → Activity Log 확인
- 브라우저 콘솔에서 에러 메시지 확인
- Service ID와 Template ID가 정확한지 재확인