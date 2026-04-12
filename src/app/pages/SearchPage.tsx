// src/app/pages/SearchPage.tsx 전체 교체
import { Link, useLocation } from 'react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  Home,
  MessageCircle,
  User,
  PlusCircle,
} from 'lucide-react';
import { mockRequests } from '../data/mockData';
import { meetupCategoryEmoji } from '../utils/meetupCategory';
import { meetupVisibleInPublicFeed } from '../utils/meetupPublicVisibility';
import { getMergedMeetups } from '../../lib/userMeetupsStore';
import { useAuth } from '../../contexts/AuthContext';
import { AiDoumiButton } from '../components/AiDoumiButton';

const popularSearches = [
  '소형견', '중형견', '대형견', '산책',
  '훈련', '사회화', '퍼피', '시니어',
];

const RECENT_SEARCHES_KEY = 'daeng-recent-searches';
const DEFAULT_RECENT = ['강아지 산책', '퍼피 사회화', '대형견 모임'];

function readRecentFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (raw === null) return [...DEFAULT_RECENT];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
      return parsed.slice(0, 20);
    }
  } catch {
    /* ignore */
  }
  return [...DEFAULT_RECENT];
}

function persistRecent(next: string[]) {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function upsertRecent(prev: string[], term: string): string[] {
  const t = term.trim();
  if (!t) return prev;
  const without = prev.filter((x) => x !== t);
  return [t, ...without].slice(0, 15);
}

export function SearchPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    typeof window !== 'undefined' ? readRecentFromStorage() : [...DEFAULT_RECENT],
  );

  const [meetupFeedTick, setMeetupFeedTick] = useState(0);
  useEffect(() => {
    const onMeetups = () => setMeetupFeedTick((t) => t + 1);
    window.addEventListener('daeng-user-meetups-changed', onMeetups);
    return () => window.removeEventListener('daeng-user-meetups-changed', onMeetups);
  }, []);

  const mergedRequests = useMemo(
    () => getMergedMeetups(mockRequests),
    [location.key, location.pathname, meetupFeedTick],
  );

  const filteredRequests = mergedRequests.filter(
    (request) =>
      meetupVisibleInPublicFeed(request) &&
      (request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  /** 입력창 타이핑 — 최근 검색 목록에는 넣지 않음 */
  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    setShowResults(value.trim().length > 0);
  };

  /** 칩·카테고리·엔터 확정 시 검색 + 최근 검색에 반영 */
  const selectSearch = useCallback((query: string) => {
    const q = query.trim();
    setSearchQuery(q);
    setShowResults(q.length > 0);
    if (!q) return;
    setRecentSearches((prev) => {
      const next = upsertRecent(prev, q);
      persistRecent(next);
      return next;
    });
  }, []);

  const removeRecent = (term: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((x) => x !== term);
      persistRecent(next);
      return next;
    });
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    persistRecent([]);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* 글래스모피즘 헤더 & 검색창 */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="px-3 py-3 flex items-center gap-2 max-w-screen-md mx-auto">
          <Link to="/explore" className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors" aria-label="메인으로">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const q = searchQuery.trim();
                  if (q) selectSearch(q);
                }
              }}
              placeholder="어떤 댕친을 찾으시나요? 🐾"
              className="h-12 w-full rounded-2xl border-transparent bg-slate-50/80 pl-11 pr-10 font-bold text-slate-900 transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/15"
              autoFocus
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {user && (
            <AiDoumiButton
              task="search_parse"
              className="shrink-0 px-2 py-1.5 text-[10px]"
              payload={{ query: searchQuery.trim() || '주말 소형견 산책 모임' }}
              onDone={(r) => {
                if (!r.ok) {
                  alert(r.error);
                  return;
                }
                const q = r.fields?.suggestedSearch?.trim();
                if (q) selectSearch(q);
                else alert('검색어를 만들지 못했어요.');
              }}
            >
              검색 도우미
            </AiDoumiButton>
          )}
        </div>
      </header>

      <div className="max-w-screen-md mx-auto">
        {/* 검색 결과 화면 */}
        {showResults && searchQuery ? (
          <div className="p-5">
            <div className="mb-5 flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">검색 결과</span>
              <span className="rounded-lg bg-orange-50 px-2 py-0.5 text-sm font-extrabold text-brand">
                {filteredRequests.length}건
              </span>
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
                    <div className="flex gap-4 p-4 bg-white rounded-3xl border border-slate-100 transition-all duration-200 hover:shadow-md hover:border-orange-200 active:scale-[0.98]">
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
                        <h3 className="font-extrabold text-base text-slate-800 mb-1.5 line-clamp-2 group-hover:text-brand transition-colors">
                          {request.title}
                        </h3>
                        <p className="text-xs font-medium text-slate-500 mb-2.5">{request.district}</p>
                        <p className="font-black text-lg text-brand tracking-tight">
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
                  <button
                    type="button"
                    onClick={clearAllRecent}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600"
                  >
                    전체 삭제
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-slate-50 border border-slate-100 rounded-xl group hover:bg-slate-100 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => selectSearch(term)}
                        className="text-sm font-bold text-slate-600 group-hover:text-brand transition-colors"
                      >
                        {term}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecent(term);
                        }}
                        className="p-1 text-slate-300 hover:text-slate-500 rounded-full"
                        aria-label={`${term} 삭제`}
                      >
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
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectSearch(term)}
                    className="rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-2 text-sm font-bold text-orange-900 transition-colors hover:bg-orange-100 hover:text-orange-950"
                  >
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
                ].map((category) => (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => selectSearch(category.name)}
                    className="flex flex-col items-center justify-center p-5 bg-white border border-slate-100 rounded-3xl hover:border-orange-200 hover:shadow-md transition-all duration-200 active:scale-95 group"
                  >
                    <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">{category.emoji}</div>
                    <div className="text-sm font-extrabold text-slate-800 mb-1 group-hover:text-brand">{category.name}</div>
                    <div className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{category.count}건</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 실시간 모임 */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-extrabold text-slate-900">🙌 모이자 · 만나자</h2>
                <Link to="/explore" className="text-xs font-bold text-brand hover:underline">더보기</Link>
              </div>
              <div className="space-y-3">
                {mergedRequests.slice(0, 4).map((request) => (
                  <Link key={request.id} to={`/meetup/${request.id}`} className="block group">
                    <div className="flex gap-4 p-4 bg-white rounded-3xl border border-slate-100 transition-all duration-200 hover:shadow-md hover:border-orange-200 active:scale-[0.98]">
                      {request.images && request.images.length > 0 ? (
                        <div className="w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                          <img src={request.images[0]} alt={request.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex-shrink-0 flex items-center justify-center border border-slate-100">
                          <span className="text-3xl">{meetupCategoryEmoji(request.category)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0 py-1">
                        <h3 className="font-bold text-sm text-slate-800 mb-1 line-clamp-1 group-hover:text-brand transition-colors">
                          {request.title}
                        </h3>
                        <p className="text-xs font-medium text-slate-500 mb-2">{request.district} · 방금 전</p>
                        {request.estimatedCost && (
                          <p className="font-extrabold text-base text-brand tracking-tight">
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
          <Link
            to="/explore"
            className={`flex flex-col items-center gap-1 transition-colors ${
              location.pathname === '/explore' ? 'text-brand' : 'text-slate-400 hover:text-brand'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-bold">홈</span>
          </Link>
          <Link to="/search" className="flex flex-col items-center gap-1 text-brand">
            <Search className="w-6 h-6" />
            <span className="text-[10px] font-bold">검색</span>
          </Link>
          
          <Link
            to="/create-meetup"
            className="group -mt-1 flex flex-shrink-0 items-center justify-center max-md:-mt-0.5"
            aria-label="글 올리기 · 모이자·만나자·돌봄 맡기기"
            title="글 올리기 · 모이자·만나자·돌봄 맡기기"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.15rem] border-[3px] border-white bg-gradient-to-br from-orange-500 to-yellow-400 shadow-lg shadow-orange-400/45 transition-all group-active:scale-90 max-md:h-[3.65rem] max-md:w-[3.65rem]">
              <PlusCircle className="h-7 w-7 text-white max-md:h-7 max-md:w-7" />
            </div>
          </Link>
          
          <Link to="/chats" className="flex flex-col items-center gap-1 text-slate-400 hover:text-brand transition-colors">
            <MessageCircle className="w-6 h-6" />
            <span className="text-[10px] font-bold">채팅</span>
          </Link>
          <Link to="/my" className="flex flex-col items-center gap-1 text-slate-400 hover:text-brand transition-colors">
            <User className="w-6 h-6" />
            <span className="text-[10px] font-bold">내댕댕</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}