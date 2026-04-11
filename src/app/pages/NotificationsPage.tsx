import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Bell,
  Volume2,
  Smartphone,
  Zap,
  CalendarHeart,
  MessageCircle,
  ChevronRight,
} from 'lucide-react';
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

/** 이수리마켓류 UI — 브랜드 보라 */
const BRAND = '#5E43FF';

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
        checked ? 'shadow-inner' : 'bg-slate-200'
      }`}
      style={checked ? { backgroundColor: BRAND } : undefined}
    >
      <span
        className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function SectionLabel({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-2 px-1 pt-2">
      <p className="text-xs font-extrabold text-slate-500">{title}</p>
      {subtitle && <p className="mt-0.5 text-[11px] font-medium text-slate-400">{subtitle}</p>}
    </div>
  );
}

function PrefRow({
  icon: Icon,
  iconBg,
  title,
  desc,
  checked,
  onChange,
  disabled,
  hideBorder,
}: {
  icon: typeof Bell;
  iconBg: string;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  hideBorder?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-4 ${hideBorder ? '' : 'border-b border-slate-100'} last:border-0`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}
          style={{ color: BRAND }}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs font-medium leading-snug text-slate-500">{desc}</p>
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
      alert(
        '브라우저에서 알림이 막혀 있어요.\n\nAndroid: 설정 → 앱 → Chrome(또는 사용 중인 브라우저) → 알림 → 허용\niOS: 설정 → Safari → 웹사이트 설정 → 알림',
      );
    }
  };

  const pushMasterOn = canUseNotifications() && perm === 'granted' && prefs.popup;

  const setPushMaster = async (on: boolean) => {
    if (!canUseNotifications()) return;
    if (on) {
      await handleEnableNotify();
      return;
    }
    patchPrefs({ popup: false });
  };

  const handleTestNotify = async () => {
    refreshPerm();
    if (Notification.permission !== 'granted') {
      await handleEnableNotify();
      if (Notification.permission !== 'granted') return;
    }
    const p = loadNotificationPrefs();
    if (!p.popup) {
      alert('알림 표시가 꺼져 있어요. 켠 뒤 다시 시도해 주세요.');
      return;
    }
    await showDeviceNotification('댕댕마켓', '테스트 알림이에요.', {
      tag: `daeng-test-${Date.now()}`,
    });
  };

  const canPush = canUseNotifications();

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-28">
      <header
        className="sticky top-0 z-10 shadow-sm"
        style={{ backgroundColor: BRAND }}
      >
        <div className="mx-auto flex h-14 max-w-screen-md items-center gap-2 px-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
            aria-label="뒤로"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-extrabold text-white">알림 설정</h1>
        </div>
      </header>

      <div className="mx-auto max-w-screen-md space-y-1 px-4 pt-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <PrefRow
            icon={Bell}
            iconBg="bg-violet-100"
            title="푸시 알림"
            desc="브라우저를 닫아도 만남·채팅 알림을 받을 수 있어요"
            checked={pushMasterOn}
            onChange={(v) => void setPushMaster(v)}
            disabled={!canPush}
            hideBorder
          />
        </div>

        <SectionLabel title="알림 방식" subtitle="알림이 올 때 기기에서 어떻게 보일지 골라요" />

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-4 shadow-sm">
          <PrefRow
            icon={Volume2}
            iconBg="bg-violet-100"
            title="소리"
            desc="알림음으로 알려줘요 (기기·브라우저 설정에 따라 달라요)"
            checked={prefs.sound}
            onChange={(v) => patchPrefs({ sound: v })}
            disabled={!canPush}
          />
          <PrefRow
            icon={Smartphone}
            iconBg="bg-amber-100"
            title="팝업"
            desc="화면에 알림창으로 표시해요"
            checked={prefs.popup}
            onChange={(v) => patchPrefs({ popup: v })}
            disabled={!canPush || perm !== 'granted'}
          />
          <PrefRow
            icon={Zap}
            iconBg="bg-amber-100"
            title="진동"
            desc="알림 시 진동으로 알려줘요 (지원 기기만)"
            checked={prefs.vibrate}
            onChange={(v) => patchPrefs({ vibrate: v })}
            hideBorder
          />
        </div>

        <SectionLabel title="활동 알림" subtitle="받고 싶은 알림 종류를 선택해요" />

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-4 shadow-sm">
          <PrefRow
            icon={CalendarHeart}
            iconBg="bg-emerald-100"
            title="모이자·만나자 알림"
            desc="만남 글·참여 신청 알림"
            checked={prefs.meetup}
            onChange={(v) => patchPrefs({ meetup: v })}
            disabled={!canPush}
          />
          <PrefRow
            icon={MessageCircle}
            iconBg="bg-sky-100"
            title="채팅 알림"
            desc="새 메시지 알림"
            checked={prefs.chat}
            onChange={(v) => patchPrefs({ chat: v })}
            disabled={!canPush}
            hideBorder
          />
        </div>

        <SectionLabel title="브라우저" subtitle="권한은 기기 설정과 브라우저마다 달라요" />

        <button
          type="button"
          onClick={() => void handleEnableNotify()}
          className="flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-4 py-4 text-left shadow-sm transition-colors active:bg-slate-50"
        >
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <Smartphone className="h-[18px] w-[18px]" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">브라우저 알림 허용</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {!canPush
                  ? '이 브라우저는 알림을 지원하지 않아요'
                  : perm === 'granted'
                    ? '허용됨 — 끄려면 브라우저 설정에서 사이트 알림을 변경하세요'
                    : perm === 'denied'
                      ? '차단됨 — 브라우저 설정에서 이 사이트 알림을 켜 주세요'
                      : '탭하면 브라우저에 알림 허용을 요청해요'}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => void handleTestNotify()}
          disabled={!canPush}
          className="mt-2 w-full rounded-2xl border-2 py-3.5 text-sm font-extrabold transition-all active:scale-[0.99] disabled:opacity-40"
          style={{ borderColor: BRAND, color: BRAND }}
        >
          테스트 알림 보내기
        </button>

        <p className="pb-6 pt-2 text-center text-[11px] font-medium text-slate-400">
          만남·채팅 목록은 댕팅에서 확인해요
        </p>
      </div>
    </div>
  );
}
