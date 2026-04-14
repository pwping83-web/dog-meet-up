import emailjs from '@emailjs/browser';

// EmailJS 설정
const EMAILJS_PUBLIC_KEY = readViteEnv('VITE_EMAILJS_PUBLIC_KEY')?.trim() || 'TbIjGPIbKGSMdRMt-';
const EMAILJS_TEMPLATE_ID = readViteEnv('VITE_EMAILJS_TEMPLATE_ID')?.trim() || 'template_4nf36gq';
const EMAILJS_SERVICE_ID = readViteEnv('VITE_EMAILJS_SERVICE_ID')?.trim() || 'service_yde5guq';

// EmailJS 초기화
emailjs.init(EMAILJS_PUBLIC_KEY);

export interface EmailParams {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  html_message?: string;
  from_name?: string;
  reply_to?: string;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatPhoneForDisplay(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

function readViteEnv(key: string): string | undefined {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  return env?.[key];
}

function maskMiddle(v: string): string {
  if (v.length <= 6) return v;
  return `${v.slice(0, 3)}***${v.slice(-3)}`;
}

/** 장애 확인용: 실제로 어떤 EmailJS 설정을 읽는지 요약 */
export function getEmailJsRuntimeSummary(): string {
  return `service=${maskMiddle(EMAILJS_SERVICE_ID)}, template=${maskMiddle(EMAILJS_TEMPLATE_ID)}, publicKey=${maskMiddle(EMAILJS_PUBLIC_KEY)}`;
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
        // 템플릿에서 html_message 또는 message_html 변수를 쓰면 HTML 메일로 표시됩니다.
        html_message: params.html_message || '',
        message_html: params.html_message || '',
        from_name: params.from_name || '댕댕마켓',
        reply_to: params.reply_to || 'noreply@daengdaengmarket.com',
      }
    );

    console.log('✅ 이메일 전송 성공:', response);
  } catch (error) {
    console.error('❌ 이메일 전송 실패:', error);
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`EmailJS 전송 실패: ${msg}`);
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

const DEFAULT_FEEDBACK_INBOX = '091234kim@naver.com';

/** 운영 수신함 — `.env`에 `VITE_FEEDBACK_INBOX_EMAIL` 이 있으면 우선 */
export function getFeedbackInboxEmail(): string {
  const v = readViteEnv('VITE_FEEDBACK_INBOX_EMAIL')?.trim();
  return v && v.includes('@') ? v : DEFAULT_FEEDBACK_INBOX;
}

/** 직업훈련 신청(제휴 교육소) 수신 — `VITE_TRAINING_PARTNER_INBOX_EMAIL` 없으면 피드백함으로 폴백 */
export function getTrainingPartnerInboxEmail(): string {
  const v = readViteEnv('VITE_TRAINING_PARTNER_INBOX_EMAIL')?.trim();
  return v && v.includes('@') ? v : getFeedbackInboxEmail();
}

