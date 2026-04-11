import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

export function SignupPage() {
  const navigate = useNavigate();
  const { signInWithKakao } = useAuth();
  const [step, setStep] = useState<'terms' | 'phone' | 'code' | 'profile'>('terms');
  
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [allAgree, setAllAgree] = useState(false);
  const [termsAgree, setTermsAgree] = useState(false);
  const [privacyAgree, setPrivacyAgree] = useState(false);
  const [marketingAgree, setMarketingAgree] = useState(false);

  const handleAllAgree = () => {
    const newValue = !allAgree;
    setAllAgree(newValue);
    setTermsAgree(newValue);
    setPrivacyAgree(newValue);
    setMarketingAgree(newValue);
  };

  const handleKakaoSignup = async () => {
    try {
      setLoading(true);
      await signInWithKakao();
      // Supabase가 자동으로 Kakao로 리다이렉트합니다
    } catch (error) {
      console.error('Kakao signup error:', error);
      alert('카카오 가입에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  const handleTermsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('phone');
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('code');
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('profile');
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 회원가입 완료
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 bg-white border-b z-50">
        <div className="px-4 h-14 flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold ml-2">댕댕마켓 가입하기 🐾</h1>
        </div>
      </header>

      <div className="p-6 max-w-md mx-auto">
        {/* 진행 상태 */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${step === 'terms' || step === 'phone' || step === 'code' || step === 'profile' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
            <div className={`w-2 h-2 rounded-full ${step === 'phone' || step === 'code' || step === 'profile' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
            <div className={`w-2 h-2 rounded-full ${step === 'code' || step === 'profile' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
            <div className={`w-2 h-2 rounded-full ${step === 'profile' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
          </div>
        </div>

        {/* 1단계: 약관 동의 */}
        {step === 'terms' && (
          <form onSubmit={handleTermsSubmit}>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">
                반가워요! 🐕
              </h2>
              <p className="text-sm text-gray-600">
                댕댕마켓 이용약관에 동의해주세요
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {/* 전체 동의 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allAgree}
                    onChange={handleAllAgree}
                    className="w-5 h-5 accent-orange-500"
                  />
                  <span className="font-bold">전체 동의</span>
                </label>
              </div>

              {/* 개별 약관 */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAgree}
                    onChange={(e) => setTermsAgree(e.target.checked)}
                    className="w-5 h-5 accent-orange-500"
                  />
                  <span className="text-sm flex-1">
                    (필수) 이용약관 동의
                  </span>
                  <button type="button" className="text-gray-400 text-sm">
                    보기
                  </button>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyAgree}
                    onChange={(e) => setPrivacyAgree(e.target.checked)}
                    className="w-5 h-5 accent-orange-500"
                  />
                  <span className="text-sm flex-1">
                    (필수) 개인정보 수집 및 이용 동의
                  </span>
                  <button type="button" className="text-gray-400 text-sm">
                    보기
                  </button>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingAgree}
                    onChange={(e) => setMarketingAgree(e.target.checked)}
                    className="w-5 h-5 accent-orange-500"
                  />
                  <span className="text-sm flex-1">
                    (선택) 마케팅 정보 수신 동의
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={!termsAgree || !privacyAgree}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-[0.98] disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
            >
              다음
            </button>
          </form>
        )}

        {/* 2단계: 휴대폰 인증 */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit}>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">
                휴대폰 번호를<br />입력해주세요 📱
              </h2>
              <p className="text-sm text-gray-600">
                본인 확인을 위해 필요해요
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                휴대폰 번호
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
            >
              인증번호 받기
            </button>
          </form>
        )}

        {/* 3단계: 인증번호 확인 */}
        {step === 'code' && (
          <form onSubmit={handleCodeSubmit}>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">
                인증번호를<br />입력해주세요 🔐
              </h2>
              <p className="text-sm text-gray-600">
                <span className="font-medium">{phone}</span>으로<br />
                인증번호를 전송했어요
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                인증번호 6자리
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-center text-2xl tracking-widest font-bold placeholder:text-slate-300"
                required
              />
              
              <div className="flex justify-between items-center mt-2">
                <button
                  type="button"
                  className="text-sm text-gray-500 underline"
                  onClick={() => setStep('phone')}
                >
                  전화번호 변경
                </button>
                <button
                  type="button"
                  className="text-sm text-orange-600 font-bold"
                >
                  인증번호 다시 받기
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
            >
              다음
            </button>
          </form>
        )}

        {/* 4단계: 프로필 설정 */}
        {step === 'profile' && (
          <form onSubmit={handleProfileSubmit}>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">
                닉네임을<br />입력해주세요 ✏️
              </h2>
              <p className="text-sm text-gray-600">
                이웃들에게 보여질 이름이에요
              </p>
            </div>

            {/* 프로필 사진 */}
            <div className="mb-6">
              <div className="flex justify-center mb-6">
                <button
                  type="button"
                  className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-4xl border-2 border-dashed border-gray-300 hover:border-orange-500 transition-colors"
                >
                  📷
                </button>
              </div>
              <div className="text-center text-sm text-gray-500 mb-6">
                프로필 사진 추가 (선택)
              </div>
            </div>

            {/* 닉네임 입력 */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="2~10자 이내로 입력해주세요"
                maxLength={10}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500"
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {nickname.length}/10
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
            >
              가입 완료
            </button>
          </form>
        )}
      </div>
    </div>
  );
}