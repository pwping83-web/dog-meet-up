import { useState } from 'react';
import { Search, MapPin, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { DogSitterCard } from '../components/DogSitterCard';
import { mockDogSitters, mockMeetups, mockJoinRequests } from '../data/mockData';
import { calculateDistance, formatDistance } from '../utils/distance';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { RegionSelector } from '../components/RegionSelector';

export function DogSittersPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'meetups' | 'sitters'>('meetups');
  const [specialty, setSpecialty] = useState('전체');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'reviews'>('distance');
  const [userCity, setUserCity] = useState('');
  const [userDistrict, setUserDistrict] = useState('');
  const [category, setCategory] = useState('전체');

  const specialties = ['전체', '소형견', '중형견', '대형견', '퍼피', '시니어'];
  const categories = ['전체', '소형견', '중형견', '대형견', '퍼피', '시니어'];

  // 댕집사 필터링
  const filteredSitters = mockDogSitters
    .filter((sitter) => {
      if (specialty === '전체') return true;
      return sitter.specialties.includes(specialty);
    })
    .map((sitter) => ({
      ...sitter,
      distance: calculateDistance(userDistrict, sitter.district),
    }))
    .sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'reviews') return b.reviewCount - a.reviewCount;
      return 0;
    });

  // 모임 필터링
  const filteredMeetups = mockMeetups
    .filter(req => {
      const categoryMatch = category === '전체' || req.category === category;
      return categoryMatch;
    })
    .slice(0, 20);

  // 신청 수 계산
  const getJoinCount = (meetupId: string) => {
    return mockJoinRequests.filter(q => q.meetupId === meetupId).length;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* 상단 탭 */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="flex max-w-screen-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('meetups')}
            className={`relative flex-1 py-3.5 text-[13px] transition-colors ${
              activeTab === 'meetups' ? 'text-slate-900' : 'text-slate-400'
            }`}
            style={{ fontWeight: 800 }}
          >
            모이자·만나자
            {activeTab === 'meetups' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 to-[#5E43FF]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sitters')}
            className={`relative flex-1 py-3.5 text-[13px] transition-colors ${
              activeTab === 'sitters' ? 'text-slate-900' : 'text-slate-400'
            }`}
            style={{ fontWeight: 800 }}
          >
            유료 돌봄
            {activeTab === 'sitters' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 to-[#5E43FF]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/guard-moms')}
            className="relative flex-1 py-3.5 text-[12px] text-slate-400 transition-colors hover:text-slate-600"
            style={{ fontWeight: 800 }}
          >
            보호맘
          </button>
        </div>
      </div>

      {activeTab === 'meetups' && (
        <div className="mx-auto max-w-screen-md px-4 py-4">
          <p className="mb-3 rounded-2xl border border-violet-100 bg-violet-50/80 px-3 py-2.5 text-xs font-semibold leading-relaxed text-violet-900">
            <strong className="font-extrabold">모이자 · 만나자</strong>는 산책·놀이 등{' '}
            <strong>함께할 댕친을 부르는 글</strong>이에요. 돈 받고 맡아 주는 건 옆의{' '}
            <strong>유료 돌봄</strong> 탭을 이용해 주세요.
          </p>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all ${
                  category === cat
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                style={{ fontWeight: 700 }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredMeetups.map((meetup) => {
              const joinCount = getJoinCount(meetup.id);
              return (
                <Link
                  key={meetup.id}
                  to={`/meetup/${meetup.id}`}
                  className="block bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-orange-100 active:scale-[0.98] transition-all"
                >
                  <div className="flex gap-4 p-4">
                    <div className="w-20 h-20 rounded-2xl flex-shrink-0 overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-orange-100 to-yellow-100">
                        🐕
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base text-slate-800 mb-1 line-clamp-1" style={{ fontWeight: 800 }}>
                        {meetup.title}
                      </h3>
                      <p className="text-sm text-slate-500 mb-2 line-clamp-2" style={{ fontWeight: 500 }}>
                        {meetup.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400" style={{ fontWeight: 700 }}>
                          <span>{meetup.district}</span>
                          <span>·</span>
                          <span>{formatDistanceToNow(new Date(meetup.createdAt), { locale: ko })} 전</span>
                        </div>
                        {joinCount > 0 && (
                          <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="text-xs" style={{ fontWeight: 700 }}>{joinCount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'sitters' && (
        <div className="mx-auto max-w-screen-md px-4 py-4">
          <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-xs font-semibold leading-relaxed text-amber-950">
            <strong className="font-extrabold">유료 돌봄(댕집사)</strong>는{' '}
            <strong>돈을 받고 강아지를 맡아 돌봐 주는 돌보미</strong>를 찾는 곳이에요. 같이 놀 만남 모집은{' '}
            <strong>모이자·만나자</strong> 탭이에요.
          </p>
          <div className="mb-4 rounded-3xl border-2 border-amber-200/80 bg-amber-50/50 p-4">
            <div className="mb-2">
              <label
                className="mb-2 flex items-center gap-2 text-xs text-slate-700"
                style={{ fontWeight: 700 }}
              >
                <MapPin className="h-4 w-4 shrink-0 text-amber-700" />
                내 위치
              </label>
              <RegionSelector
                selectedCity={userCity}
                selectedDistrict={userDistrict}
                onCityChange={setUserCity}
                onDistrictChange={setUserDistrict}
              />
            </div>
            <p className="mt-2 text-xs font-bold text-amber-900">가까운 돌보미 순으로 보여요</p>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="돌보미 검색 · 산책·돌봄 🐕"
              className="w-full pl-11 pr-4 h-12 text-sm border-transparent bg-slate-50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all placeholder:text-slate-400"
              style={{ fontWeight: 500 }}
            />
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {specialties.map((spec) => (
              <button
                key={spec}
                onClick={() => setSpecialty(spec)}
                className={`px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all ${
                  specialty === spec
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                style={{ fontWeight: 700 }}
              >
                {spec}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate-600" style={{ fontWeight: 700 }}>
              총 {filteredSitters.length}명
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'distance' | 'rating' | 'reviews')}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500"
              style={{ fontWeight: 700 }}
            >
              <option value="distance">🎯 거리 가까운 순</option>
              <option value="rating">⭐ 평점 높은 순</option>
              <option value="reviews">💬 리뷰 많은 순</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredSitters.map((sitter) => (
              <div key={sitter.id} className="relative">
                <DogSitterCard dogSitter={sitter} />
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                  <div className={`px-3 py-1.5 rounded-xl text-xs shadow-sm ${
                    sitter.distance < 2
                      ? 'bg-emerald-500 text-white'
                      : sitter.distance < 5
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`} style={{ fontWeight: 800 }}>
                    {formatDistance(sitter.distance)}
                  </div>
                  {sitter.distance < 2 && (
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg" style={{ fontWeight: 800 }}>
                      초근거리!
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Backward compatibility
export { DogSittersPage as RepairersPage };