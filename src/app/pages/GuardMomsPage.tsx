import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Baby, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/supabase';

type GuardMomRow = Database['public']['Tables']['certified_guard_moms']['Row'];

export function GuardMomsPage() {
  const [rows, setRows] = useState<GuardMomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from('certified_guard_moms')
        .select('*')
        .order('listing_visible_until', { ascending: false, nullsFirst: false });
      if (cancelled) return;
      if (error) {
        setErr('목록을 불러오지 못했습니다. Supabase에 보호맘 테이블 마이그레이션을 적용했는지 확인해 주세요.');
        setRows([]);
      } else {
        const all = (data ?? []) as GuardMomRow[];
        const now = Date.now();
        setRows(
          all.filter(
            (r) =>
              r.certified_at != null &&
              r.listing_visible_until != null &&
              new Date(r.listing_visible_until).getTime() > now,
          ),
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/80 pb-28">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-screen-md items-center gap-2 px-4">
          <Link
            to="/sitters"
            className="-ml-2 rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100"
            aria-label="뒤로"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-extrabold text-slate-800">인증 보호맘 란</h1>
        </div>
      </header>

      <div className="mx-auto max-w-screen-md space-y-4 px-4 pt-4">
        <p className="text-xs font-medium leading-relaxed text-slate-600">
          운영 인증을 마친 보호맘만 등록되며, <strong className="text-slate-800">유료 노출 기간</strong> 중인
          분만 여기에 보여요. 여행·출장 때 잠시 맡기기 전에 채팅으로 일정을 꼭 맞춰 주세요.
        </p>

        <Link
          to="/guard-mom/register"
          className="flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 py-3.5 text-sm font-extrabold text-orange-800 shadow-sm active:scale-[0.99] transition-transform"
        >
          <Baby className="h-4 w-4" />
          보호맘으로 프로필 등록 · 노출 결제
        </Link>

        {err && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {err}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-700">표시할 인증 보호맘이 없어요</p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              인증 완료 후 「7일 노출」을 결제하면 이곳에 나타나요.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((m) => (
              <li key={m.id}>
                <Link
                  to={`/guard-mom/${m.id}`}
                  className="block rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-orange-100 hover:shadow-md active:scale-[0.99]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-orange-100 text-2xl">
                      🍼
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-rose-600">인증 보호맘</p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-800">
                        {m.intro.trim() || '소개를 준비 중이에요.'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {[m.region_si, m.region_gu].filter(Boolean).join(' ') || '동네 미입력'}
                        </span>
                        <span className="text-orange-600">
                          1일 {m.per_day_fee_krw.toLocaleString('ko-KR')}원부터
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
