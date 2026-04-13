import type { MouseEvent } from 'react';
import type { NavigateFunction } from 'react-router';
import { toast } from 'sonner';

const MSG = '로그인이 필요한 서비스입니다.';

/** 비로그인이면 이동을 막고 토스트 후 /login 으로 보냅니다. true = 차단됨 */
export function interceptGuestNav(
  e: MouseEvent<HTMLAnchorElement>,
  hasUser: boolean,
  navigate: NavigateFunction,
): boolean {
  if (hasUser) return false;
  e.preventDefault();
  e.stopPropagation();
  toast.error(MSG);
  navigate('/login');
  return true;
}
