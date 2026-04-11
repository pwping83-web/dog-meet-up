import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { startGuardMomCareCheckout } from '../../lib/billing';

type GuardMomRow = Database['public']['Tables']['certified_guard_moms']['Row'];

export function GuardMomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mom, setMom] = useState<GuardMomRow | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(1);
  const [message, setMessage] = useState('');
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [payBusy, setPayBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let c = false;
    (async () => {
      setLoading(true);
      setLoadErr(null);
      const { data, error } = await supabase.from('certified_guard_moms').select('*').eq('id', id).maybeSingle();
      if (c) return;
      if (error || !data) {
        setLoadErr('프로필을 불러오지 못했습니다.');
        setMom(null);
      } else {
        setMom(data as GuardMomRow);
      }
      setLoading(false);
    })();
    return () => {
      c = true;
    };
  }, [id]);

  const isOwn = user && mom && user.id === mom.user_id;
  const total = mom ? days * mom.per_day_fee_krw : 0;

  const handleRequestPay = async () => {
    if (!user || !mom || isOwn) return;
    if (days < 1 || days > 30) {
      setSubmitErr('일수는 1~30일로 입력해 주세요.');
      return;
    }
    setSubmitErr(null);
    setPayBusy(true);
    try {
      const { data: row, error: insErr } = await supabase
        .from('guard_mom_bookings')
        .insert({
          guard_mom_id: mom.id,
          applicant_id: user.id,
          days,
          message: message.trim(),
          per_day_fee_snapshot: mom.per_day_fee_krw,
          total_krw: days * mom.per_day_fee_krw,
          status: 'pending_payment',
        })
        .select('id')
        .single();

      if (insErr || !row) {
        throw new Error(insErr?.message ?? '예약을 만들지 못했습니다.');
      }

      await startGuardMomCareCheckout(row.id);
    } catch (e) {
      setSubmitErr((e as Error).message);
    } finally {
      setPayBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-32">
      <header className="sticky top-0 z-40 bg-market-header shadow-market-lg">
        <div className="mx-auto flex h-14 max-w-screen-md items-center gap-2 px-3">
          <button
            type="button"
            onClick={() => navigate('/sitters?care=guard')}
            className="-ml-1 rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
            aria-label="유료 돌봄 목록으로"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-extrabold text-white">보호맘 프로필</h1>
        </div>
      </header>

      <div className="mx-auto max-w-screen-md space-y-4 px-4 pt-4">
        {loading || authLoading ? (
          <div className="flex justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : loadErr || !mom ? (
          <p className="py-12 text-center text-sm font-medium text-slate-500">{loadErr ?? '없는 프로필이에요.'}</p>
        ) : (
          <>
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-wide text-orange-600">인증 보호맘</p>
              <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-800">
                {mom.intro.trim() || '소개 글이 없어요.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {[mom.region_si, mom.region_gu].filter(Boolean).join(' ') || '동네 미입력'}
                </span>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-brand">
                  1일 돌봄 {mom.per_day_fee_krw.toLocaleString('ko-KR')}원
                </span>
              </div>
              {mom.listing_visible_until && (
                <p className="mt-3 text-[11px] font-semibold text-slate-400">
                  노출 기한: {new Date(mom.listing_visible_until).toLocaleString('ko-KR')}
                </p>
              )}
            </div>

            {isOwn ? (
              <Link
                to="/guard-mom/register"
                className="block w-full rounded-2xl bg-slate-900 py-3.5 text-center text-sm font-extrabold text-white shadow-md"
              >
                내 프로필 · 노출 관리
              </Link>
            ) : !user ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <p className="text-sm font-semibold text-slate-600">돌봄 신청·결제는 로그인 후 가능해요.</p>
                <Link
                  to="/login"
                  className="mt-3 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-extrabold text-white shadow-md"
                >
                  로그인하기
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50/95 to-amber-50/80 p-5 shadow-sm">
                <h2 className="text-sm font-extrabold text-slate-900">돌봄 일정 신청 (Stripe 결제)</h2>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  일수 × 1일 요금으로 결제됩니다. 세부 일정·집 맡기기는 채팅으로 조율해 주세요.
                </p>
                <label className="mt-4 block text-xs font-extrabold text-slate-700">
                  맡길 일수 (1~30)
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={days}
                    onChange={(e) => setDays(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900"
                  />
                </label>
                <label className="mt-3 block text-xs font-extrabold text-slate-700">
                  남길 말 (선택)
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="예: 3/15~3/17 출장, 산책 하루 2회 희망"
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800"
                  />
                </label>
                <p className="mt-3 text-sm font-black text-brand">
                  합계 {total.toLocaleString('ko-KR')}원
                </p>
                {submitErr && (
                  <p className="mt-2 text-xs font-semibold text-red-600">{submitErr}</p>
                )}
                <button
                  type="button"
                  disabled={payBusy}
                  onClick={() => void handleRequestPay()}
                  className="mt-4 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-sm font-extrabold text-white shadow-md disabled:opacity-60"
                >
                  {payBusy ? '처리 중…' : '예약 만들고 Stripe로 결제'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
