import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { PLATFORM_LEGAL_FULL_ARTICLE } from '../../lib/platformLegalCopy';

export function CustomerServicePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'faq' | 'inquiry' | 'notice' | 'legal'>('faq');

  useEffect(() => {
    if (location.hash === '#legal') {
      setActiveTab('legal');
    }
  }, [location.hash]);

  const clearHash = () => {
    if (location.hash) {
      window.history.replaceState(null, '', location.pathname + location.search);
    }
  };
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inquiryCategory, setInquiryCategory] = useState('');
  const [inquiryTitle, setInquiryTitle] = useState('');
  const [inquiryContent, setInquiryContent] = useState('');
  const [email, setEmail] = useState('');

  const categories = [
    { id: 'all', name: '전체', icon: '📋' },
    { id: 'meeting', name: '모임/산책', icon: '🐕' },
    { id: 'training', name: '훈련/교육', icon: '🎓' },
    { id: 'account', name: '계정', icon: '👤' },
    { id: 'other', name: '기타', icon: '💬' },
  ];

  const faqs = [
    {
      id: 1,
      category: 'meeting',
      question: '산책 모임에 처음 참여하는데 준비물이 있나요?',
      answer: '목줄, 배변봉투, 물과 간식만 챙겨오시면 됩니다! 다른 댕친들과 친하게 지내는 우리 아이라면 더 즐거운 시간이 될 거예요 🐕',
    },
    {
      id: 2,
      category: 'meeting',
      question: '모임 참여 후 취소는 어떻게 하나요?',
      answer: '모임 시작 2간 전까지는 자유롭게 취소 가능합니다. 다만 다른 댕친들을 위해 미리 알려주시면 감사하겠습니다!',
    },
    {
      id: 3,
      category: 'training',
      question: '훈련 모임은 어떤 식으로 진행되나요?',
      answer: '전문 훈련사님이나 강아지 돌봄 경험이 많은 돌보미님이 기본 명령어부터 차근차근 알려드려요. 퍼피부터 시니어견까지 모두 환영합니다!',
    },
    {
      id: 4,
      category: 'meeting',
      question: '우리 강아지가 사람을 좋아하지 않는데 참여해도 될까요?',
      answer: '처음에는 거리를 두고 천천히 적응하는 시간을 가져보세요. 사회화 모임에서 점차 익숙해질 수 있습니다 🐾',
    },
    {
      id: 5,
      category: 'account',
      question: '동네 인증은 어떻게 하나요?',
      answer: 'GPS 위치 기반으로 자동 인증됩니다. 설정에서 위치 권한을 허용해주세요.',
    },
    {
      id: 6,
      category: 'training',
      question: '대형견도 모임에 참여할 수 있나요?',
      answer: '물론입니다! 모임 생성 시 댕친 크기를 선택하면 비슷한 크기의 강아지들과 만날 수 있어요. 대형견 전용 모임도 많습니다!',
    },
  ];

  const notices = [
    {
      id: 1,
      title: '🎉 댕댕마켓 정식 오픈!',
      date: '2026.02.23',
      content: '우리 동네 댕친들과 함께하는 댕댕마켓이 정식으로 오픈했습니다. 많은 관심 부탁드립니다!',
    },
    {
      id: 2,
      title: '🐾 전국 반려견 모임 1000개 돌파',
      date: '2026.02.20',
      content: '전국 주요 도시에서 다양한 산책, 훈련, 놀이 모임이 활발하게 진행되고 있습니다!',
    },
    {
      id: 3,
      title: '🔔 앱 업데이트 안내 (v1.0.1)',
      date: '2026.02.15',
      content: '댕친 프로필 기능 개선 및 채팅 기능 버그 수정이 완료되었습니다.',
    },
  ];

  const filteredFaqs = selectedCategory === 'all'
    ? faqs
    : faqs.filter(faq => faq.category === selectedCategory);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.');
    setInquiryCategory('');
    setInquiryTitle('');
    setInquiryContent('');
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-market-header shadow-market-lg">
        <div className="mx-auto flex h-14 max-w-screen-md items-center px-4">
          <button
            onClick={() => navigate('/explore')}
            className="-ml-2 rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
            type="button"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ml-2 text-lg font-extrabold text-white">댕댕센터 🐾</h1>
        </div>
      </header>

      {/* 탭 메뉴 */}
      <div className="sticky top-14 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <div className="flex max-w-screen-md mx-auto">
          <button
            type="button"
            onClick={() => {
              clearHash();
              setActiveTab('faq');
            }}
            className={`flex-1 border-b-2 py-3 text-xs font-bold transition-colors sm:text-sm ${
              activeTab === 'faq'
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-400'
            }`}
          >
            자주 묻는 질문
          </button>
          <button
            type="button"
            onClick={() => {
              clearHash();
              setActiveTab('inquiry');
            }}
            className={`flex-1 border-b-2 py-3 text-xs font-bold transition-colors sm:text-sm ${
              activeTab === 'inquiry'
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-400'
            }`}
          >
            1:1 문의
          </button>
          <button
            type="button"
            onClick={() => {
              clearHash();
              setActiveTab('notice');
            }}
            className={`flex-1 border-b-2 py-3 text-xs font-bold transition-colors sm:text-sm ${
              activeTab === 'notice'
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-400'
            }`}
          >
            공지사항
          </button>
          <button
            type="button"
            onClick={() => {
              window.history.replaceState(null, '', `${location.pathname}${location.search}#legal`);
              setActiveTab('legal');
            }}
            className={`flex-1 border-b-2 py-3 text-xs font-bold transition-colors sm:text-sm ${
              activeTab === 'legal'
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-400'
            }`}
          >
            법적 고지
          </button>
        </div>
      </div>

      {/* FAQ 탭 */}
      {activeTab === 'faq' && (
        <div className="max-w-screen-md mx-auto">
          {/* 카테고리 필터 */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-market-cta text-white shadow-market'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ 리스트 */}
          <div className="divide-y divide-slate-100">
            {filteredFaqs.map((faq) => (
              <details key={faq.id} className="group bg-white">
                <summary className="p-4 cursor-pointer hover:bg-slate-50 flex items-start gap-3 transition-colors">
                  <span className="mt-0.5 font-black text-brand">Q</span>
                  <div className="flex-1">
                    <div className="font-bold pr-6 text-slate-800">{faq.question}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-4 pb-4 pl-11 text-sm bg-slate-50 border-t border-slate-100">
                  <div className="flex gap-2 pt-4">
                    <span className="text-slate-400 font-bold">A</span>
                    <div className="text-slate-600 font-medium leading-relaxed">{faq.answer}</div>
                  </div>
                </div>
              </details>
            ))}
          </div>

          {/* 도움말 */}
          <div className="p-4 mt-4">
            <div className="rounded-3xl border border-brand/20 bg-brand-soft p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <div className="mb-1 font-bold text-slate-800">원하는 답변을 찾지 못하셨나요?</div>
                  <div className="mb-3 text-sm font-medium text-slate-600">
                    1:1 문의로 자세히 상담받으세요
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clearHash();
                      setActiveTab('inquiry');
                    }}
                    className="rounded-xl bg-market-cta px-5 py-2.5 text-sm font-bold text-white shadow-market transition-all hover:opacity-90"
                  >
                    1:1 문의하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1:1 문의 탭 */}
      {activeTab === 'inquiry' && (
        <div className="p-6 max-w-md mx-auto">
          <div className="mb-6 text-center">
            <div className="text-5xl mb-3">📨</div>
            <h2 className="text-xl font-extrabold mb-2 text-slate-900">무엇을 도와드릴까요?</h2>
            <p className="text-sm text-slate-500 font-medium">
              문의 내용을 남겨주시면<br />
              영업일 기준 1-2일 내에 답변드려요
            </p>
          </div>

          <form onSubmit={handleInquirySubmit}>
            {/* 문의 유형 */}
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2 text-slate-700">
                문의 유형 *
              </label>
              <select
                value={inquiryCategory}
                onChange={(e) => setInquiryCategory(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3.5 font-medium text-slate-800 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                required
              >
                <option value="">선택해주세요</option>
                <option value="meeting">🐕 모임/산책 문의</option>
                <option value="training">🎓 훈련/교육 문의</option>
                <option value="account">계정 문제</option>
                <option value="bug">오류 신고</option>
                <option value="suggest">기능 제안</option>
                <option value="other">기타</option>
              </select>
            </div>

            {/* 제목 */}
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2 text-slate-700">
                제목 *
              </label>
              <input
                type="text"
                value={inquiryTitle}
                onChange={(e) => setInquiryTitle(e.target.value)}
                placeholder="문의 제목을 입력해주세요"
                className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3.5 font-medium placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                required
              />
            </div>

            {/* 내용 */}
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2 text-slate-700">
                내용 *
              </label>
              <textarea
                value={inquiryContent}
                onChange={(e) => setInquiryContent(e.target.value)}
                placeholder="문의 내용을 자세히 작성해주세요"
                rows={6}
                className="w-full resize-none rounded-2xl border-2 border-slate-200 px-4 py-3.5 font-medium placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                required
              />
            </div>

            {/* 답변 받을 이메일 */}
            <div className="mb-6">
              <label className="block text-sm font-bold mb-2 text-slate-700">
                답변 받을 이메일 *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3.5 font-medium placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-market-cta py-4 font-bold text-white shadow-market-lg transition-all hover:opacity-95 active:scale-[0.98]"
            >
              문의하기
            </button>
          </form>

          {/* 빠른 연락처 */}
          <div className="mt-8 space-y-3">
            <div className="text-sm font-extrabold text-slate-700">빠른 연락처</div>
            
            <a
              href="tel:1588-1234"
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-brand/20 hover:bg-slate-50"
            >
              <span className="text-2xl">📞</span>
              <div className="flex-1">
                <div className="font-bold text-slate-800">전화 문의</div>
                <div className="text-sm text-slate-500 font-medium">1588-1234</div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </a>

            <a
              href="mailto:support@daengdaeng.com"
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-brand/20 hover:bg-slate-50"
            >
              <span className="text-2xl">✉️</span>
              <div className="flex-1">
                <div className="font-bold text-slate-800">이메일 문의</div>
                <div className="text-sm text-slate-500 font-medium">support@daengdaeng.com</div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </a>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-brand/20 hover:bg-slate-50"
            >
              <span className="text-2xl">💬</span>
              <div className="flex-1 text-left">
                <div className="font-bold text-slate-800">카카오톡 상담</div>
                <div className="text-sm text-slate-500 font-medium">평일 09:00 - 18:00</div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* 공지사항 탭 */}
      {activeTab === 'notice' && (
        <div className="divide-y divide-slate-100 max-w-screen-md mx-auto">
          {notices.map((notice) => (
            <button
              key={notice.id}
              className="w-full p-4 bg-white hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-bold mb-1 text-slate-800">{notice.title}</div>
                  <div className="text-sm text-slate-500 font-medium">{notice.date}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}

          {/* 더보기 */}
          <div className="p-4 text-center bg-white">
            <button type="button" className="text-sm font-bold text-slate-500 hover:text-brand">
              더보기 +
            </button>
          </div>
        </div>
      )}

      {activeTab === 'legal' && (
        <div className="mx-auto max-w-screen-md px-4 py-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-900">플랫폼 이용 범위 및 이용자 책임</h2>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">
              모이자·만나자(교배 포함)·돌봄·인증 보호맨 등 전 영역에 공통 적용됩니다.
            </p>
            <div className="mt-4 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700">
              {PLATFORM_LEGAL_FULL_ARTICLE}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}