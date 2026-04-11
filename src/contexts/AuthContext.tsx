import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getAuthRedirectUrl } from '../lib/site';
import { ensurePublicProfile } from '../lib/ensurePublicProfile';

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