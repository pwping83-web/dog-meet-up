import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { DAENG_AUTH_RETURN_KEY, DAENG_AUTH_RETURN_TS } from "../components/AuthReturnRedirect";

export function LoginPage() {
  const navigate = useNavigate();
  const { signInWithKakao } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("code");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    let to = "/explore";
    try {
      const p = sessionStorage.getItem(DAENG_AUTH_RETURN_KEY);
      if (p && p.startsWith("/") && !p.startsWith("//")) {
        to = p;
        sessionStorage.removeItem(DAENG_AUTH_RETURN_KEY);
        sessionStorage.removeItem(DAENG_AUTH_RETURN_TS);
      }
    } catch {
      /* ignore */
    }
    navigate(to);
  };

  const handleKakaoLogin = async () => {
    try {
      setLoading(true);
      await signInWithKakao();
    } catch (error) {
      console.error("Kakao login error:", error);
      alert(
        "카카오 로그인에 실패했습니다. Supabase에 카카오 제공자를 켰는지, 카카오 디벨로퍼에 Redirect URI가 등록됐는지 확인해 주세요.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* 헤더 */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50">
        <div className="px-4 h-14 flex items-center max-w-screen-md mx-auto">
          <button
            onClick={() => navigate('/explore')}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-lg font-extrabold ml-2 text-slate-800">
            댕댕마켓 로그인 🐾
          </h1>
        </div>
      </header>

      <div className="p-6 max-w-md mx-auto">
        {/* 로고 */}
        <div className="text-center mb-10 mt-8">
          <div className="flex justify-center mb-5">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/30">
              <span className="text-5xl">🐕</span>
            </div>
          </div>
          <h2 className="text-3xl font-black mb-2 text-slate-900">
            댕댕마켓
          </h2>
          <p className="text-sm font-bold text-slate-500">
            여행·출장 때 댕친 집에 맡기려고, 동네에서 친구를 찾아요 🐾
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendCode}>
            {/* 전화번호 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2 text-slate-700">
                휴대폰 번호
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
                className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-medium placeholder:text-slate-400"
                required
              />
            </div>

            {/* 인증번호 받기 버튼 */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
            >
              인증번호 받기
            </button>

            {/* 간편 로그인 */}
            <div className="mt-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-slate-50/50 text-slate-500 font-bold">
                    또는
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleKakaoLogin}
                  disabled={loading}
                  className="w-full bg-yellow-400 text-gray-900 py-3.5 rounded-2xl font-bold hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.8 6.7-.2.9-.7 3-.8 3.4 0 0 0 .3.2.4.1.1.3.1.4 0 .5-.3 3.7-2.4 4.3-2.8.4 0 .8.1 1.2.1 5.5 0 9.9-3.6 9.9-8s-4.5-8-10-8z" />
                  </svg>
                  {loading ? "연결 중..." : "카카오로 시작하기"}
                </button>
              </div>
            </div>

            {/* 회원가입 링크 */}
            <div className="mt-6 text-center text-sm font-medium text-slate-500">
              아직 계정이 없나요?{" "}
              <Link
                to="/signup"
                className="text-orange-600 font-bold hover:underline"
              >
                회원가입
              </Link>
            </div>
            {__APP_DEPLOY_COMMIT__.length > 0 && (
              <p
                className="mt-6 text-center text-[10px] font-mono text-slate-400"
                title={__APP_DEPLOY_COMMIT__}
              >
                배포 커밋 {__APP_DEPLOY_COMMIT__.slice(0, 7)}
              </p>
            )}
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            {/* 인증번호 입력 */}
            <div className="mb-6">
              <div className="text-sm text-slate-600 font-medium mb-5 p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
                <span className="font-extrabold text-orange-700">
                  {phone}
                </span>
                으로
                <br />
                인증번호를 전송했어요
              </div>

              <label className="block text-sm font-bold mb-2 text-slate-700">
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

              <button
                type="button"
                className="text-sm text-slate-500 font-bold mt-3 hover:text-orange-600"
                onClick={() => setStep("phone")}
              >
                전화번호 변경
              </button>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
            >
              로그인
            </button>

            {/* 재전송 */}
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-orange-600 font-bold hover:underline"
              >
                인증번호 다시 받기
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}