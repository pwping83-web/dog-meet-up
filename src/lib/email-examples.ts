/**
 * EmailJS 사용 예시 가이드
 * 
 * 실제 페이지에서 이메일 알림을 보내는 방법을 설명합니다.
 */

import {
  sendNewQuoteNotification,
  sendQuoteAcceptedNotification,
  sendNewMessageNotification,
  sendRequestCreatedNotification,
  sendRepairerApprovedNotification,
  sendReviewReminderNotification,
  sendWelcomeEmail,
  trySendEmail,
} from './emailjs';

/**
 * 예시 1: 모임 등록 후 이메일 전송
 * 
 * 사용 위치: /src/app/pages/CreateRequestPage.tsx
 */
export async function exampleSendRequestCreatedEmail() {
  // 모임 등록 성공 후
  const newRequestId = '123'; // 실제로는 DB에서 생성된 ID
  const userEmail = 'customer@example.com'; // 로그인한 사용자 이메일
  const userName = '김철수'; // 로그인한 사용자 이름
  const requestTitle = '주말 한강공원 산책 모임'; // 모임 제목

  // 이메일 전송 (실패해도 앱은 계속 작동)
  await trySendEmail(
    () =>
      sendRequestCreatedNotification({
        userEmail,
        userName,
        requestTitle,
        requestId: newRequestId,
      }),
    '모임 등록 알림'
  );
}

/**
 * 예시 2: 참여 신청 시 모임장에게 이메일 전송
 * 
 * 사용 위치: /src/app/pages/RequestDetailPage.tsx (참여 신청 시)
 */
export async function exampleSendNewQuoteEmail() {
  // 참여 신청 성공 후
  const customerEmail = 'customer@example.com'; // 모임장 이메일
  const customerName = '김철수'; // 모임장 이름
  const repairerName = '미미맘'; // 신청한 댕집사 이름
  const amount = '함께 산책해요!'; // 참여 메시지
  const requestTitle = '주말 한강공원 산책 모임'; // 모임 제목
  const requestId = '123'; // 모임 ID

  await trySendEmail(
    () =>
      sendNewQuoteNotification({
        customerEmail,
        customerName,
        repairerName,
        amount,
        requestTitle,
        requestId,
      }),
    '새 참여 신청 알림'
  );
}

/**
 * 예시 3: 참여 수락 시 댕집사에게 이메일 전송
 * 
 * 사용 위치: /src/app/pages/RequestDetailPage.tsx (모임장이 수락 시)
 */
export async function exampleSendQuoteAcceptedEmail() {
  // 참여 수락 후
  const repairerEmail = 'repairer@example.com'; // 댕집사 이메일
  const repairerName = '미미맘'; // 댕집사 이름
  const customerName = '김철수'; // 모임장 이름
  const amount = '함께 산책해요!'; // 참여 메시지
  const requestTitle = '주말 한강공원 산책 모임'; // 모임 제목
  const requestId = '123'; // 모임 ID

  await trySendEmail(
    () =>
      sendQuoteAcceptedNotification({
        repairerEmail,
        repairerName,
        customerName,
        amount,
        requestTitle,
        requestId,
      }),
    '참여 수락 알림'
  );
}

/**
 * 예시 4: 채팅 메시지 전송 시 상대방에게 이메일 알림
 * 
 * 사용 위치: /src/app/pages/ChatsPage.tsx (메시지 전송 시)
 */
export async function exampleSendNewMessageEmail() {
  // 메시지 전송 후
  const recipientEmail = 'receiver@example.com'; // 받는 사람 이메일
  const recipientName = '김철수'; // 받는 사람 이름
  const senderName = '미미맘'; // 보낸 사람 이름
  const messagePreview = '내일 오전 10시에 산책 가능할까요?'; // 메시지 미리보기
  const chatId = '456'; // 채팅방 ID

  await trySendEmail(
    () =>
      sendNewMessageNotification({
        recipientEmail,
        recipientName,
        senderName,
        messagePreview,
        chatId,
      }),
    '새 메시지 알림'
  );
}

/**
 * 예시 5: 댕집사 등록 승인 시 이메일 전송
 * 
 * 사용 위치: /src/app/pages/AdminPage.tsx (관리자가 승인 시)
 */
