import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import {
  ArrowLeft,
  Search,
  X,
  Home,
  MessageCircle,
  User,
  PlusCircle,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { mockRequests } from '../data/mockData';
import { meetupVisibleInPublicFeed } from '../utils/meetupPublicVisibility';
import { usePromoFreeListings } from '../../lib/promoFlags';
import { getMergedMeetups } from '../../lib/userMeetupsStore';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { meetupCoverImageUrl, sanitizeDogProfileForPublicDisplay, virtualDogPhotoForSeed } from '../data/virtualDogPhotos';
import { useAuth } from '../../contexts/AuthContext';
import { isAppAdmin } from '../../lib/appAdmin';
import { supabase } from '../../lib/supabase';
import { interceptGuestNav } from '../../lib/guestNavGuard';
import { useCachedDogs } from '../../hooks/useCachedDogs';
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
  const navigate = useNavigate();
  const promoFree = usePromoFreeListings();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dogsListView = searchParams.get('view') === 'dogs';

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [showResults, setShowResults] = useState(false);
  const { dogs: dbDogs, loading: dogsLoading, refetch: refetchDogs } = useCachedDogs({ enabled: dogsListView });
  const [deletingDogId, setDeletingDogId] = useState<string | null>(null);
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

  const filteredRequests = useMemo(
    () =>
      mergedRequests.filter(
        (request) =>
          meetupVisibleInPublicFeed(request, promoFree) &&
          (request.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            request.category.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            request.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())),
      ),
    [mergedRequests, debouncedSearchQuery, promoFree],
  );

  const filteredDogs = useMemo(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();
    if (!q) return dbDogs;
    return dbDogs.filter((dog) => {
      const d = sanitizeDogProfileForPublicDisplay({
        id: String(dog.id),
        name: typeof dog.name === 'string' ? dog.name : '',
        breed: dog.breed != null ? String(dog.breed) : null,
        age: typeof dog.age === 'number' && Number.isFinite(dog.age) ? dog.age : null,
        gender: dog.gender != null ? String(dog.gender) : null,
        photo_url: dog.photo_url != null ? String(dog.photo_url) : null,
        owner_avatar_url: typeof dog.owner_avatar_url === 'string' ? dog.owner_avatar_url : null,
      });
      const hay = `${d.name} ${d.breed ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [dbDogs, debouncedSearchQuery]);

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

  const handleAdminDeleteDog = useCallback(
    async (id: string) => {
      if (!user || !isAppAdmin(user)) return;
      if (!window.confirm('이 댕친 프로필을 삭제할까요?')) return;
      setDeletingDogId(id);
      try {
        const { error } = await supabase.from('dog_profiles').delete().eq('id', id);
        if (error) throw error;
        window.dispatchEvent(new CustomEvent('daeng-dogs-changed'));
        await refetchDogs();
      } catch (e) {
        const msg = e instanceof Error ? e.message : '삭제에 실패했어요.';
        alert(msg);
      } finally {
        setDeletingDogId(null);
      }
    },
    [user, refetchDogs],
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
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
              placeholder={dogsListView ? '이름·품종으로 찾기 🐾' : '어떤 댕친을 찾으시나요? 🐾'}
              className="h-12 w-full rounded-2xl border-transparent bg-slate-50/80 pl-11 pr-10 font-bold text-slate-900 transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/15"
              autoFocus={!dogsListView}
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
          dogsListView ? (
            <div className="p-5">
              <div className="mb-5 flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">댕친 검색</span>
                <span className="rounded-lg bg-orange-50 px-2 py-0.5 text-sm font-extrabold text-brand">
                  {filteredDogs.length}마리
                </span>
              </div>
              {dogsLoading ? (
                <p className="py-16 text-center text-sm font-bold text-slate-400">불러오는 중…</p>
              ) : filteredDogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-4">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50">
                    <Search className="h-10 w-10 text-slate-300" />
                  </div>
                  <p className="mb-2 text-lg font-bold text-slate-600">맞는 댕친이 없어요</p>
                  <p className="text-center text-sm font-medium text-slate-400">다른 이름·품종으로 검색해보세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredDogs.map((dog) => {
                    const d = sanitizeDogProfileForPublicDisplay({
                      id: String(dog.id),
                      name: typeof dog.name === 'string' ? dog.name : '',
                      breed: dog.breed != null ? String(dog.breed) : null,
                      age: typeof dog.age === 'number' && Number.isFinite(dog.age) ? dog.age : null,
                      gender: dog.gender != null ? String(dog.gender) : null,
                      photo_url: dog.photo_url != null ? String(dog.photo_url) : null,
                      owner_avatar_url: typeof dog.owner_avatar_url === 'string' ? dog.owner_avatar_url : null,
                    });
                    const dogId = String(dog.id);
                    return (
                      <div
                        key={dog.id}
                        className="rounded-3xl border border-slate-100 bg-white p-4 text-center shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
                      >
                        <Link to={`/dog/${dog.id}`} className="block active:scale-[0.98]">
                          <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-orange-100 shadow-inner">
                            <ImageWithFallback
                              src={d.photoUrl}
                              fallbackSrc={virtualDogPhotoForSeed(`search-dogs-grid-fallback-${dog.id}`)}
                              alt={d.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <p className="truncate text-sm font-black text-slate-800">{d.name}</p>
                          <p className="truncate text-xs font-semibold text-slate-400">
                            {d.breed ?? ''}
                            {d.age != null ? ` · ${d.age}살` : ''}
                          </p>
                        </Link>
                        {isAppAdmin(user) && (
                          <button
                            type="button"
                            onClick={() => void handleAdminDeleteDog(dogId)}
                            disabled={deletingDogId === dogId}
                            className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-red-100 bg-red-50 py-2 text-[11px] font-extrabold text-red-600 active:scale-[0.98] disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            {deletingDogId === dogId ? '삭제 중…' : '삭제'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
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
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 shadow-sm">
                        <ImageWithFallback
                          src={meetupCoverImageUrl(request)}
                          fallbackSrc={virtualDogPhotoForSeed(`search-result-thumb-fallback-${request.id}`)}
                          alt={request.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
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
          )
        ) : dogsListView ? (
          <div className="p-5">
            <div className="mb-4 px-1">
              <h1 className="text-lg font-extrabold text-slate-900">새로운 댕친</h1>
              <p className="mt-1 text-sm font-semibold text-slate-400">최근 등록된 우리 동네 댕댕이</p>
            </div>
            {dogsLoading ? (
              <p className="py-16 text-center text-sm font-bold text-slate-400">불러오는 중…</p>
            ) : dbDogs.length === 0 ? (
              <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center">
                <p className="font-bold text-slate-600">아직 등록된 댕댕이가 없어요</p>
                <p className="mt-2 text-sm text-slate-400">첫 댕친이 되어 보세요!</p>
                <Link to="/my" className="mt-4 inline-block text-sm font-extrabold text-brand hover:underline">
                  내댕댕에서 프로필 등록
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {dbDogs.map((dog) => {
                  const d = sanitizeDogProfileForPublicDisplay({
                    id: String(dog.id),
                    name: typeof dog.name === 'string' ? dog.name : '',
                    breed: dog.breed != null ? String(dog.breed) : null,
                    age: typeof dog.age === 'number' && Number.isFinite(dog.age) ? dog.age : null,
                    gender: dog.gender != null ? String(dog.gender) : null,
                    photo_url: dog.photo_url != null ? String(dog.photo_url) : null,
                    owner_avatar_url: typeof dog.owner_avatar_url === 'string' ? dog.owner_avatar_url : null,
                  });
                  const dogId = String(dog.id);
                  return (
                    <div
                      key={dog.id}
                      className="rounded-3xl border border-slate-100 bg-white p-4 text-center shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
                    >
                      <Link to={`/dog/${dog.id}`} className="block rounded-2xl active:scale-[0.98]">
                        <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-orange-100 shadow-inner">
                          <ImageWithFallback
                            src={d.photoUrl}
                            fallbackSrc={virtualDogPhotoForSeed(`search-dogs-list-fallback-${dog.id}`)}
                            alt={d.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <p className="truncate text-sm font-black text-slate-800">{d.name}</p>
                        <p className="truncate text-xs font-semibold text-slate-400">
                          {d.breed ?? ''}
                          {d.age != null ? ` · ${d.age}살` : ''}
                        </p>
                      </Link>
                      <Link
                        to={user?.id && String(dog.owner_id || '') === user.id ? '/my' : `/dog/${dog.id}`}
                        className={`mt-2 inline-flex w-full items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-extrabold ${
                          user?.id && String(dog.owner_id || '') === user.id
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {user?.id && String(dog.owner_id || '') === user.id ? '내 프로필' : '프로필 보기'}
                      </Link>
                      {isAppAdmin(user) && (
                        <button
                          type="button"
                          onClick={() => void handleAdminDeleteDog(dogId)}
                          disabled={deletingDogId === dogId}
                          className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-red-100 bg-red-50 py-2 text-[11px] font-extrabold text-red-600 active:scale-[0.98] disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {deletingDogId === dogId ? '삭제 중…' : '삭제'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-8 rounded-2xl border border-orange-100 bg-orange-50/50 p-4 text-center">
              <p className="text-sm font-bold text-slate-700">모이자·만나자 모임을 찾고 있나요?</p>
              <Link to="/search" className="mt-2 inline-block text-sm font-extrabold text-brand hover:underline">
                모임·글 검색으로 이동
              </Link>
            </div>
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
                    className="min-h-10 touch-manipulation rounded-lg px-2 py-2 text-xs font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    전체 삭제
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 py-2 pl-3 pr-2 transition-colors group hover:bg-slate-100"
                    >
                      <button
                        type="button"
                        onClick={() => selectSearch(term)}
                        className="touch-manipulation py-0.5 pr-1 text-left text-sm font-bold text-slate-600 transition-colors group-hover:text-brand"
                      >
                        {term}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecent(term);
                        }}
                        className="flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200/90 hover:text-slate-600 active:bg-slate-300/50"
                        aria-label={`${term} 삭제`}
                      >
                        <X className="h-4 w-4" strokeWidth={2.25} />
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
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 shadow-sm">
                        <ImageWithFallback
                          src={meetupCoverImageUrl(request)}
                          fallbackSrc={virtualDogPhotoForSeed(`search-home-thumb-fallback-${request.id}`)}
                          alt={request.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
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
            onClick={(e) => interceptGuestNav(e, Boolean(user), navigate)}
            className="group -mt-1 flex flex-shrink-0 items-center justify-center max-md:-mt-0.5"
            aria-label="글 올리기 · 모이자·만나자·돌봄 맡기기"
            title="글 올리기 · 모이자·만나자·돌봄 맡기기"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.15rem] border-[3px] border-white bg-gradient-to-br from-orange-500 to-yellow-400 shadow-lg shadow-orange-400/45 transition-all group-active:scale-90 max-md:h-[3.65rem] max-md:w-[3.65rem]">
              <PlusCircle className="h-7 w-7 text-white max-md:h-7 max-md:w-7" />
            </div>
          </Link>
          
          <Link
            to="/chats"
            onClick={(e) => interceptGuestNav(e, Boolean(user), navigate)}
            className="flex flex-col items-center gap-1 text-slate-400 transition-colors hover:text-brand"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-[10px] font-bold">채팅</span>
          </Link>
          <Link
            to="/my"
            onClick={(e) => interceptGuestNav(e, Boolean(user), navigate)}
            className="flex flex-col items-center gap-1 text-slate-400 transition-colors hover:text-brand"
          >
            <User className="w-6 h-6" />
            <span className="text-[10px] font-bold">내댕댕</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}