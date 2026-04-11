import { useNavigate } from 'react-router';
import { ArrowLeft, Bell, Volume2, Smartphone, Zap, CalendarHeart, MessageCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import {
  canUseNotifications,
  requestNotificationPermission,
  showDeviceNotification,
} from '../../lib/deviceNotify';
import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from '../../lib/notificationPreferences';

function PrefSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300 disabled:opacity-40 ${
        checked ? 'bg-orange-600 shadow-inner' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function PrefRow({
  icon: Icon,
  title,
  desc,
  checked,
  onChange,
  disabled,
}: {
  icon: typeof Bell;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3.5 last:border-0">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">{desc}</p>
        </div>
      </div>
      <PrefSwitch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<NotificationPrefs>(() => loadNotificationPrefs());
  const [perm, setPerm] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!canUseNotifications()) return;
    setPerm(Notification.permission);
  }, []);

  const refreshPerm = useCallback(() => {
    if (canUseNotifications()) setPerm(Notification.permission);
  }, []);

  const patchPrefs = useCallback((patch: Partial<NotificationPrefs>) => {
    const next = saveNotificationPrefs(patch);
    setPrefs(next);
  }, []);

  const handleEnableNotify = async () => {
    const p = await requestNotificationPermission();
    setPerm(p);
    if (p === 'granted') {
      await showDeviceNotification('댕댕마켓', '브라우저 알림이 허용됐어요 🐾', {
        tag: 'daeng-permission-on',
        bypassPrefs: true,
      });
      patchPrefs({ popup: true });
    } else if (p === 'denied') {
      alert('브라우저 설정에서 이 사이트의 알림을 허용해 주세요.');
    }
  };

  const handleTestNotify = async () => {
    refreshPerm();
    if (Notification.permission !== 'granted') {
      await handleEnableNotify();
      if (Notification.permission !== 'granted') return;
    }
    const p = loadNotificationPrefs();
    if (!p.popup) {
      alert('팝업 알림이 꺼져 있어요. 켠 뒤 다시 시도해 주세요.');
      return;
    }
    await showDeviceNotification('댕댕마켓', '테스트 알림이에요.', {
      tag: `daeng-test-${Date.now()}`,
    });
  };

  const canPush = canUseNotifications();

  return (
    <div className="min-h-screen bg-slate-50/50 pb-28">
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-screen-md items-center gap-2 px-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="-ml-2 rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100"
            aria-label="뒤로"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-extrabold text-slate-800">알림 설정</h1>
        </div>
      </header>

      <div className="mx-auto max-w-screen-md space-y-4 px-4 pt-4">
        <p className="text-xs font-medium text-slate-500">
          모임·채팅 <strong className="text-slate-700">목록</strong>은 댕팅에서 확인해요. 여기서는{' '}
          <strong className="text-slate-700">어떻게 알려줄지</strong>만 골라요.
        </p>

        <div className="rounded-3xl border border-slate-200 bg-white px-4 shadow-sm">
          <PrefRow
            icon={Volume2}
            title="소리"
            desc="알림음 (기기·브라우저 설정에 따라 달라요)"
            checked={prefs.sound}
            onChange={(v) => patchPrefs({ sound: v })}
            disabled={!canPush}
          />
          <PrefRow
            icon={Smartphone}
            title="팝업"
            desc="기기에 뜨는 알림창"
            checked={prefs.popup}
            onChange={(v) => patchPrefs({ popup: v })}
            disabled={!canPush}
          />
          <PrefRow
            icon={Zap}
            title="진동"
            desc="알림 올 때 진동 (지원 기기만)"
            checked={prefs.vibrate}
            onChange={(v) => patchPrefs({ vibrate: v })}
          />
          <PrefRow
            icon={CalendarHeart}
            title="모임 알림"
            desc="모임·신청 관련 푸시"
            checked={prefs.meetup}
            onChange={(v) => patchPrefs({ meetup: v })}
            disabled={!canPush}
          />
          <PrefRow
            icon={MessageCircle}
            title="채팅 알림"
            desc="새 메시지 푸시"
            checked={prefs.chat}
            onChange={(v) => patchPrefs({ chat: v })}
            disabled={!canPush}
          />
        </div>

        <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50/80 p-4 shadow-sm">
          <p className="text-sm font-extrabold text-slate-900">브라우저 알림 허용</p>
          <p className="mt-1 text-xs font-medium text-slate-600">
            {!canPush
              ? '이 브라우저는 알림을 지원하지 않아요.'
              : perm === 'granted'
                ? '허용됐어요. 팝업·소리·진동은 위 스위치로 조절해요.'
                : perm === 'denied'
                  ? '차단됨 — 사이트 설정에서 알림을 켜 주세요.'
                  : '팝업을 받으려면 먼저 허용이 필요해요.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleEnableNotify()}
              disabled={!canPush || perm === 'granted'}
              className="inline-flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white shadow-md transition-transform active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none"
            >
              <Bell className="h-4 w-4 shrink-0" />
              {perm === 'granted' ? '허용됨' : '허용 요청'}
            </button>
            <button
              type="button"
              onClick={() => void handleTestNotify()}
              disabled={!canPush}
              className="inline-flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm font-extrabold text-orange-800 shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              테스트 알림
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
