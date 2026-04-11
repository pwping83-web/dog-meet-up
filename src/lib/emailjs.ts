import emailjs from '@emailjs/browser';

// EmailJS 설정
const EMAILJS_PUBLIC_KEY = '7-EF2vKlS3sc_N5rp';
const EMAILJS_PRIVATE_KEY = 'xPexQmGxFSJlKC0LVrDIt';
const EMAILJS_TEMPLATE_ID = 'template_tfb0g9l';
const EMAILJS_SERVICE_ID = 'service_yde5guq'; // ✅ Gmail Service 연결 완료!

// EmailJS 초기화
emailjs.init(EMAILJS_PUBLIC_KEY);

export interface EmailParams {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  from_name?: string;
  reply_to?: string;
}

/**
 * 이메일 전송 함수
 */
export async function sendEmail(params: EmailParams): Promise<void> {
  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID, // Service ID (EmailJS 대시보드에서 확인)
      EMAILJS_TEMPLATE_ID,
      {
        to_email: params.to_email,
        to_name: params.to_name,
        subject: params.subject,
        message: params.message,
        from_name: params.from_name || '댕댕마켓',
        reply_to: params.reply_to || 'noreply@daengdaengmarket.com',
      }
    );

    console.log('✅ 이메일 전송 성공:', response);
  } catch (error) {
    console.error('❌ 이메일 전송 실패:', error);
    throw error;
  }
}

/**
 * 알림 이메일 템플릿
 */

// 1. 새 견적 도착 알림 (고객에게)
export async function sendNewQuoteNotification(params: {
  customerEmail: string;
  customerName: string;
  repairerName: string;
  amount: string;
  requestTitle: string;
  requestId: string;
}) {
  return sendEmail({
    to_email: params.customerEmail,
    to_name: params.customerName,
    subject: `💰 새로운 참여 신청이 도착했어요!`,
    message: `
안녕하세요 ${params.customerName}님! 👋

"${params.requestTitle}" 모임에 새로운 참여 신청이 도착했습니다.

🐕 댕친: ${params.repairerName}
⏰ 시간: ${params.amount}

지금 바로 확인하고 함께할 댕친을 선택하세요!

▶ 신청 확인하기: ${window.location.origin}/meetup/${params.requestId}

따뜻한 동네 댕친 모임, 댕댕마켓이 함께합니다 🧡
    `.trim(),
    from_name: '댕댕마켓 알림',
  });
}

// 2. 견적 채택 알림 (수리기사에게)
export async function sendQuoteAcceptedNotification(params: {
  repairerEmail: string;
  repairerName: string;
  customerName: string;
  amount: string;
  requestTitle: string;
  requestId: string;
}) {
  return sendEmail({
    to_email: params.repairerEmail,
    to_name: params.repairerName,
    subject: `🎉 모임 참여가 확정되었습니다!`,
    message: `
축하합니다 ${params.repairerName}님! 🎊

"${params.requestTitle}" 모임에서 회원님의 신청이 선택되었습니다.

👤 함께할 친구: ${params.customerName}님
⏰ 확정 시간: ${params.amount}

채팅으로 세부 일정을 조율해주세요!

▶ 모임 보기: ${window.location.origin}/meetup/${params.requestId}

즐거운 댕댕이 모임 시간 되세요 💪
    `.trim(),
    from_name: '댕댕마켓 알림',
  });
}

// 3. 새 메시지 알림
export async function sendNewMessageNotification(params: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  messagePreview: string;
  chatId: string;
}) {
  return sendEmail({
    to_email: params.recipientEmail,
    to_name: params.recipientName,
    subject: `💬 ${params.senderName}님이 메시지를 보냈어요`,
    message: `
안녕하세요 ${params.recipientName}님!

${params.senderName}님으로부터 새 메시지가 도착했습니다.

"${params.messagePreview}"

▶ 메시지 확인하기: ${window.location.origin}/chat/${params.chatId}

빠른 소통으로 즐거운 모임을 만들어가세요! 🧡
    `.trim(),
    from_name: '댕댕마켓 알림',
  });
}

