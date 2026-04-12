import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ChevronRight, CreditCard, Loader2, Search, Shield } from 'lucide-react';
import { PawTabIcon } from '../components/icons/PawTabIcon';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { mockRequests, mockRepairers, mockQuotes } from '../data/mockData';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/supabase';
import { isPromoFreeListings } from '../../lib/promoFlags';

type AdminView = 'main' | 'requests' | 'repairers' | 'quotes' | 'guardCare';

type GuardMomRow = Database['public']['Tables']['certified_guard_moms']['Row'];
type BillingOrderRow = Database['public']['Tables']['billing_orders']['Row'];
type GuardBookingRow = Database['public']['Tables']['guard_mom_bookings']['Row'];

function billingProductLabel(key: string): string {
  const map: Record<string, string> = {
    premium_month: '댕댕 프리미엄 (월)',
    meetup_boost: '만남 글 부스트 (1회)',
    guard_mom_listing_7d: '인증 돌봄 목록 노출 (7일)',
    breeding_post_listing_7d: '만나자 교배 신청 글 노출 (7일)',
    guard_mom_care_day: '보호맘 돌봄 예약',
  };
  return map[key] ?? key;
}

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
            <button onClick={() => navigate('/explore')} className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">홈으로</span>
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
      {currentView === 'guardCare' && <GuardCareAdminView />}
    </div>
  );
}

