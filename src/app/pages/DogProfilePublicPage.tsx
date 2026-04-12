import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

type DogProfileRow = {
  id: string;
  name: string;
  breed: string | null;
  age: number | null;
  gender: string | null;
  photo_url: string | null;
  city: string | null;
  district: string | null;
  created_at?: string;
};

export function DogProfilePublicPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dog, setDog] = useState<DogProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setErr('잘못된 주소예요.');
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data, error } = await supabase.from('dog_profiles').select('*').eq('id', id).maybeSingle();
        if (cancelled) return;
        if (error) {
          setErr('프로필을 불러오지 못했어요.');
          setDog(null);
        } else if (data) {
          setDog(data as DogProfileRow);
        } else {
          setDog(null);
        }
      } catch {
        if (!cancelled) {
          setErr('프로필을 불러오지 못했어요.');
          setDog(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const locationLabel =
    dog?.city && dog?.district ? `${dog.city} ${dog.district}`.trim() : dog?.district ?? dog?.city ?? '';

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-screen-md items-center gap-2 px-3">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/explore'))}
            className="-ml-1 rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100"
            aria-label="뒤로"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-base font-extrabold text-slate-900">댕친 프로필</h1>
        </div>
      </header>

      <div className="mx-auto max-w-screen-md px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" aria-label="불러오는 중" />
          </div>
        ) : err ? (
          <p className="py-12 text-center text-sm font-medium text-slate-500">{err}</p>
        ) : !dog ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-700">찾을 수 없는 프로필이에요</p>
            <Link to="/explore" className="mt-4 inline-block text-sm font-extrabold text-orange-600 underline">
              홈으로 돌아가기
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="aspect-[4/3] w-full bg-orange-50">
              {dog.photo_url ? (
                <ImageWithFallback
                  src={dog.photo_url}
                  alt={dog.name}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              ) : (
                <div className="flex h-full min-h-[12rem] items-center justify-center text-7xl">🐶</div>
              )}
            </div>
            <div className="space-y-3 p-6">
              <p className="text-xs font-extrabold uppercase tracking-wide text-orange-600">등록 댕댕이</p>
              <h2 className="text-2xl font-black text-slate-900">{dog.name}</h2>
              <div className="flex flex-wrap gap-2 text-sm font-bold text-slate-600">
                {dog.breed && (
                  <span className="rounded-full bg-slate-100 px-3 py-1">{dog.breed}</span>
                )}
                {dog.age != null && (
                  <span className="rounded-full bg-slate-100 px-3 py-1">{dog.age}살</span>
                )}
                {dog.gender && (
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-800">{dog.gender}</span>
                )}
              </div>
              {locationLabel && (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  {locationLabel}
                </p>
              )}
              <p className="border-t border-slate-100 pt-4 text-xs font-medium leading-relaxed text-slate-500">
                모이자·만나자에서 가까운 댕친을 찾아 산책·모임을 함께해 보세요. 채팅은 글 상세에서 연결할 수 있어요 🐾
              </p>
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Link
                  to="/sitters"
                  className="flex-1 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-center text-sm font-extrabold text-white shadow-md shadow-orange-500/20 active:scale-[0.99]"
                >
                  모임·댕친 보러가기
                </Link>
                <Link
                  to="/create-meetup"
                  className="flex-1 rounded-2xl border-2 border-orange-200 bg-white py-3.5 text-center text-sm font-extrabold text-orange-700 active:scale-[0.99]"
                >
                  글 올리기
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
