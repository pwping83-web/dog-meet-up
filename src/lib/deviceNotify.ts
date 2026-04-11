/**
 * 모바일 브라우저/PWA: 시스템 알림 + 진동(Vibration API).
 * - Android Chrome: 알림·진동 모두 잘 동작하는 편입니다.
 * - iOS Safari: 홈 화면에 추가한 PWA에서 알림이 더 잘 되고, 웹 진동은 제한적일 수 있습니다.
 */

const DEFAULT_VIBRATE = [200, 100, 200, 100, 200] as const;

export function canUseNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/** 짧은 진동 패턴 (알림 수신·탭 피드백용) */
export function pulseVibrate(pattern: number | number[] = [...DEFAULT_VIBRATE]): void {
  try {
    if (canVibrate()) navigator.vibrate(pattern);
  } catch {
    /* 일부 브라우저에서 거부 */
  }
}

export function stopVibrate(): void {
  try {
    if (canVibrate()) navigator.vibrate(0);
  } catch {
    /* ignore */
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!canUseNotifications()) return 'denied';
  const cur = Notification.permission;
  if (cur === 'granted' || cur === 'denied') return cur;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

type NotifyOpts = {
  tag?: string;
  /** false면 진동만 생략 */
  vibrate?: boolean;
};

/**
 * 권한이 granted일 때 시스템 알림 표시. 등록된 Service Worker가 있으면 showNotification(백그라운드·진동 옵션에 유리).
 */
export async function showDeviceNotification(
  title: string,
  body: string,
  opts: NotifyOpts = {},
): Promise<boolean> {
  if (!canUseNotifications() || Notification.permission !== 'granted') {
    return false;
  }

  if (opts.vibrate !== false) {
    pulseVibrate();
  }

  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg) {
      await reg.showNotification(title, {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: opts.tag ?? 'daeng-notification',
        renotify: true,
        vibrate: [...DEFAULT_VIBRATE],
        requireInteraction: false,
      });
      return true;
    }
  } catch {
    /* SW 없으면 폴백 */
  }

  try {
    const n = new Notification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: opts.tag ?? 'daeng-notification',
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch {
    return false;
  }
}

/** 권한 요청 후(승인 시) 알림까지 한 번에 */
export async function notifyWithVibration(
  title: string,
  body: string,
  opts: NotifyOpts = {},
): Promise<boolean> {
  const p = await requestNotificationPermission();
  if (p !== 'granted') {
    if (opts.vibrate !== false) pulseVibrate([100, 50, 100]);
    return false;
  }
  return showDeviceNotification(title, body, opts);
}