/** 탐색 광고「댕댕케어 직업훈련」신청 → 제휴 교육소(또는 운영) 메일. 본문에 전화번호 포함 — 교육소에서 회신 전화 */
export async function sendTrainingCourseApplicationEmail(params: {
  applicantName: string;
  applicantPhone: string;
  applicantNote: string;
  applicantEmail: string;
  accountHint: string;
  pageUrl: string;
}): Promise<void> {
  const to_email = getTrainingPartnerInboxEmail();
  const submittedAt = new Date().toLocaleString('ko-KR');
  const nameSafe = escapeHtml(params.applicantName);
  const phoneSafe = escapeHtml(formatPhoneForDisplay(params.applicantPhone));
  const emailSafe = escapeHtml(params.applicantEmail.trim() || '(미입력)');
  const noteSafe = escapeHtml(params.applicantNote.trim() || '(미입력)');
  const accountSafe = escapeHtml(params.accountHint);
  const pageSafe = escapeHtml(params.pageUrl || '(미기록)');

  const lines = [
    '[댕댕케어 직업훈련 · 신청]',
    '신청자에게 연락(전화) 부탁드립니다.',
    '',
    `이름: ${params.applicantName}`,
    `전화: ${params.applicantPhone}`,
  ];
  if (params.applicantEmail.trim()) {
    lines.push(`이메일: ${params.applicantEmail.trim()}`);
  }
  if (params.applicantNote.trim()) {
    lines.push('', '문의·희망:', params.applicantNote.trim());
  }
  lines.push('', '---', `앱 계정 참고: ${params.accountHint}`, `접수 URL: ${params.pageUrl}`);

  const html_message = `
<div style="font-family:Arial,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;background:#f6f3ff;padding:20px;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e8dbff;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(90deg,#6d28d9,#9333ea);padding:16px 20px;color:#fff;">
      <div style="font-size:12px;font-weight:700;opacity:.9;">댕댕마켓</div>
      <div style="margin-top:4px;font-size:18px;font-weight:800;">직업훈련 신청서</div>
    </div>
    <div style="padding:18px 20px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="width:130px;padding:8px 0;color:#6b7280;font-weight:700;">접수 시각</td><td style="padding:8px 0;color:#111827;">${escapeHtml(submittedAt)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-weight:700;">이름</td><td style="padding:8px 0;color:#111827;font-weight:700;">${nameSafe}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-weight:700;">휴대폰</td><td style="padding:8px 0;color:#111827;">${phoneSafe}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-weight:700;">이메일</td><td style="padding:8px 0;color:#111827;">${emailSafe}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-weight:700;vertical-align:top;">문의/희망 일정</td><td style="padding:8px 0;color:#111827;white-space:pre-wrap;">${noteSafe}</td></tr>
      </table>
      <div style="margin-top:14px;border-top:1px solid #ede9fe;padding-top:12px;font-size:12px;color:#6b7280;line-height:1.6;">
        앱 계정: ${accountSafe}<br/>
        접수 URL: ${pageSafe}
      </div>
    </div>
  </div>
</div>`.trim();

  const reply =
    params.applicantEmail.trim() && params.applicantEmail.includes('@')
      ? params.applicantEmail.trim()
      : 'noreply@daengdaengmarket.com';

  return sendEmail({
    to_email,
    to_name: '제휴 교육',
    subject: `[직업훈련 신청] ${params.applicantName} · ${params.applicantPhone}`,
    message: lines.join('\n'),
    html_message,
    from_name: '댕댕마켓 직업훈련',
    reply_to: reply,
  });
}

/** 고객 의견·오류·불편 접수 → 운영 메일(EmailJS 템플릿 경유) */
export async function sendUserFeedbackEmail(params: {
  kindLabel: string;
  title: string;
  detail: string;
  accountHint: string;
  replyEmail: string;
  pageUrl: string;
  userAgent: string;
}): Promise<void> {
  const to_email = getFeedbackInboxEmail();
  const message = [
    '[개선해 주세요 — 댕댕마켓]',
    `유형: ${params.kindLabel}`,
    `제목: ${params.title}`,
    '',
    '내용:',
    params.detail,
    '',
    '---',
    `계정: ${params.accountHint}`,
    `답변 받을 이메일: ${params.replyEmail || '(미입력)'}`,
    `접수 시점 URL: ${params.pageUrl}`,
    `User-Agent: ${params.userAgent}`,
  ].join('\n');

  const subj = `[개선요청] ${params.kindLabel} — ${params.title.slice(0, 72)}${params.title.length > 72 ? '…' : ''}`;

  return sendEmail({
    to_email,
    to_name: '댕댕마켓 운영',
    subject: subj,
    message,
    from_name: '댕댕마켓 피드백',
    reply_to: params.replyEmail && params.replyEmail.includes('@') ? params.replyEmail : 'noreply@daengdaengmarket.com',
  });
}

export type TodoDigestMailParams = {
  toEmail: string;
  toName: string;
  time: string;
  name: string;
  message: string;
  /** 내부에서 생성한 카드 HTML 문자열(신뢰 가능한 값만 전달) */
  contentHtml: string;
  totalCount: number;
  subject?: string;
  replyTo?: string;
};

