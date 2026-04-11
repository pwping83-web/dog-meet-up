import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PageInfo {
  path: string;
  name: string;
  emoji: string;
  category: string;
}

const pages: PageInfo[] = [
  // 메인 플로우
  { path: '/', name: '홈', emoji: '🏠', category: '메인' },
  { path: '/explore', name: '탐색', emoji: '🧭', category: '메인' },
  
  // 모임 관련
  { path: '/search', name: '댕친 검색', emoji: '🔍', category: '모임' },
  { path: '/create-meetup', name: '모임 만들기', emoji: '➕', category: '모임' },
  { path: '/meetup/1', name: '모임 상세', emoji: '📝', category: '모임' },
  
  // 댕집사
  { path: '/sitters', name: '댕친 목록', emoji: '🐕', category: '댕집사' },
  { path: '/sitter/r1', name: '댕친 프로필', emoji: '👤', category: '댕집사' },
  { path: '/become-sitter', name: '댕집사 등록', emoji: '✍️', category: '댕집사' },
  
  // 채팅 & 알림
  { path: '/chats', name: '채팅 목록', emoji: '💬', category: '소통' },
  { path: '/chat/1', name: '채팅 상세', emoji: '💭', category: '소통' },
  { path: '/notifications', name: '알림', emoji: '🔔', category: '소통' },
  
  // 사용자
  { path: '/my', name: '마이페이지', emoji: '👤', category: '사용자' },
  { path: '/billing', name: '결제·프리미엄', emoji: '💳', category: '사용자' },
  { path: '/login', name: '로그인', emoji: '🔐', category: '사용자' },
  { path: '/signup', name: '회원가입', emoji: '📝', category: '사용자' },
  { path: '/delete-account', name: '회원탈퇴', emoji: '🗑️', category: '사용자' },
  { path: '/customer-service', name: '고객센터', emoji: '❓', category: '사용자' },
  
  // 관리자
  { path: '/admin', name: '관리자 대시보드', emoji: '⚙️', category: '관리자' },
];

export function DevPageNavigator() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!import.meta.env.DEV) {
    return null;
  }

  const groupedPages = pages.reduce((acc, page) => {
    if (!acc[page.category]) acc[page.category] = [];
    acc[page.category].push(page);
    return acc;
  }, {} as Record<string, PageInfo[]>);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* 떠다니는 버튼 */}
      <motion.button
        className="fixed bottom-24 right-6 z-[9999] bg-gradient-to-br from-orange-500 to-yellow-500 text-white rounded-full shadow-2xl border-2 border-white/20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </motion.button>

      {/* 페이지 메뉴 오버레이 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* 메뉴 패널 */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-32 right-6 z-[9999] bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm w-80"
              style={{ maxHeight: '70vh' }}
            >
              {/* 헤더 */}
              <div className="bg-gradient-to-br from-orange-500 to-yellow-500 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">🧭 페이지 이동</h3>
                    <p className="text-xs text-white/80 mt-0.5">개발용 네비게이터</p>
                  </div>
                  <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    {pages.length}개
                  </div>
                </div>
              </div>

              {/* 현재 페이지 */}
              <div className="px-4 py-3 bg-orange-50 border-b">
                <div className="text-xs text-orange-600 font-semibold mb-1">현재 페이지</div>
                <div className="text-sm text-gray-700">{location.pathname}</div>
              </div>

              {/* 페이지 목록 */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 180px)' }}>
                {Object.entries(groupedPages).map(([category, categoryPages]) => (
                  <div key={category} className="border-b last:border-b-0">
                    {/* 카테고리 헤더 */}
                    <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 sticky top-0">
                      {category}
                    </div>

                    {/* 페이지 버튼들 */}
                    {categoryPages.map((page) => {
                      const isCurrent = location.pathname === page.path;
                      return (
                        <button
                          key={page.path}
                          onClick={() => handleNavigate(page.path)}
                          className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                            isCurrent
                              ? 'bg-orange-100 border-l-4 border-orange-500'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-2xl">{page.emoji}</span>
                          <div className="flex-1 text-left">
                            <div className={`text-sm font-medium ${
                              isCurrent ? 'text-orange-700' : 'text-gray-900'
                            }`}>
                              {page.name}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {page.path}
                            </div>
                          </div>
                          {isCurrent && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}