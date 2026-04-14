import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getAuthRedirectUrl } from '../lib/site';
import { ensurePublicProfile } from '../lib/ensurePublicProfile';
import { isSupabaseSmsPhoneAuth, koreanMobileDigitsToE164 } from '../lib/phoneAuth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithKakao: () => Promise<void>;
  /** SMS 모드에서만 실제 발송. 데모 모드에서는 즉시 성공(문자 없음). */
  sendPhoneOtp: (rawPhone: string) => Promise<void>;
  /**
   * SMS 모드: 문자로 받은 6자리로 세션 생성.
   * 데모: 000000 + 익명 로그인(또는 VITE_PHONE_DEMO_* 폴백).
   */
  verifyPhoneOtp: (rawPhone: string, code: string) => Promise<void>;
  /** @deprecated verifyPhoneOtp 와 동일 */
  signInWithPhoneDemo: (phone: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await supabase.auth.initialize();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!cancelled) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          queueMicrotask(() => {
            void ensurePublicProfile(session.user);
          });
        }
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        queueMicrotask(() => {
          void ensurePublicProfile(session.user);
        });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    if (error) throw error;
  };

  const signInWithKakao = async () => {
    const redirectTo = getAuthRedirectUrl();
    // KOE205: 카카오에 설정되지 않은 scope 금지. account_email은 비즈/동의 설정 없으면 자주 막힘 → 기본은 프로필만.
    // Supabase → Authentication → Providers → Kakao → "Allow users without an email" 권장.
    const kakaoScopes =
      import.meta.env.VITE_KAKAO_AUTH_SCOPES?.trim() || 'profile_nickname profile_image';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo,
        scopes: kakaoScopes,
      },
    });
    if (error) throw error;
  };

  const isAnonymousDisabledError = (err: unknown) => {
    const m = err instanceof Error ? err.message : String(err);
    return /anonymous sign[-\s]?ins? are disabled/i.test(m) || /anonymous provider is disabled/i.test(m);
  };

  const syncPhoneUserMetadata = async (rawPhone: string) => {
    const digits = rawPhone.replace(/\D/g, '');
    const label =
      digits.length >= 4 ? `휴대폰 ···${digits.slice(-4)}` : '휴대폰 로그인';
    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        nickname: label,
        phone: rawPhone.trim(),
      },
    });
    if (metaError) {
      console.warn('[댕댕마켓] 전화 로그인: 프로필 메타 동기화 실패', metaError.message);
    }
  };

  const sendPhoneOtp = async (rawPhone: string) => {
    if (!isSupabaseSmsPhoneAuth()) return;
    const e164 = koreanMobileDigitsToE164(rawPhone);
    if (!e164) {
      throw new Error('휴대폰 번호 형식을 확인해 주세요. (예: 010-1234-5678)');
    }
    const { error } = await supabase.auth.signInWithOtp({
      phone: e164,
      options: {
        channel: 'sms',
        shouldCreateUser: true,
      },
    });
    if (error) {
      throw new Error(
        `인증 문자 발송에 실패했습니다.\nSupabase에서 Phone 제공자를 설정했는지 확인해 주세요.\n(${error.message})`,
      );
    }
  };

  const verifyPhoneDemo = async (rawPhone: string, code: string) => {
    const trimmed = code.trim();
    if (trimmed !== '000000') {
      throw new Error('데모 환경에서는 인증번호 000000을 입력해 주세요.');
    }

    const demoEmail = import.meta.env.VITE_PHONE_DEMO_EMAIL?.trim();
    const demoPassword = import.meta.env.VITE_PHONE_DEMO_PASSWORD?.trim();

    const { error: anonError } = await supabase.auth.signInAnonymously();
    if (anonError) {
      if (isAnonymousDisabledError(anonError) && demoEmail && demoPassword) {
        const { error: pwError } = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        });
        if (pwError) {
          throw new Error(
            `전화 데모 폴백 로그인 실패: ${pwError.message}\n데모 계정 이메일·비밀번호(VITE_PHONE_DEMO_*)를 Supabase에 만든 사용자와 맞춰 주세요.`,
          );
        }
      } else if (isAnonymousDisabledError(anonError)) {
        throw new Error(
          '전화 데모 로그인을 쓰려면 Supabase 대시보드 → Authentication → Sign In / Providers에서\n' +
            '「Allow anonymous sign-ins」를 켠 뒤 반드시 Save changes까지 눌러 저장하세요.\n' +
            '이미 켰는데도 이 메시지가 나오면, 배포 사이트의 VITE_SUPABASE_URL·ANON 키가 지금 설정한 프로젝트와 같은지 확인하세요.\n' +
            '또는 배포에 VITE_PHONE_DEMO_EMAIL, VITE_PHONE_DEMO_PASSWORD를 넣어 데모 계정으로 폴백할 수 있어요.\n' +
            '실서비스 전화 가입은 `.env`에 VITE_PHONE_AUTH=sms 로 SMS를 켜 주세요.\n' +
            `(서버 응답: ${anonError.message})`,
        );
      } else {
        throw anonError;
      }
    }

    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (!u) throw new Error('로그인 세션을 만들지 못했습니다.');
    await syncPhoneUserMetadata(rawPhone);
    await supabase.auth.refreshSession();
  };

  const verifyPhoneSms = async (rawPhone: string, code: string) => {
    const e164 = koreanMobileDigitsToE164(rawPhone);
    if (!e164) {
      throw new Error('휴대폰 번호 형식을 확인해 주세요.');
    }
    const { data, error } = await supabase.auth.verifyOtp({
      phone: e164,
      token: code.trim(),
      type: 'sms',
    });
    if (error) {
      throw new Error(`인증번호를 확인해 주세요.\n${error.message}`);
    }
    if (!data.user) throw new Error('로그인 세션을 만들지 못했습니다.');
    await syncPhoneUserMetadata(rawPhone);
    await supabase.auth.refreshSession();
  };

  const verifyPhoneOtp = async (rawPhone: string, code: string) => {
    if (isSupabaseSmsPhoneAuth()) {
      await verifyPhoneSms(rawPhone, code);
    } else {
      await verifyPhoneDemo(rawPhone, code);
    }
  };

  const signInWithPhoneDemo = verifyPhoneOtp;

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signInWithKakao,
        sendPhoneOtp,
        verifyPhoneOtp,
        signInWithPhoneDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}