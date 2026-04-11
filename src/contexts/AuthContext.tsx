import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getAuthRedirectUrl } from '../lib/site';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithKakao: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo,
        scopes: kakaoScopes,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;
    // #region agent log
    {
      const envScopes = import.meta.env.VITE_KAKAO_AUTH_SCOPES?.trim();
      let scopesParam: string | null = null;
      let searchHasAccountEmail = false;
      let authorizePath = '';
      const authorizeQueryKeys: string[] = [];
      try {
        if (data?.url) {
          const u = new URL(data.url);
          authorizePath = u.pathname;
          scopesParam = u.searchParams.get('scopes') ?? u.searchParams.get('scope');
          searchHasAccountEmail = u.search.includes('account_email');
          u.searchParams.forEach((_v, k) => authorizeQueryKeys.push(k));
        }
      } catch {
        /* ignore parse errors */
      }
      const payload = {
        sessionId: '51d57b',
        runId: 'pre-fix',
        hypothesisId: 'H1-H3',
        location: 'AuthContext.tsx:signInWithKakao',
        message: 'oauth_authorize_url_scope_probe',
        data: {
          kakaoScopes,
          envOverride: Boolean(envScopes),
          authorizePath,
          scopesParam,
          searchHasAccountEmail,
          hasUrl: Boolean(data?.url),
          authorizeQueryKeys,
        },
        timestamp: Date.now(),
      };
      const body = JSON.stringify(payload);
      if (import.meta.env.DEV) {
        fetch(`${window.location.origin}/__debug/ingest-51d57b`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }).catch(() => {});
      }
      fetch('http://127.0.0.1:7335/ingest/fb5c9c07-34a2-4073-b636-16c8a2388a10', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '51d57b' },
        body,
      }).catch(() => {});
    }
    // #endregion
    if (data?.url) {
      window.location.assign(data.url);
    } else {
      throw new Error('OAuth URL을 받지 못했습니다.');
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithKakao, signOut }}>
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