export async function exampleSendRepairerApprovedEmail() {
  // 댕집사 승인 후
  const repairerEmail = 'repairer@example.com'; // 댕집사 이메일
  const repairerName = '박영수'; // 댕집사 이름
  const businessName = '댕집사 박영수'; // 프로필명

  await trySendEmail(
    () =>
      sendRepairerApprovedNotification({
        repairerEmail,
        repairerName,
        businessName,
      }),
    '댕집사 승인 알림'
  );
}

/**
 * 예시 6: 모임 완료 후 리뷰 요청 이메일
 * 
 * 사용 위치: /src/app/pages/RequestDetailPage.tsx (모임 완료 처리 시)
 */
export async function exampleSendReviewReminderEmail() {
  // 모임 완료 후 (24시간 후에 보내는 것을 권장)
  const customerEmail = 'customer@example.com'; // 참여자 이메일
  const customerName = '김철수'; // 참여자 이름
  const repairerName = '미미맘'; // 댕집사 이름
  const requestTitle = '주말 한강공원 산책 모임'; // 모임 제목
  const requestId = '123'; // 모임 ID

  await trySendEmail(
    () =>
      sendReviewReminderNotification({
        customerEmail,
        customerName,
        repairerName,
        requestTitle,
        requestId,
      }),
    '리뷰 작성 요청'
  );
}

/**
 * 예시 7: 회원가입 시 환영 이메일
 * 
 * 사용 위치: /src/app/pages/SignupPage.tsx (회원가입 성공 시)
 */
export async function exampleSendWelcomeEmail() {
  // 회원가입 성공 후
  const userEmail = 'newuser@example.com'; // 신규 회원 이메일
  const userName = '이민준'; // 신규 회원 이름

  await trySendEmail(
    () =>
      sendWelcomeEmail({
        userEmail,
        userName,
      }),
    '환영 이메일'
  );
}

/**
 * React 컴포넌트에서 사용하는 방법
 * 
 * 예시: CreateRequestPage.tsx
 */
export function ReactComponentExample() {
  // 이건 실제 컴포넌트 코드 예시입니다
  /*
  import { sendRequestCreatedNotification, trySendEmail } from '@/lib/emailjs';
  import { useAuth } from '@/contexts/AuthContext';
  import { toast } from 'sonner';

  const { user } = useAuth(); // 로그인한 사용자 정보
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 1. 모임 등록 (Supabase)
      const { data: newRequest } = await supabase
        .from('repair_requests')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          region_si: formData.city,
          region_gu: formData.district,
        })
        .select()
        .single();

      // 2. 이메일 알림 전송 (실패해도 OK)
      await trySendEmail(
        () => sendRequestCreatedNotification({
          userEmail: user.email!,
          userName: user.user_metadata?.name || '회원',
          requestTitle: formData.title,
          requestId: newRequest.id,
        }),
        '모임 등록 알림'
      );

      // 3. 성공 메시지 및 페이지 이동
      toast.success('🎉 등록 완료! 곧 참여 신청이 도착할 거예요');
      navigate(`/meetup/${newRequest.id}`);
      
    } catch (error) {
      toast.error('오류가 발생했습니다');
      console.error(error);
    }
  };
  */
}

/**
 * 자주 묻는 질문 (FAQ)
 */

// Q1: 이메일이 안 보내지면 어떻게 하나요?
// A: trySendEmail()을 사용하면 이메일 실패해도 앱은 계속 작동합니다.
//    콘솔에 에러 로그가 찍히므로 확인 가능합니다.

// Q2: 이메일 전송 횟수 제한이 있나요?
// A: EmailJS 무료 플랜은 월 200건까지입니다.
//    중요한 알림만 전송하는 것을 권장합니다.

// Q3: 사용자가 이메일을 안 받고 싶다면?
// A: Supabase profiles 테이블에 email_notifications (boolean) 필드를 추가하고
//    이메일 전송 전에 확인하는 로직을 추가하세요.

// Q4: 이메일에 이미지를 넣을 수 있나요?
// A: EmailJS 템플릿에서 HTML을 지원하므로 <img> 태그로 이미지 삽입 가능합니다.
//    (단, 이미지는 공개 URL이어야 합니다)

// Q5: 대량 이메일을 보내야 한다면?
// A: EmailJS는 실시간 알림용입니다. 대량 발송은 SendGrid, AWS SES 등을 권장합니다.