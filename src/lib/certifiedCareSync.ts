const CHANNEL = 'daeng-certified-care-sync';

/** 인증 돌봄 데이터 변경 시 목록·다른 탭이 다시 불러오도록 */
export function broadcastCertifiedCareDataChanged(): void {
  window.dispatchEvent(new CustomEvent('daeng-certified-guard-moms-changed'));
  try {
    const bc = new BroadcastChannel(CHANNEL);
    bc.postMessage('refetch');
    queueMicrotask(() => bc.close());
  } catch {
    /* BroadcastChannel 미지원 등 */
  }
}

export function subscribeCertifiedCareDataChanged(onRefetch: () => void): () => void {
  const handler = () => onRefetch();
  window.addEventListener('daeng-certified-guard-moms-changed', handler);

  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = () => onRefetch();
  } catch {
    /* ignore */
  }

  return () => {
    window.removeEventListener('daeng-certified-guard-moms-changed', handler);
    bc?.close();
  };
}
