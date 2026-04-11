import { useState } from 'react';
import { useNavigate } from 'react-router';
import { X } from 'lucide-react';
import { RegionSelector } from '../components/RegionSelector';

export function BecomeDogSitterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    district: '',
    specialties: [] as string[],
    experience: '',
  });

  const availableSpecialties = [
    '소형견',
    '중형견',
    '대형견',
    '산책',
    '훈련',
    '사회화',
    '놀이',
  ];

  const toggleSpecialty = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.specialties.length === 0) {
      alert('최소 1개 이상 선택해주세요');
      return;
    }

    console.log('댕집사 등록:', formData);
    alert('등록 완료! 🎉\n이제 인증 돌봄(댕집사)로 돌봄을 제공할 수 있어요');
    navigate('/my');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <button onClick={() => navigate('/explore')}>
            <X className="w-6 h-6" />
          </button>
          <h1 style={{ fontWeight: 700 }}>인증 돌봄(댕집사) 등록 🐾</h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="px-4 py-8">
        {/* 메인 메시지 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🐕</div>
          <h2 className="text-2xl mb-3" style={{ fontWeight: 700 }}>
            돈 받고 댕댕이를 돌봐 주는 돌보미로 활동해요
          </h2>
          <p className="text-gray-600 text-base">
            이웃 댕댕이들과 함께 즐거운 시간을
          </p>
        </div>

        {/* 3가지 핵심 포인트 */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-orange-50 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-lg mb-1" style={{ fontWeight: 700 }}>3만원~</div>
            <div className="text-xs text-gray-600">건당 수익</div>
          </div>
          
          <div className="bg-yellow-50 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">⏱️</div>
            <div className="text-lg mb-1" style={{ fontWeight: 700 }}>3분</div>
            <div className="text-xs text-gray-600">간단 등록</div>
          </div>
          
          <div className="bg-orange-50 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">🏡</div>
            <div className="text-lg mb-1" style={{ fontWeight: 700 }}>우리동네</div>
            <div className="text-xs text-gray-600">가까운곳만</div>
          </div>
        </div>

        {/* 간단 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="이름 또는 닉네임"
              className="w-full px-4 py-4 border-2 rounded-xl text-base focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="연락처 (010-0000-0000)"
              className="w-full px-4 py-4 border-2 rounded-xl text-base focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <RegionSelector
              selectedCity={formData.city}
              selectedDistrict={formData.district}
              onCityChange={(city) => setFormData({ ...formData, city })}
              onDistrictChange={(district) => setFormData({ ...formData, district })}
            />
          </div>

          <div>
            <input
              type="text"
              required
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              placeholder="경력 (예: 2년)"
              className="w-full px-4 py-4 border-2 rounded-xl text-base focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <p className="text-sm text-gray-700 mb-3 px-1" style={{ fontWeight: 500 }}>
              어떤 활동이 가능하신가요? (최소 1개)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {availableSpecialties.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => toggleSpecialty(specialty)}
                  className={`py-4 px-4 rounded-xl text-base transition-all ${
                    formData.specialties.includes(specialty)
                      ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white scale-105 shadow-lg'
                      : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-5 rounded-xl text-lg hover:shadow-xl transition-all mt-8 active:scale-[0.98]"
            style={{ fontWeight: 700 }}
          >
            바로 시작하기 🚀
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          승인까지 1-2일 • 문자로 알려드려요
        </p>
      </div>
    </div>
  );
}

// Backward compatibility
export { BecomeDogSitterPage as BecomeRepairerPage };
