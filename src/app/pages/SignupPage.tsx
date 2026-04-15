import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatKoreanMobileDigits, isPhoneAuthLiveMode, isSupabaseSmsPhoneAuth } from '../../lib/phoneAuth';
import { imageContentTypeForDogPhotosUpload, safeImageExtForDogPhotos } from '../../lib/storageImageMime';
import { SIGNUP_LIABILITY_CHECKBOX_LABEL } from '../../lib/platformLegalCopy';
import { setAuthReturnPath } from '../components/AuthReturnRedirect';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

/** 모바일에서 `input.click()` 대신 label 연결이 더 안정적 */
const SIGNUP_AVATAR_FILE_ID = 'daeng-signup-avatar-file';

export function SignupPage() {
  const navigate = useNavigate();
  const { signInWithKakao, sendPhoneOtp, verifyPhoneOtp, user } = useAuth();
  const [step, setStep] = useState<'terms' | 'phone' | 'code' | 'profile'>('terms');
  
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [phoneAuthBusy, setPhoneAuthBusy] = useState(false);
  const [phoneSendBusy, setPhoneSendBusy] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const pendingAvatarFileRef = useRef<File | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);
  
  const [allAgree, setAllAgree] = useState(false);
  const [termsAgree, setTermsAgree] = useState(false);
  const [privacyAgree, setPrivacyAgree] = useState(false);
  const [liabilityAgree, setLiabilityAgree] = useState(false);
  const [marketingAgree, setMarketingAgree] = useState(false);

  const handleAllAgree = () => {
    const newValue = !allAgree;
    setAllAgree(newValue);
    setTermsAgree(newValue);
    setPrivacyAgree(newValue);
    setLiabilityAgree(newValue);
    setMarketingAgree(newValue);
  };

  const handleKakaoSignup = async () => {
    if (!termsAgree || !privacyAgree || !liabilityAgree) {
      alert('필수 약관·고지에 동의해 주세요.');
      return;
    }
    try {
      setLoading(true);
      // 가입 플로우에서는 로그인 직후 프로필 수정 화면으로 유도
      setAuthReturnPath('/profile/edit');
      await signInWithKakao();
    } catch (error) {
      console.error('Kakao signup error:', error);
      alert('카카오 가입에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  const handleTermsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgree || !privacyAgree || !liabilityAgree) {
      alert('필수 약관·고지에 동의해 주세요.');
      return;
    }
    setStep('phone');
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      alert('휴대폰 번호를 확인해 주세요.');
      return;
    }
    try {
      setPhoneSendBusy(true);
      await sendPhoneOtp(phone);
      setStep('code');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : '인증 문자를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.';
      alert(msg);
    } finally {
      setPhoneSendBusy(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPhoneAuthBusy(true);
      await verifyPhoneOtp(phone, code);
      setStep('profile');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : '전화 인증에 실패했습니다. Supabase에서 익명 로그인을 켜거나 카카오 가입을 이용해 주세요.';
      alert(msg);
    } finally {
      setPhoneAuthBusy(false);
    }
  };

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const imageOk =
      file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name);
    if (!imageOk) {
      alert('이미지 파일만 선택할 수 있어요.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('사진은 5MB 이하로 올려 주세요.');
      return;
    }
    pendingAvatarFileRef.current = file;
    setAvatarPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const clearAvatarPick = () => {
    pendingAvatarFileRef.current = null;
    setAvatarPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = nickname.trim().slice(0, 10);
    if (name.length < 2) {
      alert('닉네임은 2~10자로 입력해 주세요.');
      return;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const { data: got } = await supabase.auth.getUser();
    const authUser = session?.user ?? user ?? got.user;
    if (!authUser?.id) {
      alert(
        '프로필·사진을 서버에 저장하려면 로그인이 필요해요.\n휴대폰 인증(다음)을 다시 진행하거나 카카오 가입을 완료해 주세요.',
      );
      navigate('/login');
      return;
    }
    setProfileBusy(true);
    try {
      let avatar_url: string | null = null;
      const pending = pendingAvatarFileRef.current;
      if (pending) {
        const safeExt = safeImageExtForDogPhotos(pending);
        const path = `user-avatars/${authUser.id}/${Date.now()}.${safeExt}`;
        const { error: upErr } = await supabase.storage.from('dog-photos').upload(path, pending, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageContentTypeForDogPhotosUpload(pending, safeExt),
        });
        if (upErr) {
          alert(upErr.message || '프로필 사진 업로드에 실패했어요. dog-photos 버킷·정책을 확인해 주세요.');
          return;
        }
        const { data: pub } = supabase.storage.from('dog-photos').getPublicUrl(path);
        avatar_url = pub.publicUrl;
      }
      const { data: existing } = await supabase.from('profiles').select('phone, avatar_url').eq('id', authUser.id).maybeSingle();
      const nextAvatar = avatar_url ?? (existing?.avatar_url?.trim() || null);
      const metaPhone =
        typeof authUser.user_metadata?.phone === 'string' ? authUser.user_metadata.phone.trim() : '';
      const digits = phone.replace(/\D/g, '');
      const rawForProfile = existing?.phone?.trim() || metaPhone || (digits.length >= 10 ? phone : '');
      const nextPhone = rawForProfile ? formatKoreanMobileDigits(rawForProfile) : null;
      const { error } = await supabase.from('profiles').upsert(
        {
          id: authUser.id,
          name,
          phone: nextPhone,
          avatar_url: nextAvatar,
        },
        { onConflict: 'id' },
      );
      if (error) {
        alert(error.message || '프로필 저장에 실패했어요.');
        return;
      }
      await supabase.auth.updateUser({
        data: { nickname: name, name: name, full_name: name },
      });
      clearAvatarPick();
      navigate('/profile/edit', { replace: true });
    } finally {
      setProfileBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 bg-white border-b z-50">
        <div className="px-4 h-14 flex items-center">
          <button onClick={() => navigate('/explore')} className="p-2 -ml-2">
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

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={liabilityAgree}
                    onChange={(e) => setLiabilityAgree(e.target.checked)}
                    className="mt-0.5 w-5 h-5 shrink-0 accent-orange-500"
                  />
                  <span className="text-sm flex-1 leading-snug">{SIGNUP_LIABILITY_CHECKBOX_LABEL}</span>
                  <Link to="/customer-service#legal" className="shrink-0 text-sm font-bold text-orange-600">
                    보기
                  </Link>
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

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-slate-500 font-bold">또는</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleKakaoSignup()}
              disabled={loading || !termsAgree || !privacyAgree || !liabilityAgree}
              className="mb-4 w-full rounded-2xl bg-[#FEE500] py-3.5 font-bold text-gray-900 shadow-md transition-all hover:bg-[#FDD835] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.8 6.7-.2.9-.7 3-.8 3.4 0 0 0 .3.2.4.1.1.3.1.4 0 .5-.3 3.7-2.4 4.3-2.8.4 0 .8.1 1.2.1 5.5 0 9.9-3.6 9.9-8s-4.5-8-10-8z" />
              </svg>
              {loading ? '카카오로 연결 중…' : '카카오로 가입하기'}
            </button>

            <button
              type="submit"
              disabled={!termsAgree || !privacyAgree || !liabilityAgree}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-[0.98] disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
            >
              휴대폰으로 계속하기
            </button>

            <p className="mt-6 text-center text-sm font-medium text-slate-500">
              이미 계정이 있나요?{' '}
              <Link to="/login" className="font-bold text-orange-600 hover:underline">
                로그인
              </Link>
            </p>
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
              {!isPhoneAuthLiveMode() ? (
                <p className="mt-2 text-xs text-slate-500">연습 모드: 문자 없음 · 다음에서 000000</p>
              ) : null}
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
              disabled={phoneSendBusy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 py-4 font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/30 active:scale-[0.98] disabled:opacity-60"
            >
              {phoneSendBusy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden />
                  보내는 중…
                </>
              ) : (
                '인증번호 받기'
              )}
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
                <span className="font-medium">{phone}</span>
                <br />
                {isSupabaseSmsPhoneAuth()
                  ? '문자로 인증번호를 보냈어요'
                  : isPhoneAuthLiveMode()
                    ? '문자로 인증번호를 보냈어요'
                    : '연습 모드예요. 아래 코드만 입력하면 돼요'}
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
              <p className="mt-2 text-center text-xs text-slate-500">
                {isPhoneAuthLiveMode() ? '문자로 온 숫자 6자리' : '데모: 000000'}
              </p>

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
                  className="text-sm text-orange-600 font-bold disabled:opacity-50"
                  disabled={phoneSendBusy}
                  onClick={() => {
                    void (async () => {
                      if (!isSupabaseSmsPhoneAuth()) {
                        if (!isPhoneAuthLiveMode()) {
                          alert('데모 모드에서는 문자를 다시 보내지 않아요. 000000을 입력해 주세요.');
                          return;
                        }
                      }
                      try {
                        setPhoneSendBusy(true);
                        await sendPhoneOtp(phone);
                        alert('인증번호를 다시 보냈어요.');
                      } catch (err) {
                        alert(err instanceof Error ? err.message : '재전송에 실패했어요.');
                      } finally {
                        setPhoneSendBusy(false);
                      }
                    })();
                  }}
                >
                  {phoneSendBusy ? '전송 중…' : '인증번호 다시 받기'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={phoneAuthBusy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 py-4 font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/30 active:scale-[0.98] disabled:opacity-60"
            >
              {phoneAuthBusy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden />
                  확인 중…
                </>
              ) : (
                '다음'
              )}
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
              <input
                id={SIGNUP_AVATAR_FILE_ID}
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarPick}
              />
              <div className="mb-4 flex justify-center">
                <label
                  htmlFor={SIGNUP_AVATAR_FILE_ID}
                  className="relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-100 text-4xl transition-colors active:border-orange-500"
                >
                  <span className="sr-only">프로필 사진 선택</span>
                  {avatarPreviewUrl ? (
                    <ImageWithFallback
                      src={avatarPreviewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Camera className="h-10 w-10 text-slate-400 pointer-events-none" aria-hidden />
                  )}
                </label>
              </div>
              <div className="mb-2 flex justify-center gap-2">
                <label
                  htmlFor={SIGNUP_AVATAR_FILE_ID}
                  className="cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-xs font-extrabold text-white active:scale-[0.98]"
                >
                  사진 선택
                </label>
                {avatarPreviewUrl ? (
                  <button
                    type="button"
                    onClick={clearAvatarPick}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600"
                  >
                    삭제
                  </button>
                ) : null}
              </div>
              <p className="text-center text-xs text-gray-500">선택 · JPG·PNG 등 5MB 이하 (가입 완료 시 저장)</p>
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
              disabled={profileBusy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 py-4 font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/30 active:scale-[0.98] disabled:opacity-60"
            >
              {profileBusy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden />
                  저장 중…
                </>
              ) : (
                '가입 완료'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}