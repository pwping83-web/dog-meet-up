// 파일 경로: src/app/pages/ProfileEditPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Camera, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';
import { RegionSelector } from '../components/RegionSelector';

export function ProfileEditPage() {
  const navigate = useNavigate();
  const [profileMode, setProfileMode] = useState<'general' | 'repairer'>('general');
  const [isGpsVerified, setIsGpsVerified] = useState(false);
  
  const [formData, setFormData] = useState({
    nickname: '김철수',
    phone: '010-1234-5678',
    city: '서울',
    district: '강남구',
    avatarTheme: 'default',
    specialty: '산책 · 방문 돌봄', // 유료 돌봄(댕집사) 모드
  });

  /** 프로필 테마 — 댕댕마켓용 강아지 캐릭터 (이전 수리마켓 킥보드·드론·렌치 제거) */
  const themeAvatars = [
    { id: 'default', emoji: '👤', bg: 'bg-slate-100', border: 'border-slate-200' },
    { id: 'pup', emoji: '🐶', bg: 'bg-amber-100', border: 'border-amber-300' },
    { id: 'poodle', emoji: '🐩', bg: 'bg-rose-100', border: 'border-rose-300' },
    { id: 'retriever', emoji: '🦮', bg: 'bg-orange-100', border: 'border-orange-300' },
  ];

  // 프로필 완성도 계산 (단순 예시)
  const completionRate = formData.nickname && formData.phone && formData.city ? (isGpsVerified ? 100 : 80) : 50;

  const handleGpsAuth = () => {
    // 실제로는 GPS 권한 요청 및 카카오맵 API 연동이 들어갑니다.
    alert('현재 위치로 동네 인증이 완료되었습니다! 🎉');
    setIsGpsVerified(true);
  };

  const handleSave = () => {
    alert('프로필이 성공적으로 저장되었습니다! 💾');
    navigate('/my');
  };

  return (
    <div className="min-h-screen bg-slate-50/80 pb-28">
      {/* 글래스모피즘 헤더 */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50">
        <div className="px-4 h-14 flex items-center justify-between max-w-screen-md mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-extrabold text-slate-800">프로필 수정</h1>
          <div className="w-8" /> {/* 레이아웃 균형용 */}
        </div>
      </header>

      <div className="max-w-screen-md mx-auto p-4 space-y-4">
        
        {/* 일반 / 유료 돌봄(댕집사) 탭 */}
        <div className="bg-slate-100 p-1 rounded-2xl flex relative mb-6">
          <button
            type="button"
            onClick={() => setProfileMode('general')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all z-10 ${profileMode === 'general' ? 'text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            일반 회원
          </button>
          <button 
            type="button"
            onClick={() => setProfileMode('repairer')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all z-10 ${profileMode === 'repairer' ? 'text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            유료 돌봄
          </button>
          {/* 토글 애니메이션 배경 */}
          <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl transition-transform duration-300 shadow-sm ${profileMode === 'repairer' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`} />
        </div>

        {/* 프로필 완성도 게이지 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-end mb-3">
            <div>
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                내 프로필 신뢰도 {completionRate === 100 && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
              </span>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {completionRate === 100 ? '완벽해요! 이웃들이 신뢰할 수 있어요.' : 'GPS 동네 인증을 하면 신뢰도가 올라가요!'}
              </p>
            </div>
            <span className="text-orange-600 font-black text-xl">{completionRate}%</span>
          </div>
          <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${completionRate === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-orange-500 to-yellow-500'}`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* 프로필 사진 & 테마 선택 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-extrabold text-slate-800 mb-4">프로필 이미지</h3>
          <div className="flex flex-col items-center">
            {/* 현재 아바타 뷰 */}
            <div className="relative mb-5 group cursor-pointer">
              <div className={`w-24 h-24 rounded-3xl border-4 ${themeAvatars.find(t => t.id === formData.avatarTheme)?.bg} ${themeAvatars.find(t => t.id === formData.avatarTheme)?.border} flex items-center justify-center text-4xl shadow-inner transition-colors`}>
                {themeAvatars.find(t => t.id === formData.avatarTheme)?.emoji}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-slate-800 text-white p-2 rounded-full shadow-lg border-2 border-white group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
            </div>

            {/* 테마 팔레트 */}
            <div className="flex gap-3 justify-center bg-slate-50 p-2.5 rounded-2xl">
              {themeAvatars.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setFormData({...formData, avatarTheme: theme.id})}
                  className={`w-12 h-12 rounded-xl text-xl flex items-center justify-center transition-all ${theme.bg} ${formData.avatarTheme === theme.id ? 'ring-2 ring-orange-500 ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'}`}
                >
                  {theme.emoji}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 font-bold mt-3 text-center px-2">
              사진을 올리거나, 댕댕이 캐릭터(품종 느낌)를 골라보세요
            </p>
          </div>
        </div>

        {/* 닉네임 수정 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <label className="flex justify-between text-sm font-extrabold text-slate-800 mb-2">
            닉네임
            <span className="text-xs text-slate-400 font-medium">{formData.nickname.length}/10자</span>
          </label>
          <input
            type="text"
            value={formData.nickname}
            maxLength={10}
            onChange={(e) => setFormData({...formData, nickname: e.target.value})}
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
          />
        </div>

        {/* 내 동네 및 GPS 인증 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-extrabold text-slate-800">내 동네 설정</label>
            {isGpsVerified ? (
              <span className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5" /> 인증 완료
              </span>
            ) : (
              <button onClick={handleGpsAuth} className="flex items-center gap-1 text-[11px] font-extrabold text-orange-600 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg transition-colors">
                <MapPin className="w-3.5 h-3.5" /> 현재 위치로 인증
              </button>
            )}
          </div>
          <RegionSelector
            selectedCity={formData.city}
            selectedDistrict={formData.district}
            onCityChange={(city) => setFormData({...formData, city})}
            onDistrictChange={(district) => setFormData({...formData, district})}
          />
        </div>

        {/* 전화번호 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <label className="block text-sm font-extrabold text-slate-800 mb-2">전화번호</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.phone}
              disabled
              className="flex-1 px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-500"
            />
            <button className="px-4 py-3.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-2xl transition-colors whitespace-nowrap active:scale-95">
              변경
            </button>
          </div>
        </div>

        {/* 유료 돌봄: 강아지 돌봄 서비스 안내 */}
        {profileMode === 'repairer' && (
          <div className="bg-orange-50/50 rounded-3xl p-5 border-2 border-orange-100 animate-fadeIn">
            <h3 className="text-sm font-extrabold text-orange-900 mb-2">🐕 강아지 돌봄 분야</h3>
            <p className="text-xs text-orange-600/70 font-bold mb-3">
              모임 모집이 아니라, <strong>돈 받고 강아지를 돌봐 주는 서비스</strong>예요. 산책·방문·데이케어 등 적어 주세요.
            </p>
            <input
              type="text"
              value={formData.specialty}
              onChange={(e) => setFormData({...formData, specialty: e.target.value})}
              placeholder="예: 주간 방문 돌봄, 산책 대행, 퍼피 케어"
              className="w-full px-4 py-3.5 bg-white border border-orange-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>
        )}

      </div>

      {/* 하단 고정 저장 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50 pb-safe max-w-[430px] mx-auto">
        <div className="max-w-screen-md mx-auto">
          <button 
            onClick={handleSave}
            className="w-full h-14 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-2xl font-bold text-lg shadow-[0_8px_30px_rgba(249,115,22,0.2)] hover:shadow-[0_10px_40px_rgba(249,115,22,0.3)] transition-all active:scale-[0.98]"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}