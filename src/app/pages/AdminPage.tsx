import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ChevronRight, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { mockRequests, mockRepairers, mockQuotes } from '../data/mockData';

type AdminView = 'main' | 'requests' | 'repairers' | 'quotes';

export function AdminPage() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<AdminView>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('전체');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="px-4 h-14 flex items-center justify-between">
          {currentView !== 'main' ? (
            <button onClick={() => setCurrentView('main')} className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">뒤로</span>
            </button>
          ) : (
            <button onClick={() => navigate('/my')} className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">마이페이지</span>
            </button>
          )}
          <Link to="/explore" className="text-sm text-gray-600">
            홈으로
          </Link>
        </div>
      </header>

      {currentView === 'main' && <MainView onNavigate={setCurrentView} />}
      {currentView === 'requests' && <RequestsView searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedFilter={selectedFilter} setSelectedFilter={setSelectedFilter} />}
      {currentView === 'repairers' && <RepairersView searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
      {currentView === 'quotes' && <QuotesView />}
    </div>
  );
}

function MainView({ onNavigate }: { onNavigate: (view: AdminView) => void }) {
  const stats = [
    { label: '대기중인 모임', value: mockRequests.filter(r => r.status === 'pending').length, icon: '⏳', color: 'bg-orange-100 text-orange-600' },
    { label: '진행중인 모임', value: mockRequests.filter(r => r.status === 'in-progress').length, icon: '🐾', color: 'bg-amber-100 text-amber-600' },
    { label: '완료된 모임', value: mockRequests.filter(r => r.status === 'completed').length, icon: '✅', color: 'bg-green-100 text-green-600' },
    { label: '전체 댕집사', value: mockRepairers.length, icon: '🐕', color: 'bg-purple-100 text-purple-600' },
  ];

  const menuItems = [
    { id: 'requests' as AdminView, label: '모임 관리', icon: '📝', count: mockRequests.length },
    { id: 'repairers' as AdminView, label: '댕집사 관리', icon: '🐕', count: mockRepairers.length },
    { id: 'quotes' as AdminView, label: '참여 신청 관리', icon: '💰', count: mockQuotes.length },
  ];

  return (
    <div className="p-4">
      {/* 통계 카드 */}
      <div className="mb-6">
        <h2 className="font-bold text-base mb-3">실시간 통계</h2>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className={`${stat.color} rounded-2xl p-4`}>
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 메뉴 */}
      <div className="mb-6">
        <h2 className="font-bold text-base mb-3">관리 메뉴</h2>
        <div className="bg-white rounded-2xl overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between p-4 ${
                index !== menuItems.length - 1 ? 'border-b' : ''
              } active:bg-gray-50`}
            >
              <div className="flex items-center gap-3">
                <div className="text-xl">{item.icon}</div>
                <span className="font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{item.count}건</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 최근 활동 */}
      <div>
        <h2 className="font-bold text-base mb-3">최근 활동</h2>
        <div className="space-y-2">
          {mockRequests.slice(0, 5).map((request) => (
            <div key={request.id} className="bg-white rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-sm line-clamp-1">{request.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                  request.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                  request.status === 'in-progress' ? 'bg-amber-100 text-amber-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {request.status === 'pending' ? '대기' : request.status === 'in-progress' ? '진행중' : '완료'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{request.userName}</span>
                <span>•</span>
                <span>{request.district}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(request.createdAt), { locale: ko })} 전</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RequestsView({ 
  searchQuery, 
  setSearchQuery,
  selectedFilter,
  setSelectedFilter 
}: { 
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedFilter: string;
  setSelectedFilter: (f: string) => void;
}) {
  const filters = ['전체', '대기중', '진행중', '완료'];
  
  const filteredRequests = mockRequests.filter(req => {
    const matchesSearch = !searchQuery || 
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      selectedFilter === '전체' ||
      (selectedFilter === '대기중' && req.status === 'pending') ||
      (selectedFilter === '진행중' && req.status === 'in-progress') ||
      (selectedFilter === '완료' && req.status === 'completed');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-4">
      {/* 검색 */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="모임 검색"
            className="w-full pl-10 pr-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
              selectedFilter === filter
                ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                : 'bg-white border text-gray-700'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* 리스트 */}
      <div className="space-y-3">
        {filteredRequests.map((request) => {
          const quoteCount = mockQuotes.filter(q => q.repairRequestId === request.id).length;
          return (
            <Link
              key={request.id}
              to={`/meetup/${request.id}`}
              className="block bg-white rounded-xl p-4 active:bg-gray-50"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium flex-1 line-clamp-1">{request.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                  request.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                  request.status === 'in-progress' ? 'bg-amber-100 text-amber-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {request.status === 'pending' ? '대기' : request.status === 'in-progress' ? '진행중' : '완료'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{request.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span>{request.userName}</span>
                  <span>•</span>
                  <span>{request.district}</span>
                </div>
                {quoteCount > 0 && (
                  <span className="text-orange-600 font-medium">신청 {quoteCount}개</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function RepairersView({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (q: string) => void }) {
  const filteredRepairers = mockRepairers.filter(rep => 
    !searchQuery || rep.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4">
      {/* 검색 */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="댕집사 검색"
            className="w-full pl-10 pr-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* 리스트 */}
      <div className="space-y-3">
        {filteredRepairers.map((repairer) => (
          <Link
            key={repairer.id}
            to={`/sitter/${repairer.id}`}
            className="block bg-white rounded-xl p-4 active:bg-gray-50"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-bold text-lg">{repairer.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold mb-1">{repairer.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <span>⭐ {repairer.rating}</span>
                  <span>•</span>
                  <span>리뷰 {repairer.reviewCount}</span>
                  <span>•</span>
                  <span>{repairer.experience}</span>
                </div>
                <p className="text-xs text-gray-500">{repairer.district}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {repairer.specialties.map(spec => (
                <span key={spec} className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded-full">
                  {spec}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function QuotesView() {
  return (
    <div className="p-4">
      <div className="space-y-3">
        {mockQuotes.map((quote) => {
          const request = mockRequests.find(r => r.id === quote.repairRequestId);
          return (
            <div key={quote.id} className="bg-white rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold mb-1">{quote.repairerName}</h3>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {request?.title}
                  </p>
                </div>
                <div className="text-right ml-3">
                  <div className="text-lg font-bold text-orange-600">{quote.estimatedCost}</div>
                  <div className="text-xs text-gray-500">{quote.estimatedDuration}</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 mb-2">
                <p className="text-sm text-gray-700">{quote.message}</p>
              </div>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(quote.createdAt), { locale: ko })} 전
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}