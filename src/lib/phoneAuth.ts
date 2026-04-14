/** VITE_PHONE_AUTH=sms 이면 Supabase Phone(SMS) OTP. 그 외는 데모(문자 없음, 코드 000000·익명 등). */
export function isSupabaseSmsPhoneAuth(): boolean {
  return import.meta.env.VITE_PHONE_AUTH?.trim().toLowerCase() === 'sms';
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
