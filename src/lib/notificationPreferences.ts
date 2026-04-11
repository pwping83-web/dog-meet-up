/** 알림 설정 (로컬 저장 — 서버 연동 전까지) */
const STORAGE_KEY = 'daeng_notification_prefs_v1';

export type NotificationPrefs = {
  sound: boolean;
  popup: boolean;
  vibrate: boolean;
  meetup: boolean;
  chat: boolean;
};

const DEFAULTS: NotificationPrefs = {
  sound: true,
  popup: true,
  vibrate: true,
  meetup: true,
  chat: true,
};

export function loadNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const j = JSON.parse(raw) as Partial<NotificationPrefs>;
    return { ...DEFAULTS, ...j };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveNotificationPrefs(patch: Partial<NotificationPrefs>): NotificationPrefs {
  const next = { ...loadNotificationPrefs(), ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
