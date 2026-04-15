import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Bell,
  Volume2,
  Smartphone,
  Zap,
  CalendarHeart,
  MessageCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { canUseNotifications, requestNotificationPermission } from '../../lib/deviceNotify';
import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from '../../lib/notificationPreferences';

/** 큰 토글 스위치 — 어르신도 쉽게 터치 */
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
      className={`relative h-9 w-16 shrink-0 rounded-full transition-colors duration-300 disabled:opacity-35 ${
        checked ? 'bg-market-cta' : 'bg-slate-200'
      }`}
    >
      <span
        className={`absolute top-1.5 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 ${
          checked ? 'right-1.5 left-auto' : 'left-1.5 right-auto'
        }`}
      />
    </button>
  );
}

/** 항목 한 줄 */
function PrefRow({
  icon: Icon,
  iconColor,
  title,
  desc,
  checked,
  onChange,
  disabled,
}: {
  icon: typeof Bell;
  iconColor: string;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconColor}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-slate-900">{title}</p>
          <p className="text-xs font-medium leading-snug text-slate-500">{desc}</p>
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

  const patchPrefs = useCallback((patch: Partial<NotificationPrefs>) => {
    const next = saveNotificationPrefs(patch);
    setPrefs(next);
  }, []);

  const handleEnableNotify = async () => {
    const p = await requestNotificationPermission();
    setPerm(p);
    if (p === 'granted') {
      patchPrefs({ popup: true });
    } else if (p === 'denied') {
      alert(
        '브라우저에서 알림이 막혀 있어요.\n\nAndroid: 설정 → 앱 → Chrome → 알림 → 허용\niOS: 설정 → Safari → 웹사이트 설정 → 알림',
      );
    }
  };

  const pushMasterOn = canUseNotifications() && perm === 'granted' && prefs.popup;

  const setPushMaster = async (on: boolean) => {
    if (!canUseNotifications()) return;
    const livePerm = Notification.permission;
    setPerm(livePerm);
    if (!on) { patchPrefs({ popup: false }); return; }
    if (livePerm === 'granted') { patchPrefs({ popup: true }); return; }
    if (livePerm === 'denied') {
      alert('브라우저에서 알림이 막혀 있어요.\n\nAndroid: 설정 → 앱 → Chrome → 알림 → 허용\niOS: 설정 → Safari → 웹사이트 설정 → 알림');
      return;
    }
    await handleEnableNotify();
  };

  const canPush = canUseNotifications();

  // 브라우저 권한 상태 표시
  const permBadge = !canPush
    ? { icon: AlertCircle, text: '이 브라우저는 알림 미지원', color: 'text-slate-400', bg: 'bg-slate-100' }
    : perm === 'granted'
      ? { icon: CheckCircle2, text: '알림 허용됨', color: 'text-emerald-700', bg: 'bg-emerald-50' }
      : perm === 'denied'
        ? { icon: XCircle, text: '알림 차단됨 — 브라우저 설정에서 허용해주세요', color: 'text-red-700', bg: 'bg-red-50' }
        : { icon: AlertCircle, text: '아직 허용 안 됨 — 아래 버튼을 눌러주세요', color: 'text-amber-700', bg: 'bg-amber-50' };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-market-header shadow-market-lg">
        <div className="mx-auto flex h-14 max-w-screen-md items-center gap-2 px-4">
          <button
            type="button"
            onClick={() => navigate('/my')}
            className="-ml-2 rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
            aria-label="내 댕댕으로"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-extrabold text-white">알림 설정</h1>
        </div>
      </header>

      <div className="mx-auto max-w-screen-md space-y-5 px-4 py-6 pb-16">

        {/* 브라우저 권한 상태 배너 */}
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 ${permBadge.bg}`}>
          <permBadge.icon className={`h-5 w-5 shrink-0 ${permBadge.color}`} aria-hidden />
          <p className={`text-sm font-bold ${permBadge.color}`}>{permBadge.text}</p>
        </div>

        {/* ① 알림 켜기/끄기 */}
        <section>
          <p className="mb-2 px-1 text-sm font-extrabold text-slate-700">🔔 알림 켜기</p>
          <div className="overflow-hidden rounded-3xl border border-brand/20 bg-white px-4 shadow-sm">
            <PrefRow
              icon={Bell}
              iconColor="bg-brand/10 text-brand"
              title="푸시 알림"
              desc="채팅·모임 알림을 받아요"
              checked={pushMasterOn}
              onChange={(v) => void setPushMaster(v)}
              disabled={!canPush}
            />
          </div>
        </section>

        {/* ② 알림 방식 */}
        <section>
          <p className="mb-2 px-1 text-sm font-extrabold text-slate-700">📳 알림 방식</p>
          <div className="overflow-hidden rounded-3xl border border-brand/20 bg-white px-4 shadow-sm">
            <PrefRow
              icon={Volume2}
              iconColor="bg-orange-100 text-orange-600"
              title="소리"
              desc="알림음이 울려요"
              checked={prefs.sound}
              onChange={(v) => patchPrefs({ sound: v })}
              disabled={!canPush}
            />
            <PrefRow
              icon={Smartphone}
              iconColor="bg-violet-100 text-violet-600"
              title="팝업"
              desc="화면에 알림창이 떠요"
              checked={prefs.popup}
              onChange={(v) => patchPrefs({ popup: v })}
              disabled={!canPush || perm !== 'granted'}
            />
            <PrefRow
              icon={Zap}
              iconColor="bg-yellow-100 text-yellow-600"
              title="진동"
              desc="진동으로 알려줘요 (스마트폰만)"
              checked={prefs.vibrate}
              onChange={(v) => patchPrefs({ vibrate: v })}
            />
          </div>
        </section>

        {/* ③ 활동 알림 */}
        <section>
          <p className="mb-2 px-1 text-sm font-extrabold text-slate-700">📋 받을 알림 종류</p>
          <div className="overflow-hidden rounded-3xl border border-brand/20 bg-white px-4 shadow-sm">
            <PrefRow
              icon={CalendarHeart}
              iconColor="bg-emerald-100 text-emerald-600"
              title="모이자 · 만나자 알림"
              desc="모임 신청·확인 알림"
              checked={prefs.meetup}
              onChange={(v) => patchPrefs({ meetup: v })}
              disabled={!canPush}
            />
            <PrefRow
              icon={MessageCircle}
              iconColor="bg-sky-100 text-sky-600"
              title="채팅 알림"
              desc="새 메시지가 오면 알려줘요"
              checked={prefs.chat}
              onChange={(v) => patchPrefs({ chat: v })}
              disabled={!canPush}
            />
          </div>
        </section>

        {/* ④ 브라우저 허용 버튼 */}
        {canPush && perm !== 'granted' && (
          <button
            type="button"
            onClick={() => void handleEnableNotify()}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-market-cta text-base font-extrabold text-white shadow-market transition-all active:scale-[0.98]"
          >
            <Bell className="h-5 w-5" aria-hidden />
            브라우저 알림 허용하기
          </button>
        )}

      </div>
    </div>
  );
}