// 4. 수리 요청 등록 완료 알림 (본인에게)
export async function sendRequestCreatedNotification(params: {
  userEmail: string;
  userName: string;
  requestTitle: string;
  requestId: string;
}) {
  return sendEmail({
    to_email: params.userEmail,
    to_name: params.userName,
    subject: `✅ 모임이 등록되었어요!`,
    message: `
안녕하세요 ${params.userName}님!

"${params.requestTitle}" 모임이 성공적으로 등록되었습니다.

곧 동네 댕친들의 참여 신청이 도착할 거예요! 🐕

▶ 내 모임 보기: ${window.location.origin}/meetup/${params.requestId}

💡 TIP: 사진과 설명을 자세히 올릴수록 더 많은 댕친이 찾아와요.

댕댕마켓과 함께 즐거운 반려견 모임을 만들어가세요! 🧡
    `.trim(),
    from_name: '댕댕마켓 알림',
  });
}

// 5. 수리기사 등록 승인 알림
export async function sendRepairerApprovedNotification(params: {
  repairerEmail: string;
  repairerName: string;
  businessName: string;
}) {
  return sendEmail({
    to_email: params.repairerEmail,
    to_name: params.repairerName,
    subject: `🎉 댕집사 등록이 승인되었습니다!`,
    message: `
축하합니다 ${params.repairerName}님! 🎊

"${params.businessName}" 댕집사 등록이 정식으로 승인되었습니다.

이제 모임에 참여 신청을 하고 댕친들과 만날 수 있어요!

▶ 모임 둘러보기: ${window.location.origin}/

🐾 활동 팁:
- 적극적인 소통
- 댕댕이 안전 최우선
- 빠른 응답이 좋은 인연을 만들어요

댕댕마켓에서 즐거운 활동을 응원합니다! 🧡
    `.trim(),
    from_name: '댕댕마켓 알림',
  });
}

// 6. 리뷰 작성 알림 (수리 완료 후)
export async function sendReviewReminderNotification(params: {
  customerEmail: string;
  customerName: string;
  repairerName: string;
  requestTitle: string;
  requestId: string;
}) {
  return sendEmail({
    to_email: params.customerEmail,
    to_name: params.customerName,
    subject: `⭐ 모임은 즐거우셨나요?`,
    message: `
안녕하세요 ${params.customerName}님!

${params.repairerName}님과의 "${params.requestTitle}" 모임이 완료되었습니다.

즐거운 시간이었다면 따뜻한 후기를 남겨주세요! 
댕친에게 큰 힘이 됩니다 🧡

▶ 후기 작성하기: ${window.location.origin}/meetup/${params.requestId}

좋은 댕친들이 더 많이 활동할 수 있도록
여러분의 소중한 후기를 기다립니다!

감사합니다 🙏
    `.trim(),
    from_name: '댕댕마켓 알림',
  });
}

// 7. 환영 이메일 (회원가입 시)
export async function sendWelcomeEmail(params: {
  userEmail: string;
  userName: string;
}) {
  return sendEmail({
    to_email: params.userEmail,
    to_name: params.userName,
    subject: `🎉 댕댕마켓에 오신 걸 환영합니다!`,
    message: `
안녕하세요 ${params.userName}님! 👋

댕댕마켓 가족이 되신 걸 진심으로 환영합니다!

🐕 댕댕마켓은 이렇게 사용해요:

1️⃣ 산책이나 훈련 모임 만들기
2️⃣ 동네 댕친들의 참여 신청 받기
3️⃣ 함께할 댕친 선택하기
4️⃣ 즐거운 반려견 모임 시간! ✨

💡 첫 모임을 만들어보세요!
▶ 지금 시작하기: ${window.location.origin}/create-meetup

궁금한 점이 있으시면 언제든 고객센터로 문의해주세요.

따뜻한 동네 댕친 문화를 함께 만들어가요! 🧡

댕댕마켓 드림
    `.trim(),
    from_name: '댕댕마켓',
  });
}

/**
 * 이메일 전송 헬퍼 (try-catch 처리)
 */
export async function trySendEmail(
  emailFunction: () => Promise<void>,
  context: string
): Promise<boolean> {
  try {
    await emailFunction();
    console.log(`✅ ${context} 이메일 전송 성공`);
    return true;
  } catch (error) {
    console.error(`❌ ${context} 이메일 전송 실패:`, error);
    // 이메일 전송 실패해도 앱은 계속 작동
    return false;
  }
}