import { useEffect, useState } from 'react';

/** value가 delayMs 동안 안 바뀐 뒤에만 갱신되는 디바운스 값 (검색 입력 등) */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
