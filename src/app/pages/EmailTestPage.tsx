import { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import {
  sendWelcomeEmail,
  sendNewQuoteNotification,
  sendQuoteAcceptedNotification,
  sendNewMessageNotification,
  sendRequestCreatedNotification,
  sendRepairerApprovedNotification,
  sendReviewReminderNotification,
  trySendEmail,
} from '../../lib/emailjs';

export function EmailTestPage() {
  const [testEmail] = useState('tseizou@naver.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const emailTemplates = [
    {
      id: 'welcome',
      name: '환영 이메일',
      emoji: '👋',
      description: '회원가입 시 발송',
      color: 'from-orange-500 to-amber-500',
      send: () =>
        sendWelcomeEmail({
          userEmail: testEmail,
          userName: '테스트 사용자',
        }),
    },
    {
      id: 'request-created',
      name: '모임 등록 알림',
      emoji: '✅',
      description: '모임 등록 완료',
      color: 'from-amber-500 to-orange-600',
      send: () =>
        sendRequestCreatedNotification({
          userEmail: testEmail,
          userName: '김철수',
          requestTitle: '주말 한강공원 산책 모임',
          requestId: 'test-123',
        }),
    },
    {
      id: 'new-quote',
      name: '새 참여 신청',
      emoji: '💰',
      description: '모임장에게 신청 알림',
      color: 'from-orange-500 to-amber-500',
      send: () =>
        sendNewQuoteNotification({
          customerEmail: testEmail,
          customerName: '김철수',
          repairerName: '미미맘',
          amount: '함께 산책해요!',
          requestTitle: '주말 한강공원 산책 모임',
          requestId: 'test-123',
        }),
    },
    {
      id: 'quote-accepted',
      name: '신청 수락',
      emoji: '🎉',
      description: '댕집사에게 수락 알림',
      color: 'from-orange-500 to-amber-600',
      send: () =>
        sendQuoteAcceptedNotification({
          repairerEmail: testEmail,
          repairerName: '미미맘',
          customerName: '김철수',
          amount: '함께 산책해요!',
          requestTitle: '주말 한강공원 산책 모임',
          requestId: 'test-123',
        }),
    },
    {
      id: 'new-message',
      name: '새 메시지',
      emoji: '💬',
      description: '채팅 메시지 알림',
      color: 'from-orange-500 to-amber-500',
      send: () =>
        sendNewMessageNotification({
          recipientEmail: testEmail,
          recipientName: '김철수',
          senderName: '박기사',
          messagePreview: '내일 오전 10시에 산책 가능할까요? 우리 강아지 성격이 순해서 잘 어울릴 거예요.',
          chatId: 'chat-456',
        }),
    },
    {
      id: 'repairer-approved',
      name: '댕집사 승인',
      emoji: '🐾',
      description: '댕집사 등록 승인',
      color: 'from-amber-500 to-orange-500',
      send: () =>
        sendRepairerApprovedNotification({
          repairerEmail: testEmail,
          repairerName: '박영수',
          businessName: '댕집사 박영수',
        }),
    },
    {
      id: 'review-reminder',
      name: '리뷰 작성 요청',
      emoji: '⭐',
      description: '모임 완료 후 리뷰 유도',
      color: 'from-yellow-500 to-orange-500',
      send: () =>
        sendReviewReminderNotification({
          customerEmail: testEmail,
          customerName: '김철수',
          repairerName: '미미맘',
          requestTitle: '주말 한강공원 산책 모임',
          requestId: 'test-123',
        }),
    },
  ];

  const handleSendEmail = async (template: typeof emailTemplates[0]) => {
    setLoading(true);
    setResult(null);

    const success = await trySendEmail(
      template.send,
      `${template.name} 테스트 이메일`
    );

    if (success) {
      setResult({
        type: 'success',
        message: `✅ ${template.name} 이메일이 ${testEmail}로 전송되었습니다!`,
      });
    } else {
      setResult({
        type: 'error',
        message: `❌ 이메일 전송 실패. 콘솔을 확인하세요.`,
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="flex items-center justify-center h-16 px-4 max-w-screen-lg mx-auto">
          <Mail className="w-6 h-6 text-orange-600 mr-2" />
          <h1 className="text-xl font-extrabold text-slate-800">이메일 테스트</h1>
        </div>
      </div>

      <div className="px-4 py-8 max-w-screen-lg mx-auto">
        {/* 안내 메시지 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <div className="text-center mb-4">
            <div className="text-5xl mb-3">📧</div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
              EmailJS 테스트
            </h2>
            <p className="text-slate-600">
              아래 버튼을 클릭하여 각 이메일 템플릿을 테스트하세요
            </p>
          </div>

          {/* 수신 이메일 */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-4 mt-4">
            <div className="flex items-center justify-center gap-2">
              <Mail className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-bold text-slate-700">수신 이메일:</span>
              <span className="text-base font-extrabold text-orange-600">{testEmail}</span>
            </div>
          </div>
        </div>

        {/* 결과 메시지 */}
        {result && (
          <div
            className={`rounded-2xl p-4 mb-6 flex items-start gap-3 ${
              result.type === 'success'
                ? 'bg-orange-50 border border-orange-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {result.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm font-bold ${
                result.type === 'success' ? 'text-orange-900' : 'text-red-800'
              }`}
            >
              {result.message}
            </p>
          </div>
        )}

        {/* 이메일 템플릿 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emailTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSendEmail(template)}
              disabled={loading}
              className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left relative overflow-hidden group ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {/* 배경 그라데이션 */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-0 group-hover:opacity-5 transition-opacity`}
              />

              {/* 내용 */}
              <div className="relative">
                <div className="flex items-start gap-4 mb-3">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${template.color} flex items-center justify-center text-2xl shadow-lg`}
                  >
                    {template.emoji}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-extrabold text-slate-900 text-lg mb-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      {template.description}
                    </p>
                  </div>
                </div>

                {/* 전송 버튼 */}
                <div className="flex items-center justify-end mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
                    <Send className="w-4 h-4" />
                    <span>테스트 발송</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 안내 사항 */}
        <div className="mt-8 bg-orange-50 rounded-2xl p-6 border border-orange-200">
          <h3 className="font-extrabold text-orange-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            주의사항
          </h3>
          <ul className="space-y-2 text-sm text-orange-800">
            <li className="flex items-start gap-2">
              <span className="text-orange-600 font-bold">•</span>
              <span>
                <strong>EmailJS Service ID</strong> <code className="bg-orange-100 px-2 py-0.5 rounded">/src/lib/emailjs.ts</code>에서 설정했는지 확인하세요
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 font-bold">•</span>
              <span>
                <strong>Template ID</strong>가 <code className="bg-orange-100 px-2 py-0.5 rounded">template_tfb0g9l</code>인지 확인하세요
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 font-bold">•</span>
              <span>
                이메일이 도착하지 않으면 <strong>스팸 메일함</strong>을 확인하세요
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 font-bold">•</span>
              <span>
                EmailJS 무료 플랜은 <strong>월 200건</strong> 제한이 있습니다
              </span>
            </li>
          </ul>
        </div>

        {/* 가이드 링크 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 mb-2">
            자세한 설정 방법은 프로젝트 루트의 가이드 파일을 참고하세요
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <code className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700">
              EMAILJS_SETUP.md
            </code>
            <code className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700">
              QUICK_START.md
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}