import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Megaphone, ShieldCheck, ChevronDown, ChevronRight, GraduationCap, Loader2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { virtualDogPhotoForSeed } from '../data/virtualDogPhotos';
import { useAuth } from '../../contexts/AuthContext';
import {
  getEmailJsRuntimeSummary,
  getFeedbackInboxEmail,
  getTrainingPartnerInboxEmail,
  sendPartnerAdvertisementInquiryEmail,
  sendTrainingCourseApplicationEmail,
} from '../../lib/emailjs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

type ExploreVirtualTrainingAdProps = {
  /** `compact`: 돌봄 블록 바로 위 — 동일 배너 스타일, 여백·썸네일만 축소 */
  variant?: 'default' | 'compact';
};

const AD_TITLE = '댕댕케어 직업훈련 · 돌봄·맡기기';

/** 직업훈련·실습 교감 느낌 (Unsplash CDN) — 접힌 배너·펼침 썸네일 공통 */
const AD_THUMB_SRC =
  'https://images.unsplash.com/photo-1548199973-03cce0f87e95?w=560&h=420&fit=crop&q=85';

const AD_LEAD = '방문 돌봄·맡기기 직업, 기초·실무 훈련이에요. ';

const AD_HIGHLIGHT = '강사·돌봄 인력을 함께 키워 일자리를 늘립니다';

const AD_TAIL = '.';

function digitsOnly(s: string) {
  return s.replace(/\D/g, '');
}

/** 한국 휴대폰 번호(010 등) 대략 검증 */
function isLikelyKrMobile(d: string) {
  return /^01[016789]\d{7,8}$/.test(d);
}