/** 요청하신 샘플 스타일 그대로 구성한 HTML 메일 */
export function buildTodoDigestHtmlEmail(input: {
  time: string;
  name: string;
  message: string;
  contentHtml: string;
  totalCount: number;
}): string {
  const timeSafe = escapeHtml(input.time);
  const nameSafe = escapeHtml(input.name);
  const messageSafe = escapeHtml(input.message);
  const totalSafe = escapeHtml(String(Math.max(0, Math.floor(input.totalCount || 0))));

  return `
<div style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; font-size: 14px; max-width: 560px; margin: 0 auto">
  <div style="background: linear-gradient(135deg, #7c3aed, #6366f1, #3b82f6); padding: 24px; border-radius: 14px 14px 0 0; text-align: center">
    <div style="font-size: 36px; margin-bottom: 8px">💕</div>
    <div style="color: white; font-size: 22px; font-weight: 700; letter-spacing: -0.5px">우리의 할일</div>
    <div style="color: #c7d2fe; font-size: 13px; margin-top: 6px">${timeSafe}</div>
  </div>

  <div style="background: #ffffff; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; padding: 16px 20px">
    <table role="presentation" style="width: 100%">
      <tr>
        <td style="vertical-align: top; width: 48px">
          <div style="padding: 8px 10px; background-color: #f5f3ff; border-radius: 10px; font-size: 26px; text-align: center; line-height: 1">
            📬
          </div>
        </td>
        <td style="vertical-align: top; padding-left: 12px">
          <div style="color: #4c1d95; font-size: 16px; font-weight: 700">${nameSafe}</div>
          <p style="font-size: 14px; color: #374151; margin: 6px 0 0; line-height: 1.6">${messageSafe}</p>
        </td>
      </tr>
    </table>
  </div>

  <div style="background: #ffffff; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; padding: 0 20px">
    <div style="border-top: 2px dashed #ddd6fe; margin: 0"></div>
  </div>

  <div style="background: #ffffff; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; padding: 16px 20px">
    ${input.contentHtml}
  </div>

  <div style="background: #f5f3ff; border: 1px solid #e5e7eb; border-top: none; padding: 16px 20px; text-align: center">
    <div style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #6366f1); color: white; padding: 8px 20px; border-radius: 10px; font-size: 14px; font-weight: 700">
      📌 총 ${totalSafe}건 — 잊지 마세요!
    </div>
    <div style="color: #6b7280; font-size: 12px; margin-top: 10px; line-height: 1.6">
      세무 알리미 완료 체크 / 할일 완료 체크를 하면<br>다음부터 해당 항목은 알림이 오지 않습니다.
    </div>
  </div>

  <div style="background: #faf5ff; padding: 14px 20px; border-radius: 0 0 14px 14px; border: 1px solid #e5e7eb; border-top: none; text-align: center">
    <p style="margin: 0; color: #a78bfa; font-size: 12px; font-weight: 500">우리 장부 💕</p>
  </div>
</div>`.trim();
}

/** 샘플 템플릿 기반 HTML 메일 발송 */
export async function sendTodoDigestEmail(params: TodoDigestMailParams): Promise<void> {
  const html = buildTodoDigestHtmlEmail({
    time: params.time,
    name: params.name,
    message: params.message,
    contentHtml: params.contentHtml,
    totalCount: params.totalCount,
  });

  const textFallback = [
    '[우리의 할일]',
    `시간: ${params.time}`,
    `이름: ${params.name}`,
    `메시지: ${params.message}`,
    `총 건수: ${params.totalCount}`,
  ].join('\n');

  await sendEmail({
    to_email: params.toEmail,
    to_name: params.toName,
    subject: params.subject ?? `[우리의 할일] ${params.time}`,
    message: textFallback,
    html_message: html,
    from_name: '우리 장부',
    reply_to: params.replyTo && params.replyTo.includes('@') ? params.replyTo : 'noreply@daengdaengmarket.com',
  });
}