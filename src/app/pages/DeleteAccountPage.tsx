import { useState } from 'react';
import { useNavigate } from 'react-router';

export function DeleteAccountPage() {
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [agreed, setAgreed] = useState(false);

  const reasons = [
    '더 이상 사용하지 않아요',
    '다른 서비스를 사용해요',
    '개인정보가 걱정돼요',
    '원하는 댕친을 찾기 어려워요',
    '앱 사용이 불편해요',
    '기타',
  ];

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== '회원탈퇴') {
      alert('회원탈퇴를 정확히 입력해주세요');
      return;
    }
    // 탈퇴 처리
    alert('회원탈퇴가 완료되었습니다.');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 bg-white border-b z-50">
        <div className="px-4 h-14 flex items-center">
          <button onClick={() => navigate('/my')} className="p-2 -ml-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold ml-2">회원 탈퇴</h1>
        </div>
      </header>

      <div className="p-6 max-w-md mx-auto">
        {/* 경고 메시지 */}
        <div className="mb-8 text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold mb-2">
            정말 떠나시나요?
          </h2>
          <p className="text-sm text-gray-600">
            탈퇴하시면 아래 정보들이 모두 삭제돼요
          </p>
        </div>

        {/* 삭제될 정보 */}
        <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              <div className="text-sm">
                <div className="font-medium text-red-900">작성한 모임 글</div>
                <div className="text-red-700">모든 게시글이 삭제돼요</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              <div className="text-sm">
                <div className="font-medium text-red-900">모임 내역</div>
                <div className="text-red-700">참여 이력을 확인할 수 없어요</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              <div className="text-sm">
                <div className="font-medium text-red-900">채팅 기록</div>
                <div className="text-red-700">모든 대화 내용이 사라져요</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              <div className="text-sm">
                <div className="font-medium text-red-900">프로필 정보</div>
                <div className="text-red-700">복구할 수 없어요</div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleDelete}>
          {/* 탈퇴 사유 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">
              떠나시는 이유를 알려주세요 (선택)
            </label>
            <div className="space-y-2">
              {reasons.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className="text-sm">{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 상세 의견 */}
          {reason && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                자세한 의견을 들려주세요 (선택)
              </label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="더 나은 서비스를 만드는데 큰 도움이 돼요"
                rows={4}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
          )}

          {/* 탈퇴 확인 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              아래에 <span className="text-red-500 font-bold">회원탈퇴</span>를 입력해주세요
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="회원탈퇴"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          {/* 최종 동의 */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 accent-orange-500 mt-0.5"
                required
              />
              <span className="text-sm text-gray-700">
                위 내용을 모두 확인했으며, 회원 탈퇴에 동의합니다
              </span>
            </label>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/my')}
              className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-lg font-bold hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!agreed || confirmText !== '회원탈퇴'}
              className="flex-1 bg-red-500 text-white py-3.5 rounded-lg font-bold hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              탈퇴하기
            </button>
          </div>
        </form>

        {/* 도움말 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <div className="font-medium mb-1">💡 잠깐!</div>
            <div>탈퇴 대신 계정을 비활성화하고 싶으신가요?</div>
            <button className="text-orange-500 font-medium mt-2">
              계정 비활성화 알아보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}