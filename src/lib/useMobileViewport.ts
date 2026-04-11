import { useEffect, useState } from 'react';

/** 뷰포트 너비 기준 모바일 전용 앱과 동일하게 맞춤 */
const MOBILE_MAX_WIDTH_PX = 768;

function readIsMobile(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`).matches;
}

export function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(readIsMobile);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
