import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, MapPin, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { isAuthUserUuid } from '../../lib/profileIds';
import { setAuthReturnPath } from '../components/AuthReturnRedirect';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

type PublicProfile = {
  name: string;
  avatar_url: string | null;
  region_si: string | null;
  region_gu: string | null;
};

export function MemberProfilePage() {
  const { id: rawId = '' } = useParams();
  const id = rawId.trim();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const meetupId = searchParams.get('mid')?.trim() ?? '';
  const meetupTitle = searchParams.get('meetup')?.trim() ?? '';

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const validId = isAuthUserUuid(id);

  useEffect(() => {
    if (!validId) {
      setProfile(null);
      setErr('올바른 회원 링크가 아니에요.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('name,avatar_url,region_si,region_gu')
        .eq('id', id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setErr(error.message);
        setProfile(null);
      } else if (!data) {
        setErr('프로필을 찾을 수 없어요.');
        setProfile(null);
      } else {
        setProfile({
          name: String(data.name ?? '').trim() || '댕친',
          avatar_url: typeof data.avatar_url === 'string' ? data.avatar_url : null,
          region_si: typeof data.region_si === 'string' ? data.region_si : null,
          region_gu: typeof data.region_gu === 'string' ? data.region_gu : null,
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, validId]);

  const requireLogin = useCallback(() => {
    if (authLoading) return false;
    if (!user) {
      setAuthReturnPath(`${window.location.pathname}${window.location.search}`);
      navigate('/login');
      return false;
    }
    return true;
  }, [authLoading, user, navigate]);

  const openChatWithThisMember = useCallback(() => {
    if (!requireLogin()) return;
    if (user?.id === id) {
      alert('내 프로필이에요.');
      return;
    }
    if (!validId) return;
    const displayName = profile?.name?.trim() || '댕친';
    const params = new URLSearchParams({ name: displayName });
    if (meetupTitle) params.set('meetup', meetupTitle);
    if (meetupId) params.set('mid', meetupId);
    navigate(`/chat/${encodeURIComponent(id)}?${params.toString()}`);
  }, [requireLogin, user?.id, id, validId, profile?.name, meetupTitle, meetupId, navigate]);

  const regionLine = [profile?.region_si, profile?.region_gu].filter(Boolean).join(' ').trim();

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-screen-md items-center gap-2 px-3">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/my'))}
            className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100"
            aria-label="뒤로"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          {meetupId ? (
            <Link
              to={`/meetup/${encodeURIComponent(meetupId)}`}
              className="text-xs font-bold text-brand underline-offset-2 hover:underline"
            >
              모임 글
            </Link>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-screen-md px-5 py-8">
        {!validId ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">{err}</p>
        ) : loading ? (
          <div className="flex justify-center py-20 text-sm font-bold text-slate-400">불러오는 중…</div>
        ) : err || !profile ? (
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">{err ?? '없음'}</p>
        ) : (
          <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 to-amber-50 ring-2 ring-orange-100/80">
              {profile.avatar_url ? (
                <ImageWithFallback
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-orange-300" aria-hidden />
              )}
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">{profile.name}</h1>
            {regionLine ? (
              <p className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                {regionLine}
              </p>
            ) : null}

            {user?.id === id ? (
              <Link
                to="/my"
                className="mt-8 inline-flex w-full max-w-xs items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-sm font-extrabold text-slate-800 transition-colors hover:bg-slate-100"
              >
                내 정보 관리
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => void openChatWithThisMember()}
                disabled={authLoading}
                className="mt-8 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
                채팅하기
              </button>
            )}

            {!user && (
              <p className="mt-4 text-center text-[11px] font-semibold text-slate-500">
                채팅은{' '}
                <Link
                  to="/login"
                  onClick={() => setAuthReturnPath(`${window.location.pathname}${window.location.search}`)}
                  className="font-extrabold text-brand underline underline-offset-2"
                >
                  로그인
                </Link>
                후 가능해요.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
