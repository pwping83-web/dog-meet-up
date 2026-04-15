export type PhoneAuthMode = 'sms' | 'solapi' | 'demo';

/** VITE_PHONE_AUTH 값: sms | solapi | (그 외 demo) */
export function getPhoneAuthMode(): PhoneAuthMode {
  const mode = import.meta.env.VITE_PHONE_AUTH?.trim().toLowerCase();
  if (mode === 'sms') return 'sms';
  if (mode === 'solapi') return 'solapi';
  return 'demo';
}

/** Supabase 기본 Phone(SMS) OTP 모드 */
export function isSupabaseSmsPhoneAuth(): boolean {
  return getPhoneAuthMode() === 'sms';
}

/** Solapi 커스텀 OTP 모드 */
export function isSolapiPhoneAuth(): boolean {
  return getPhoneAuthMode() === 'solapi';
}

/** 실제 문자 발송이 일어나는 모드(sms/solapi) */
export function isPhoneAuthLiveMode(): boolean {
  const mode = getPhoneAuthMode();
  return mode === 'sms' || mode === 'solapi';
}

/**
 * 국내 휴대폰 → E.164 (+82…).
 * 010-1234-5678, 01012345678, +821012345678 형태 지원.
 */
export function koreanMobileDigitsToE164(raw: string): string | null {
  const d = raw.replace(/\D/g, '');
  if (d.length < 10) return null;

  if (d.startsWith('82') && d.length >= 12) {
    const rest = d.slice(2);
    if (rest.startsWith('0')) return null;
    if (!/^1[016789]/.test(rest)) return null;
    return `+82${rest}`;
  }

  let body = d;
  if (body.startsWith('0')) body = body.slice(1);
  if (body.length < 9 || body.length > 10) return null;
  const prefix = body.slice(0, 2);
  if (!['10', '11', '16', '17', '18', '19'].includes(prefix)) return null;
  return `+82${body}`;
}

/** 숫자만 받아 010-0000-0000 형태로 (profiles·UI 공통) */
export function formatKoreanMobileDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
