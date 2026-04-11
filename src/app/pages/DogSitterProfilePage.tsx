import { useParams, useNavigate } from 'react-router';
import { MapPin, Star, ArrowLeft, MessageCircle, X } from 'lucide-react';
import { mockDogSitters } from '../data/mockData';
import { useState } from 'react';

export function DogSitterProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dogSitter = mockDogSitters.find((r) => r.id === id);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinData, setJoinData] = useState({
    message: '',
    estimatedCost: '',
    estimatedDuration: '',
  });

  const handleSubmitJoin = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`돌봄 문의를 보냈어요 🎉\n\n맡기기 일시: ${joinData.estimatedCost}\n돌봄 기간: ${joinData.estimatedDuration}\n메시지: ${joinData.message}`);
    setShowJoinForm(false);
    setJoinData({ message: '', estimatedCost: '', estimatedDuration: '' });
  };

  if (!dogSitter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">🐕 돌보미를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center h-14 px-4 max-w-screen-md mx-auto">
          <button onClick={() => navigate('/sitters')} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="ml-2 text-slate-800 text-lg" style={{ fontWeight: 700 }}>강아지 돌봄 🐾</span>
        </div>
      </div>

      <div className="px-4 py-8 max-w-screen-md mx-auto">
        {/* 프로필 */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-50 border-4 border-white shadow-lg rounded-3xl flex items-center justify-center mx-auto mb-4">
            <span className="text-orange-600 text-3xl" style={{ fontWeight: 900 }}>
              {dogSitter.name.charAt(0)}
            </span>
          </div>
          <h1 className="text-2xl mb-2 text-slate-900" style={{ fontWeight: 800 }}>{dogSitter.name}</h1>
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-lg text-amber-600" style={{ fontWeight: 900 }}>{dogSitter.rating}</span>
              <span className="text-amber-600/70" style={{ fontWeight: 700 }}>({dogSitter.reviewCount})</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-slate-500" style={{ fontWeight: 700 }}>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{dogSitter.district}</span>
            </div>
            <span>•</span>
            <span>경력 {dogSitter.experience}</span>
          </div>
        </div>

        {/* 한줄 소개 */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 mb-6 text-center">
          <p className="text-slate-700 leading-relaxed" style={{ fontWeight: 500 }}>{dogSitter.description}</p>
        </div>

        {/* 전문 분야 */}
        <div className="mb-6">
          <h3 className="mb-3 px-1 text-sm text-slate-700" style={{ fontWeight: 800 }}>
            🐕 제공하는 돌봄
          </h3>
          <div className="flex flex-wrap gap-2">
            {dogSitter.specialties.map((specialty) => (
              <span
                key={specialty}
                className="px-4 py-2.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-xl text-sm"
                style={{ fontWeight: 700 }}
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>

        {/* 시간표 */}
        <div className="bg-orange-50/50 rounded-3xl p-5 mb-6 border-2 border-orange-200">
          <h3 className="mb-4 text-center text-slate-800" style={{ fontWeight: 800 }}>💰 돌봄 유형·요금(참고)</h3>
          <div className="space-y-3">
            {dogSitter.estimatedPrices.map((price, index) => (
              <div
                key={index}
                className="flex justify-between items-center bg-white rounded-2xl p-4 shadow-sm"
              >
                <span className="text-slate-700" style={{ fontWeight: 700 }}>{price.category}</span>
                <span className="text-orange-600" style={{ fontWeight: 900 }}>
                  {price.priceRange}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 리뷰 */}
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-5 shadow-sm">
          <h3 className="mb-4 text-center text-slate-800" style={{ fontWeight: 800 }}>
            ⭐ 최근 리뷰
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500" style={{ fontWeight: 700 }}>김**</span>
                </div>
                <p className="text-sm text-slate-700" style={{ fontWeight: 500 }}>
                  빠르고 친절해요. 가격도 합리적!
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 pb-safe z-40 max-w-[430px] mx-auto">
        <div className="max-w-screen-md mx-auto">
          <button 
            onClick={() => setShowJoinForm(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-5 rounded-2xl text-lg shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ fontWeight: 700 }}
          >
            <MessageCircle className="w-6 h-6" />
            돌봄 문의하기 💬
          </button>
        </div>
      </div>

      {/* 돌봄 문의 폼 */}
      {showJoinForm && (
        <>
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fadeIn"
            onClick={() => setShowJoinForm(false)}
          />
          
          <div className="absolute inset-x-0 bottom-0 z-50 animate-slideUp">
            <div className="bg-white rounded-t-[2rem] w-full shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="text-lg text-slate-800" style={{ fontWeight: 800 }}>🐕 돌봄 문의하기</h3>
                <button 
                  onClick={() => setShowJoinForm(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitJoin} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-4 border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-orange-600 text-lg" style={{ fontWeight: 900 }}>{dogSitter.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-slate-800" style={{ fontWeight: 800 }}>{dogSitter.name}</p>
                      <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>{dogSitter.district}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-2" style={{ fontWeight: 800 }}>
                    ⏰ 인수인계(맡기기) 희망 일시 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={joinData.estimatedCost}
                    onChange={(e) => setJoinData({ ...joinData, estimatedCost: e.target.value })}
                    placeholder="예: 내일 오전 10시, 집 앞"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    style={{ fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-2" style={{ fontWeight: 800 }}>
                    🐕 돌봄 기간 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={joinData.estimatedDuration}
                    onChange={(e) => setJoinData({ ...joinData, estimatedDuration: e.target.value })}
                    placeholder="예: 반나절, 하루, 주말 2박3일"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    style={{ fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-2" style={{ fontWeight: 800 }}>
                    💬 한마디 메시지 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={joinData.message}
                    onChange={(e) => setJoinData({ ...joinData, message: e.target.value })}
                    placeholder="맡기기 기간, 우리 아이 성격·주의사항 등을 적어 주세요"
                    rows={4}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                    style={{ fontWeight: 500 }}
                  />
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <p className="text-xs text-amber-800 leading-relaxed" style={{ fontWeight: 700 }}>
                    💡 <span style={{ fontWeight: 800 }}>팁:</span> 첫 돌봄은 만남 장소·안전 수칙을 미리 채팅으로 맞추는 걸 추천해요.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-4 rounded-2xl text-base shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
                  style={{ fontWeight: 800 }}
                >
                  돌봄 문의 보내기 🚀
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Backward compatibility
export { DogSitterProfilePage as RepairerProfilePage };