function isLikelyEmail(s: string) {
  const t = s.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

const GUARD_MOM_TITLE = '인증 보호맘이란?';

const GUARD_MOM_BODY =
  '여기서 말하는 인증 보호맘은 일반 맡기기 글과 달리, 교육 수료 또는 공식적으로 인정받은 이력 등 플랫폼이 정한 기준을 갖춘 뒤 운영에서 인증된 돌봄 제공자예요.';

/**
 * 탐색 화면용 **가상 광고** UI 예시 (실제 업체·결제 아님).
 * 배너 카드 + 썸네일 + 하단 CTA로 클릭 유도, 상세는 접어 둠.
 */
export function ExploreVirtualTrainingAd({ variant = 'default' }: ExploreVirtualTrainingAdProps) {
  const { user } = useAuth();
  const compact = variant === 'compact';
  /** 배너 본문(썸네일·긴 카피·CTA) — 기본 접힘 */
  const [bannerOpen, setBannerOpen] = useState(false);
  /** 하단 '인증 보호맘' 등 추가 안내 */
  const [detailsOpen, setDetailsOpen] = useState(false);
  /** 훈련 과정 신청 양식 */
  const [applyOpen, setApplyOpen] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantNote, setApplicantNote] = useState('');
  const [applySubmitting, setApplySubmitting] = useState(false);

  const [adPartnerModalOpen, setAdPartnerModalOpen] = useState(false);
  const [adCompanyName, setAdCompanyName] = useState('');
  const [adContactEmail, setAdContactEmail] = useState('');
  const [adContactPhone, setAdContactPhone] = useState('');
  const [adPartnerNote, setAdPartnerNote] = useState('');
  const [adPartnerSubmitting, setAdPartnerSubmitting] = useState(false);

  const cardPad = compact ? 'px-5 py-5 max-md:px-4 max-md:py-5' : 'px-6 py-7 max-md:px-5 max-md:py-6 md:px-8 md:py-8';
  const collapsedPad = compact ? 'px-4 py-3.5 max-md:px-3.5 max-md:py-3.5' : 'px-5 py-4 max-md:px-4 max-md:py-4';
  const thumbBox = compact
    ? 'h-[7.5rem] w-full sm:h-[5.5rem] sm:w-[7.5rem] shrink-0 overflow-hidden rounded-2xl border border-violet-200/60 bg-white/60 shadow-sm'
    : 'h-[10rem] w-full sm:h-[7.5rem] sm:w-[11rem] md:h-[8.25rem] md:w-[12.5rem] shrink-0 overflow-hidden rounded-2xl border border-violet-200/60 bg-white/70 shadow-md shadow-violet-200/30';

  const collapsedThumbBox = compact
    ? 'relative h-12 w-[3.35rem] shrink-0 overflow-hidden rounded-xl border border-violet-300/60 bg-white shadow-md shadow-violet-400/15 ring-2 ring-white/90'
    : 'relative h-14 w-[4.5rem] max-md:h-[3.35rem] max-md:w-[4.25rem] shrink-0 overflow-hidden rounded-2xl border-2 border-white/90 bg-white shadow-lg shadow-violet-500/20 ring-1 ring-violet-200/80';

  const handleTrainingApplySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (applySubmitting) return;
    const name = applicantName.trim();
    const phoneDigits = digitsOnly(applicantPhone);
    if (!name) {
      alert('이름을 입력해 주세요.');
      return;
    }
    if (!isLikelyKrMobile(phoneDigits)) {
      alert('휴대폰 번호를 확인해 주세요. (예: 01012345678)');
      return;
    }
    const accountHint = user?.email?.trim() || user?.id || '비로그인';
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    setApplySubmitting(true);
    try {
      await sendTrainingCourseApplicationEmail({
        applicantName: name,
        applicantPhone: phoneDigits,
        applicantNote: applicantNote.trim(),
        applicantEmail: applicantEmail.trim(),
        accountHint,
        pageUrl,
      });
      alert(
        '신청이 접수되었어요. 제휴 교육소에서 입력하신 번호로 연락드릴 수 있어요. (이메일로도 전달됩니다)',
      );
      setApplicantName('');
      setApplicantPhone('');
      setApplicantEmail('');
      setApplicantNote('');
      setApplyOpen(false);
      return;
    } catch (err) {
      const reason = (err as Error)?.message ?? '알 수 없는 오류';
      const origin = typeof window !== 'undefined' ? window.location.origin : '(origin)';
      const shouldOpenMailApp = window.confirm(
        [
          '이메일 자동 전송에 실패했어요.',
          '',
          reason,
          '',
          '[확인할 항목]',
          '- EmailJS Service ID / Template ID / Public Key',
          '- 템플릿 변수: to_email, subject, message, html_message',
          `- EmailJS 도메인 허용 목록에 ${origin}`,
          `- 현재 앱 설정: ${getEmailJsRuntimeSummary()}`,
          '',
          '메일 앱으로 직접 보내기 창을 열까요?',
        ].join('\n'),
      );
      if (!shouldOpenMailApp) return;
      const inbox = getTrainingPartnerInboxEmail();
      const body = [
        '[댕댕케어 직업훈련 신청]',
        `이름: ${name}`,
        `전화: ${phoneDigits}`,
        applicantEmail.trim() ? `이메일: ${applicantEmail.trim()}` : '',
        applicantNote.trim() ? `\n문의:\n${applicantNote.trim()}` : '',
        '',
        `계정: ${accountHint}`,
      ]
        .filter(Boolean)
        .join('\n');
      const mailto = `mailto:${inbox}?subject=${encodeURIComponent(`[직업훈련 신청] ${name}`)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleAdPartnerModalOpenChange = (open: boolean) => {
    setAdPartnerModalOpen(open);
    if (!open) {
      setAdCompanyName('');
      setAdContactEmail('');
      setAdContactPhone('');
      setAdPartnerNote('');
    }
  };

  const handlePartnerAdSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (adPartnerSubmitting) return;
    const company = adCompanyName.trim();
    const email = adContactEmail.trim();
    const phoneDigits = digitsOnly(adContactPhone);
    if (!company) {
      alert('업체명을 입력해 주세요.');
      return;
    }
    if (!isLikelyEmail(email)) {
      alert('담당자 이메일을 확인해 주세요.');
      return;
    }
    if (phoneDigits && !isLikelyKrMobile(phoneDigits)) {
      alert('연락처 번호를 확인해 주세요. (예: 01012345678)');
      return;
    }
    const accountHint = user?.email?.trim() || user?.id || '비로그인';
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    setAdPartnerSubmitting(true);
    try {
      await sendPartnerAdvertisementInquiryEmail({
        companyName: company,
        contactEmail: email,
        contactPhone: phoneDigits,
        note: adPartnerNote.trim(),
        accountHint,
        pageUrl,
      });
      alert('문의가 운영 메일로 전달되었어요. 확인 후 회신드릴게요.');
      handleAdPartnerModalOpenChange(false);
    } catch (err) {
      const reason = (err as Error)?.message ?? '알 수 없는 오류';
      const origin = typeof window !== 'undefined' ? window.location.origin : '(origin)';
      const shouldOpenMailApp = window.confirm(
        [
          '이메일 자동 전송에 실패했어요.',
          '',
          reason,
          '',
          '[확인할 항목]',
          '- EmailJS Service ID / Template ID / Public Key',
          '- 템플릿 변수: to_email, subject, message, html_message',
          `- EmailJS 도메인 허용 목록에 ${origin}`,
          `- 현재 앱 설정: ${getEmailJsRuntimeSummary()}`,
          '',
          '메일 앱으로 직접 보내기 창을 열까요?',
        ].join('\n'),
      );
      if (!shouldOpenMailApp) return;
      const inbox = getFeedbackInboxEmail();
      const body = [
        '[탐색 배너 · 광고·제휴 문의]',
        `업체명: ${company}`,
        `담당 이메일: ${email}`,
        phoneDigits ? `연락처: ${phoneDigits}` : '',
        adPartnerNote.trim() ? `\n문의:\n${adPartnerNote.trim()}` : '',
        '',
        `계정: ${accountHint}`,
      ]
        .filter(Boolean)
        .join('\n');
      const mailto = `mailto:${inbox}?subject=${encodeURIComponent(`[광고·제휴 문의] ${company}`)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      handleAdPartnerModalOpenChange(false);
    } finally {
      setAdPartnerSubmitting(false);
    }
  };

  const adBadgeBtnBase =
    'cursor-pointer border-0 outline-none transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2';
  const adBadgeClassCollapsed = compact
    ? `${adBadgeBtnBase} inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-black text-white shadow-sm max-md:text-xs`
    : `${adBadgeBtnBase} inline-flex shrink-0 items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white shadow-sm`;
  const adBadgeClassExpanded = compact
    ? `${adBadgeBtnBase} inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-black text-white shadow-sm max-md:text-xs`
    : `${adBadgeBtnBase} inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white shadow-sm`;

  return (
    <article
      className={`relative overflow-hidden rounded-3xl border border-violet-200/80 bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50/90 shadow-md shadow-violet-200/25 max-md:rounded-2xl ${bannerOpen ? cardPad : collapsedPad}`}
      aria-label="가상 광고 예시 카드"
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-violet-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-indigo-300/15 blur-3xl" />

      {!bannerOpen ? (
        <div className="relative flex w-full min-w-0 items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setAdPartnerModalOpen(true)}
            className={adBadgeClassCollapsed}
            aria-label="광고·제휴 문의 보내기"
          >
            <Megaphone className="h-4 w-4 shrink-0" aria-hidden />
            광고 · 모집
          </button>
          <button
            type="button"
            onClick={() => setBannerOpen(true)}
            className="relative flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl text-left transition-colors hover:bg-violet-100/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black leading-snug text-slate-900 max-md:text-[15px]">댕댕케어 직업훈련</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500 max-md:text-[13px]">탭하면 요약·신청 안내</p>
            </div>
            <div className={collapsedThumbBox} aria-hidden>
              <ImageWithFallback
                src={AD_THUMB_SRC}
                fallbackSrc={virtualDogPhotoForSeed('explore-virtual-training-ad-collapsed')}
                alt=""
                className="h-full w-full object-cover"
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-violet-900/25 to-transparent" />
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-violet-600" aria-hidden />
          </button>
        </div>
      ) : null}

      {bannerOpen ? (
      <div className="relative flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAdPartnerModalOpen(true)}
            className={adBadgeClassExpanded}
            aria-label="광고·제휴 문의 보내기"
          >
            <Megaphone className="h-4 w-4 shrink-0" aria-hidden />
            광고 · 모집
          </button>
        </div>

        <div
          className={
            compact
              ? 'flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-5'
              : 'flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6 md:gap-8'
          }
        >
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 hidden rounded-lg bg-violet-600/10 p-1.5 text-violet-700 sm:block">
                <GraduationCap className="h-5 w-5 shrink-0" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  className={
                    compact
                      ? 'text-base font-black leading-snug tracking-tight text-slate-900 max-md:text-[15px]'
                      : 'text-lg font-black leading-snug tracking-tight text-slate-900 max-md:text-xl md:text-xl'
                  }
                >
                  {AD_TITLE}
                </h3>
                <p
                  className={
                    compact
                      ? 'mt-2 text-[13px] font-medium leading-relaxed text-slate-600 max-md:text-sm max-md:leading-relaxed'
                      : 'mt-3 text-sm font-medium leading-relaxed text-slate-600 max-md:text-[15px] max-md:leading-relaxed md:text-[15px] md:leading-relaxed'
                  }
                >
                  {AD_LEAD}
                  <strong className="font-bold text-violet-950">{AD_HIGHLIGHT}</strong>
                  {AD_TAIL}
                </p>
              </div>
            </div>
          </div>

          <div className={thumbBox}>
            <ImageWithFallback
              src={AD_THUMB_SRC}
              fallbackSrc={virtualDogPhotoForSeed('explore-virtual-training-ad-thumb')}
              alt="반려견 돌봄·훈련 안내 이미지"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setBannerOpen(false);
              setDetailsOpen(false);
              setApplyOpen(false);
            }}
            className="order-2 w-full rounded-xl border border-violet-200/80 bg-white/80 py-2.5 text-sm font-extrabold text-violet-900 transition-colors hover:bg-white sm:order-1 sm:w-auto sm:px-4"
          >
            광고 배너 접기
          </button>
          <button
            type="button"
            onClick={() => setApplyOpen((v) => !v)}
            aria-expanded={applyOpen}
            className="order-1 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-purple-600 px-4 py-3.5 text-center text-sm font-extrabold text-white shadow-lg shadow-purple-600/25 transition-all hover:bg-purple-700 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 sm:order-2 sm:max-w-xs"
          >
            {applyOpen ? '양식 접기' : '훈련 과정 신청하기'}
          </button>
        </div>

        {applyOpen && (
          <form
            onSubmit={(ev) => void handleTrainingApplySubmit(ev)}
            className="space-y-3 rounded-2xl border border-violet-200/90 bg-white/90 p-4 shadow-inner"
          >
            <p className="text-[11px] font-semibold leading-snug text-slate-600">
              제휴 교육소에 이메일로 전달되며, 번호로 안내 전화를 드릴 수 있어요.
            </p>
            <div>
              <label htmlFor="vt-apply-name" className="mb-1 block text-xs font-extrabold text-slate-700">
                이름 *
              </label>
              <input
                id="vt-apply-name"
                value={applicantName}
                onChange={(ev) => setApplicantName(ev.target.value)}
                autoComplete="name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label htmlFor="vt-apply-phone" className="mb-1 block text-xs font-extrabold text-slate-700">
                휴대폰 *
              </label>
              <input
                id="vt-apply-phone"
                inputMode="numeric"
                value={applicantPhone}
                onChange={(ev) => setApplicantPhone(ev.target.value)}
                autoComplete="tel"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                placeholder="01012345678"
              />
            </div>
            <div>
              <label htmlFor="vt-apply-email" className="mb-1 block text-xs font-extrabold text-slate-500">
                이메일 (선택)
              </label>
              <input
                id="vt-apply-email"
                type="email"
                value={applicantEmail}
                onChange={(ev) => setApplicantEmail(ev.target.value)}
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                placeholder="답장 받을 주소"
              />
            </div>
            <div>
              <label htmlFor="vt-apply-note" className="mb-1 block text-xs font-extrabold text-slate-500">
                문의·희망 일정 (선택)
              </label>
              <textarea
                id="vt-apply-note"
                value={applicantNote}
                onChange={(ev) => setApplicantNote(ev.target.value)}
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                placeholder="짧게 적어 주세요"
              />
            </div>
            <button
              type="submit"
              disabled={applySubmitting}
              className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-xl bg-violet-700 py-3 text-sm font-extrabold text-white transition-opacity disabled:opacity-60"
            >
              {applySubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                  전송 중…
                </>
              ) : (
                '신청 보내기'
              )}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          aria-expanded={detailsOpen}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold text-violet-800 transition-colors hover:bg-violet-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <span>{detailsOpen ? '상세 안내 접기' : '자세히 알아보기 · 상세 안내'}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} aria-hidden />
        </button>

        {detailsOpen && (
          <div className="space-y-5 border-t border-violet-200/70 pt-5">
            <div className="rounded-2xl border border-amber-200/90 bg-amber-50/95 px-4 py-4 max-md:px-4 max-md:py-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-extrabold text-amber-950 max-md:text-base">
                <ShieldCheck className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
                {GUARD_MOM_TITLE}
              </p>
              <p className="text-sm font-medium leading-loose text-amber-950/95 max-md:text-[15px] max-md:leading-loose">
                {GUARD_MOM_BODY}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/sitters?view=care&care=guard"
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-extrabold text-white transition-opacity active:opacity-90 sm:flex-none"
              >
                인증 돌봄(보호맘) 둘러보기
              </Link>
              <Link
                to="/customer-service#legal"
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-600 transition-colors hover:bg-slate-50 sm:flex-none"
              >
                법적 고지
              </Link>
            </div>
          </div>
        )}
      </div>
      ) : null}

      <Dialog open={adPartnerModalOpen} onOpenChange={handleAdPartnerModalOpenChange}>
        <DialogContent className="max-h-[min(90vh,640px)] gap-4 overflow-y-auto rounded-2xl border-violet-200 bg-white p-5 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">광고·제휴 문의</DialogTitle>
            <DialogDescription className="text-left text-sm font-medium text-slate-600">
              배너 노출을 원하시면 아래를 남겨 주세요. 운영 메일로 접수됩니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(ev) => void handlePartnerAdSubmit(ev)} className="space-y-3">
            <div>
              <label htmlFor="ad-partner-company" className="mb-1 block text-xs font-extrabold text-slate-700">
                업체명 *
              </label>
              <input
                id="ad-partner-company"
                value={adCompanyName}
                onChange={(ev) => setAdCompanyName(ev.target.value)}
                autoComplete="organization"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                placeholder="예: ○○케어"
              />
            </div>
            <div>
              <label htmlFor="ad-partner-email" className="mb-1 block text-xs font-extrabold text-slate-700">
                담당자 이메일 *
              </label>
              <input
                id="ad-partner-email"
                type="email"
                value={adContactEmail}
                onChange={(ev) => setAdContactEmail(ev.target.value)}
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                placeholder="회신 받을 주소"
              />
            </div>
            <div>
              <label htmlFor="ad-partner-phone" className="mb-1 block text-xs font-extrabold text-slate-500">
                연락처 (선택)
              </label>
              <input
                id="ad-partner-phone"
                inputMode="numeric"
                value={adContactPhone}
                onChange={(ev) => setAdContactPhone(ev.target.value)}
                autoComplete="tel"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                placeholder="01012345678"
              />
            </div>
            <div>
              <label htmlFor="ad-partner-note" className="mb-1 block text-xs font-extrabold text-slate-500">
                문의 (선택)
              </label>
              <textarea
                id="ad-partner-note"
                value={adPartnerNote}
                onChange={(ev) => setAdPartnerNote(ev.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                placeholder="노출 희망·업종 등 짧게"
              />
            </div>
            <button
              type="submit"
              disabled={adPartnerSubmitting}
              className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-xl bg-violet-700 py-3 text-sm font-extrabold text-white transition-opacity disabled:opacity-60"
            >
              {adPartnerSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                  전송 중…
                </>
              ) : (
                '문의 보내기'
              )}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </article>
  );
}