function MainView({ onNavigate }: { onNavigate: (view: AdminView) => void }) {
  const stats = [
    { label: '대기중인 모임', value: mockRequests.filter(r => r.status === 'pending').length, icon: '⏳', color: 'bg-orange-100 text-orange-600' },
    { label: '진행중인 모임', value: mockRequests.filter(r => r.status === 'in-progress').length, icon: '🐾', color: 'bg-amber-100 text-amber-600' },
    { label: '완료된 모임', value: mockRequests.filter(r => r.status === 'completed').length, icon: '✅', color: 'bg-orange-100 text-orange-700' },
    { label: '전체 댕집사', value: mockRepairers.length, icon: '🐕', color: 'bg-amber-100 text-orange-800' },
  ];

  const menuItems = [
    { id: 'guardCare' as AdminView, label: '돌봄 회원·결제', icon: '🦴', count: null as number | null },
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
                <span className="text-sm text-gray-500">
                  {item.count != null ? `${item.count}건` : 'Supabase'}
                </span>
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
                  'bg-orange-100 text-orange-700'
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
                  'bg-orange-100 text-orange-700'
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

function GuardCareAdminView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certifyingId, setCertifyingId] = useState<string | null>(null);
  const [certBanner, setCertBanner] = useState<string | null>(null);
  const [guardMoms, setGuardMoms] = useState<GuardMomRow[]>([]);
  const [billingOrders, setBillingOrders] = useState<BillingOrderRow[]>([]);
  const [bookings, setBookings] = useState<GuardBookingRow[]>([]);
  const [nameByUserId, setNameByUserId] = useState<Record<string, string>>({});

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    const [gmRes, boRes, bkRes] = await Promise.all([
      supabase.from('certified_guard_moms').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('billing_orders').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('guard_mom_bookings').select('*').order('created_at', { ascending: false }).limit(300),
    ]);

    if (gmRes.error) {
      setError(gmRes.error.message);
      if (!silent) setLoading(false);
      return;
    }
    if (boRes.error) {
      setError(boRes.error.message);
      if (!silent) setLoading(false);
      return;
    }
    if (bkRes.error) {
      setError(bkRes.error.message);
      if (!silent) setLoading(false);
      return;
    }

    const moms = (gmRes.data ?? []) as GuardMomRow[];
    const orders = (boRes.data ?? []) as BillingOrderRow[];
    const bks = (bkRes.data ?? []) as GuardBookingRow[];
    setGuardMoms(moms);
    setBillingOrders(orders);
    setBookings(bks);

    const idSet = new Set<string>();
    for (const g of moms) idSet.add(g.user_id);
    for (const o of orders) idSet.add(o.user_id);
    for (const b of bks) idSet.add(b.applicant_id);
    const momByGmId = new Map(moms.map((m) => [m.id, m]));
    for (const b of bks) {
      const mom = momByGmId.get(b.guard_mom_id);
      if (mom) idSet.add(mom.user_id);
    }
    const ids = [...idSet].filter(Boolean);
    if (ids.length > 0) {
      const { data: profs, error: pErr } = await supabase.from('profiles').select('id,name').in('id', ids);
      if (!pErr && profs) {
        setNameByUserId(Object.fromEntries(profs.map((p) => [p.id, p.name])));
      }
    } else {
      setNameByUserId({});
    }

    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setGuardMomCertified = async (id: string, certify: boolean) => {
    setCertifyingId(id);
    setError(null);
    setCertBanner(null);
    try {
      const { data, error: rpcErr } = await supabase.rpc('admin_set_guard_mom_certified', {
        p_guard_mom_id: id,
        p_certified: certify,
      });
      if (rpcErr) throw rpcErr;
      const rows = (data ?? []) as { id: string; certified_at: string | null }[];
      if (!rows.length) {
        throw new Error(
          '변경된 행이 없어요. Supabase SQL에 ① 20260416130000_is_app_admin_kakao_metadata_email ② 20260416140000_admin_set_guard_mom_certified_rpc 를 적용했는지, 로그인이 pwping83@gmail.com 인지 확인하세요.',
        );
      }
      const at = rows[0].certified_at;
      const atValid =
        at != null &&
        String(at).trim() !== '' &&
        !Number.isNaN(new Date(at as string).getTime());
      if (certify && !atValid) {
        throw new Error(
          'DB에 인증 시각이 반영되지 않았어요. 트리거가 관리자 UPDATE를 막고 있을 수 있어요. Supabase SQL Editor에서 sql/apply-guard-mom-admin-once.sql 을 한 번에 실행하거나, migrations 161300→161200→161400 순으로 적용한 뒤 다시 시도하세요.',
        );
      }
      if (!certify && atValid) {
        throw new Error(
          '인증 해제가 반영되지 않았어요. 20260416120000_guard_mom_admin_certify_update.sql 트리거가 적용됐는지 확인하세요.',
        );
      }
      setGuardMoms((prev) =>
        prev.map((m) => (m.id === id ? { ...m, certified_at: at } : m)),
      );
      await load({ silent: true });
      window.dispatchEvent(new CustomEvent('daeng-certified-guard-moms-changed'));
      setCertBanner(certify ? '인증 처리했어요.' : '인증을 해제했어요.');
      window.setTimeout(() => setCertBanner(null), 4000);
    } catch (e) {
      setError(
        (e as Error)?.message ??
          '저장에 실패했습니다. Supabase에 migrations/20260416120000_guard_mom_admin_certify_update.sql 을 적용했는지 확인하세요.',
      );
    } finally {
      setCertifyingId(null);
    }
  };

  const displayName = (userId: string) => nameByUserId[userId] ?? `${userId.slice(0, 8)}…`;

  const careRelatedOrders = billingOrders.filter(
    (o) =>
      o.product_key === 'guard_mom_listing_7d' ||
      o.product_key === 'breeding_post_listing_7d' ||
      o.product_key === 'guard_mom_care_day' ||
      o.product_key.startsWith('guard_mom'),
  );

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          인증 보호맘 등록·노출 결제·돌봄 예약을 Supabase에서 불러옵니다. 비어 있으면 DB 마이그레이션·RLS 정책을 확인하세요.
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 active:bg-gray-50"
        >
          새로고침
        </button>
      </div>

      {certBanner && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-900">
          {certBanner}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
          <p className="mt-2 text-xs text-red-700">
            관리자 이메일이 appAdmin.ts와 같고, SQL에 is_app_admin·select·update_admin 정책이 적용돼 있는지 확인하세요.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <span className="text-sm font-medium">불러오는 중…</span>
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
              <PawTabIcon className="h-5 w-5 text-orange-600" />
              돌봄(보호맘) 등록 · 신청 정보
              <span className="text-sm font-semibold text-gray-500">({guardMoms.length}명)</span>
            </h2>
            <p className="mb-3 flex items-start gap-2 text-xs font-medium text-gray-600">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" aria-hidden />
              <span>
                <span className="font-bold text-gray-800">DB에 인증 넣기</span>는 함수{' '}
                <code className="rounded bg-gray-100 px-1 text-[10px]">admin_set_guard_mom_certified</code>를
                써요. Supabase SQL Editor에서 마이그레이션{' '}
                <code className="rounded bg-gray-100 px-1 text-[10px]">sql/apply-guard-mom-admin-once.sql</code> 한
                번이면 돼요. (또는 CLI: <code className="rounded bg-gray-100 px-1 text-[10px]">supabase db push</code>)
              </span>
            </p>
            {guardMoms.length === 0 ? (
              <p className="rounded-xl bg-white p-4 text-sm text-gray-500">등록된 행이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {guardMoms.map((g) => {
                  const certified =
                    g.certified_at != null &&
                    g.certified_at !== '' &&
                    !Number.isNaN(new Date(g.certified_at as string).getTime());
                  const promoFree = isPromoFreeListings();
                  const paidListingActive =
                    g.listing_visible_until != null && new Date(g.listing_visible_until).getTime() > Date.now();
                  const visible = (promoFree && certified) || paidListingActive;
                  const listBadge = !certified
                    ? '탭: 인증 후'
                    : visible
                      ? '탭: 노출 중'
                      : '탭: 유료 노출 대기';
                  const busy = certifyingId === g.id;
                  return (
                    <li key={g.id} className="rounded-xl border border-gray-100 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900">{displayName(g.user_id)}</p>
                          <p className="text-xs text-gray-500">
                            {g.region_si} {g.region_gu} · 일당 {g.per_day_fee_krw.toLocaleString()}원
                            {g.offers_daeng_pickup === true ? ' · 댕댕 픽업' : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              certified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {certified ? 'DB 인증됨' : 'DB 미인증'}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              visible ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                            }`}
                            title="인증 돌봄 탭에 다른 사람에게 보이는지(한시 무료·유료 노출 기간)"
                          >
                            {listBadge}
                          </span>
                        </div>
                      </div>
                      {g.intro ? (
                        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{g.intro}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-gray-400">
                        등록 {format(new Date(g.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                        {g.listing_visible_until
                          ? ` · 노출 만료 ${format(new Date(g.listing_visible_until), 'yyyy.MM.dd HH:mm', { locale: ko })}`
                          : ''}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                        {!certified ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void setGuardMomCertified(g.id, true)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white disabled:opacity-50"
                          >
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            DB에 인증 넣기
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              if (
                                !window.confirm(
                                  '인증을 해제할까요? 목록에서 내려갈 수 있어요.',
                                )
                              ) {
                                return;
                              }
                              void setGuardMomCertified(g.id, false);
                            }}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-900 disabled:opacity-50"
                          >
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            인증 해제
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
              <CreditCard className="h-5 w-5 text-orange-600" />
              결제 내역 (전체)
              <span className="text-sm font-semibold text-gray-500">
                ({billingOrders.length}건 · 돌봄 관련 {careRelatedOrders.length})
              </span>
            </h2>
            {billingOrders.length === 0 ? (
              <p className="rounded-xl bg-white p-4 text-sm text-gray-500">billing_orders 행이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {billingOrders.map((o) => {
                  const care =
                    o.product_key === 'guard_mom_listing_7d' ||
                    o.product_key === 'guard_mom_care_day' ||
                    o.product_key.startsWith('guard_mom');
                  const tag =
                    o.product_key === 'breeding_post_listing_7d'
                      ? '교배'
                      : care
                        ? '돌봄'
                        : null;
                  return (
                    <li key={o.id} className="rounded-xl border border-gray-100 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900">{billingProductLabel(o.product_key)}</p>
                          <p className="text-xs text-gray-500">
                            주문자 {displayName(o.user_id)}
                            {tag ? (
                              <span className="ml-2 rounded bg-orange-50 px-1.5 py-0.5 font-semibold text-orange-700">
                                {tag}
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            o.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : o.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : o.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        {format(new Date(o.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                        {o.paid_at
                          ? ` · 결제 ${format(new Date(o.paid_at), 'yyyy.MM.dd HH:mm', { locale: ko })}`
                          : ''}
                        {o.amount_subtotal != null
                          ? ` · ${o.amount_subtotal.toLocaleString()} ${o.currency?.toUpperCase() ?? ''}`
                          : ''}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-gray-900">돌봄 예약 (결제 연동)</h2>
            {bookings.length === 0 ? (
              <p className="rounded-xl bg-white p-4 text-sm text-gray-500">guard_mom_bookings 행이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {bookings.map((b) => {
                  const mom = guardMoms.find((m) => m.id === b.guard_mom_id);
                  return (
                    <li key={b.id} className="rounded-xl border border-gray-100 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900">
                            신청 {displayName(b.applicant_id)} → 보호맘{' '}
                            {mom ? displayName(mom.user_id) : b.guard_mom_id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {b.days}일 · 합계 {b.total_krw.toLocaleString()}원
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            b.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : b.status === 'pending_payment'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      {b.message ? <p className="mt-2 line-clamp-2 text-sm text-gray-600">{b.message}</p> : null}
                      <p className="mt-2 text-xs text-gray-400">
                        {format(new Date(b.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}