// src/app/pages/SearchPage.tsx 전체 교체
import { Link } from 'react-router';
import { ArrowLeft, Search, X, ChevronRight, Home, Wrench, MessageCircle, User } from 'lucide-react';
import { useState } from 'react';
import { mockRequests } from '../data/mockData';

const popularSearches = [
  '소형견', '중형견', '대형견', '산책',
  '훈련', '사회화', '퍼피', '시니어',
];

const recentSearches = [
  '강아지 산책', '퍼피 사회화', '대형견 모임',
];

export function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filteredRequests = mockRequests.filter(
    (request) =>
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowResults(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 글래스모피즘 헤더 & 검색창 */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-slate-100 z-50">
        <div className="px-3 py-3 flex items-center gap-3 max-w-screen-md mx-auto">
          <Link to="/" className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="어떤 댕친을 찾으시나요? 🐾"
              className="w-full pl-11 pr-10 h-12 bg-slate-50/80 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl focus:ring-4 focus:ring-orange-500/10 transition-all text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-medium"
              autoFocus
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-screen-md mx-auto">
        {/* 검색 결과 화면 */}
        {showResults && searchQuery ? (
          <div className="p-5">
            <div className="mb-5 flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">검색 결과</span>
              <span className="text-sm font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg">{filteredRequests.length}건</span>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-4">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-5">
                  <Search className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-slate-600 font-bold text-lg mb-2">검색 결과가 없어요</p>
                <p className="text-sm text-slate-400 font-medium">다른 키워드로 다시 검색해보세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <Link key={request.id} to={`/meetup/${request.id}`} className="block group">
                    <div className="flex gap-4 p-4 bg-white rounded-3xl border border-slate-100 transition-all duration-200 hover:shadow-md hover:border-orange-100 active:scale-[0.98]">
                      {request.images && request.images.length > 0 ? (
                        <div className="w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                          <img src={request.images[0]} alt={request.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex-shrink-0 flex items-center justify-center border border-slate-100">
                           <span className="text-slate-300 text-xs font-bold">No Image</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0 py-1">
                        <h3 className="font-extrabold text-base text-slate-800 mb-1.5 line-clamp-2 group-hover:text-orange-600 transition-colors">
                          {request.title}
                        </h3>
                        <p className="text-xs font-medium text-slate-500 mb-2.5">{request.district}</p>
                        <p className="font-black text-lg text-orange-600 tracking-tight">
                          {request.estimatedCost || '참여 모집중'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-5">
            {/* 최근 검색어 */}
            {recentSearches.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="font-extrabold text-lg text-slate-900">최근 검색어</h2>
                  <button className="text-xs font-bold text-slate-400 hover:text-slate-600">전체 삭제</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, index) => (
                    <div key={index} className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-slate-50 border border-slate-100 rounded-xl group hover:bg-slate-100 transition-colors">
                      <button onClick={() => handleSearch(term)} className="text-sm font-bold text-slate-600 group-hover:text-orange-600 transition-colors">
                        {term}
                      </button>
                      <button className="p-1 text-slate-300 hover:text-slate-500 rounded-full">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 인기 검색어 */}
            <div className="mb-10">
              <h2 className="font-extrabold text-lg text-slate-900 mb-4 px-1">🔥 인기 검색어</h2>
              <div className="flex flex-wrap gap-2.5">
                {popularSearches.map((term, index) => (
                  <button key={index} onClick={() => handleSearch(term)} className="px-4 py-2 bg-orange-50/50 border border-orange-100 text-orange-700 rounded-xl text-sm font-bold hover:bg-orange-100 hover:text-orange-800 transition-colors">
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* 카테고리 (스쿼클 카드) */}
            <div className="mt-4">
              <h2 className="font-extrabold text-lg text-slate-900 mb-4 px-1">카테고리별 찾기</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { name: '소형견', emoji: '🐕', count: 42 },
                  { name: '중형견', emoji: '🐶', count: 38 },
                  { name: '대형견', emoji: '🦮', count: 26 },
                  { name: '산책', emoji: '🐾', count: 55 },
                  { name: '훈련', emoji: '🎓', count: 32 },
                  { name: '사회화', emoji: '🤝', count: 28 },
                  { name: '놀이', emoji: '⚽', count: 23 },
                ].map((category) => (
                  <button key={category.name} onClick={() => handleSearch(category.name)} className="flex flex-col items-center justify-center p-5 bg-white border border-slate-100 rounded-3xl hover:border-orange-200 hover:shadow-md transition-all duration-200 active:scale-95 group">
                    <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">{category.emoji}</div>
                    <div className="text-sm font-extrabold text-slate-800 mb-1 group-hover:text-orange-600">{category.name}</div>
                    <div className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{category.count}건</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 실시간 모임 */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="font-extrabold text-lg text-slate-900">🐾 동네 댕친 모임</h2>
                <Link to="/" className="text-xs font-bold text-orange-600 hover:underline">더보기</Link>
              </div>
              <div className="space-y-3">
                {mockRequests.slice(0, 4).map((request) => (
                  <Link key={request.id} to={`/meetup/${request.id}`} className="block group">
                    <div className="flex gap-4 p-4 bg-white rounded-3xl border border-slate-100 transition-all duration-200 hover:shadow-md hover:border-orange-100 active:scale-[0.98]">
                      {request.images && request.images.length > 0 ? (
                        <div className="w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                          <img src={request.images[0]} alt={request.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex-shrink-0 flex items-center justify-center border border-slate-100">
                          <span className="text-3xl">
                            {request.category === '산책' ? '🐕' : 
                             request.category === '훈련' ? '🎓' : 
                             request.category === '놀이' ? '🎾' :
                             request.category === '카페' ? '☕' :
                             request.category === '교배' ? '🐶' :
                             request.category === '실종' ? '🚨' :
                             request.category === '대형견' ? '🦮' : '🐾'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0 py-1">
                        <h3 className="font-bold text-sm text-slate-800 mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {request.title}
                        </h3>
                        <p className="text-xs font-medium text-slate-500 mb-2">{request.district} · 방금 전</p>
                        {request.estimatedCost && (
                          <p className="font-extrabold text-base text-orange-600 tracking-tight">
                            {request.estimatedCost}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom tab navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200/60 z-50 pb-safe max-w-[430px] mx-auto">
        <div className="flex items-center justify-around h-16 max-w-screen-md mx-auto px-2">
          <Link to="/" className="flex flex-col items-center gap-1 text-slate-400 hover:text-orange-600 transition-colors">
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-bold">홈</span>
          </Link>
          <Link to="/search" className="flex flex-col items-center gap-1 text-orange-600">
            <Search className="w-6 h-6" />
            <span className="text-[10px] font-bold">검색</span>
          </Link>
          
          {/* Central write button */}
          <Link to="/create-meetup" className="flex flex-col items-center -mt-6 group">
            <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 group-active:scale-95 transition-all">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-slate-500 mt-1.5">글쓰기</span>
          </Link>
          
          <Link to="/chats" className="flex flex-col items-center gap-1 text-slate-400 hover:text-orange-600 transition-colors">
            <MessageCircle className="w-6 h-6" />
            <span className="text-[10px] font-bold">채팅</span>
          </Link>
          <Link to="/my" className="flex flex-col items-center gap-1 text-slate-400 hover:text-orange-600 transition-colors">
            <User className="w-6 h-6" />
            <span className="text-[10px] font-bold">내댕댕</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}