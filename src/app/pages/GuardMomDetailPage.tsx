import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Loader2, MapPin, Home, CarFront, PawPrint, MessageCircle, CalendarDays } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { startGuardMomCareCheckout } from '../../lib/billing';
import {
  getCertifiedGuardMomPhotoUrl,
  getMockCertifiedGuardMomById,
  isMockGuardMomId,
} from '../data/mockCertifiedGuardMoms';
import { displayCertifiedGuardMomIntro } from '../data/virtualDogPhotos';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { formatCertifiedGuardMomLocation } from '../data/regions';
import { GUARD_MOM_REQUEST_LEGAL_FOOTNOTE } from '../../lib/platformLegalCopy';

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
      const mockRow = getMockCertifiedGuardMomById(id);
      if (data && !error) {
        setMom(data as GuardMomRow);
        setLoadErr(null);
      } else if (mockRow) {
        setMom(mockRow as GuardMomRow);
        setLoadErr(null);
      } else if (error) {
        setLoadErr('프로필을 불러오지 못했습니다.');
        setMom(null);
      } else {
        setLoadErr(null);
        setMom(null);
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
    if (isMockGuardMomId(mom.id)) {
      setSubmitErr('가상 프로필은 예약을 할 수 없어요.');
      return;
    }
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
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="sticky top-0 z-40 bg-market-header shadow-market-lg">
        <div className="mx-auto flex h-14 max-w-screen-md items-center gap-2 px-3">
          <button
            type="button"
            onClick={() =>
              window.history.length > 1 ? navigate(-1) : navigate('/sitters?view=care&care=guard')
            }
            className="-ml-1 rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
            aria-label="뒤로"
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
            <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
              <ImageWithFallback
                src={getCertifiedGuardMomPhotoUrl(mom.id)}
                alt="인증 보호맘 프로필"
                className="aspect-[16/9] w-full object-cover sm:aspect-[21/9]"
                loading="lazy"
              />
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-wide text-orange-600">인증 보호맘</p>
              <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-800">
                {displayCertifiedGuardMomIntro(mom)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {formatCertifiedGuardMomLocation(mom)}
                </span>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-brand">
                  1일 돌봄 {mom.per_day_fee_krw.toLocaleString('ko-KR')}원
                </span>
                {mom.offers_daeng_pickup === true && (
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-900">댕댕 픽업 가능</span>
                )}
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
                <p className="text-sm font-semibold text-slate-600">돌봄 신청은 로그인 후 가능해요.</p>
                <Link
                  to="/login"
                  className="mt-3 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-extrabold text-white shadow-md"
                >
                  로그인하기
                </Link>
              </div>
            ) : isMockGuardMomId(mom.id) ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center shadow-sm">
                <p className="text-sm font-bold text-slate-700">체험용 가상 프로필이에요</p>
                <p className="mt-2 text-xs font-medium text-slate-500">데모라 예약은 연결 안 돼요. 진짜 보호맘은 신청 후 채팅으로 이어져요.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50/95 to-amber-50/80 p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-orange-500" aria-hidden />
                  <h2 className="text-sm font-extrabold text-slate-900">돌봄 일정 신청</h2>
                </div>
                <div className="mb-3 grid grid-cols-3 gap-1.5 text-center">
                  <div className="rounded-lg bg-white/90 py-1.5 shadow-sm">
                    <Home className="mx-auto h-3.5 w-3.5 text-orange-500" aria-hidden />
                    <p className="mt-0.5 text-[9px] font-extrabold leading-tight">맡기기</p>
                  </div>
                  <div className="rounded-lg bg-white/90 py-1.5 shadow-sm">
                    <CarFront className="mx-auto h-3.5 w-3.5 text-orange-500" aria-hidden />
                    <p className="mt-0.5 text-[9px] font-extrabold leading-tight">픽업</p>
                  </div>
                  <div className="rounded-lg bg-white/90 py-1.5 shadow-sm">
                    <PawPrint className="mx-auto h-3.5 w-3.5 text-orange-500" aria-hidden />
                    <p className="mt-0.5 text-[9px] font-extrabold leading-tight">집으로</p>
                  </div>
                </div>
                <p className="flex items-start gap-1.5 text-[11px] font-medium leading-snug text-slate-600">
                  <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" aria-hidden />
                  요금은 일수 × 1일 요금이에요. 끝나면 집까지 같이 가요·데리러 오기 등은 채팅으로 천천히 정하면 돼요 ~~
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
                <p className="mt-3 text-[10px] font-medium leading-relaxed text-slate-500">
                  {GUARD_MOM_REQUEST_LEGAL_FOOTNOTE}
                </p>
                <button
                  type="button"
                  disabled={payBusy}
                  onClick={() => void handleRequestPay()}
                  className="mt-4 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-sm font-extrabold text-white shadow-md disabled:opacity-60"
                >
                  {payBusy ? '처리 중…' : '예약 만들고 다음 단계로'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
