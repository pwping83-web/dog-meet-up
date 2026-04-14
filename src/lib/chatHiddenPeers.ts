const STORAGE_KEY = 'daeng-chat-hidden-peers-v1';

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string' && x.length > 0);
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    /* ignore */
  }
}

export function getHiddenChatPeerIds(): string[] {
  if (typeof window === 'undefined') return [];
  return readIds();
}

export function hideChatPeerId(peerId: string) {
  if (typeof window === 'undefined' || !peerId.trim()) return;
  const id = peerId.trim();
  const prev = readIds();
  if (prev.includes(id)) {
    window.dispatchEvent(new CustomEvent('daeng-chat-hidden-changed'));
    return;
  }
  writeIds([...prev, id]);
  window.dispatchEvent(new CustomEvent('daeng-chat-hidden-changed'));
}

export function unhideChatPeerId(peerId: string) {
  if (typeof window === 'undefined' || !peerId.trim()) return;
  const next = readIds().filter((id) => id !== peerId.trim());
  writeIds(next);
  window.dispatchEvent(new CustomEvent('daeng-chat-hidden-changed'));
}
