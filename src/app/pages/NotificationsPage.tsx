import { useNavigate } from 'react-router';
import { ArrowLeft, Bell, MessageCircle, Smartphone, Zap } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import {
  canUseNotifications,
  pulseVibrate,
  requestNotificationPermission,
  showDeviceNotification,
} from '../../lib/deviceNotify';

/**
 * 알림 **설정** 전용 화면.
 * - 채팅/모임 **내역**은 댕팅·모임 화면에서 확인 (여기 없음).
 * - 여기서는 브라우저·기기 **푸시 허용**과 테스트만 다룸.
 */
export function NotificationsPage() {
  const navigate = useNavigate();
  const [perm, setPerm] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!canUseNotifications()) return;
    setPerm(Notification.permission);
  }, []);

  const refreshPerm = useCallback(() => {
    if (canUseNotifications()) setPerm(Notification.permission);
  }, []);

  const handleEnableNotify = async () => {
    const p = await requestNotificationPermission();
    setPerm(p);
    if (p === 'granted') {
      pulseVibrate([120, 60, 120]);
      await showDeviceNotification(
        '댕댕마켓',
        '기기 알림이 켜졌어요. 모임·채팅 소식을 팝업으로 보낼 수 있어요 🐾',
        { tag: 'daeng-permission-on' },
      );
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
    pulseVibrate([200, 100, 200, 100, 200]);
    await showDeviceNotification('댕댕마켓', '테스트 — 기기 알림이 이렇게 표시돼요.', {
      tag: `daeng-test-${Date.now()}`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
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
        {/* 채팅 알림 vs 기기 설정 구분 안내 */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">이 화면에서 하는 일</p>
          <ul className="mt-3 space-y-3 text-sm font-medium leading-relaxed text-slate-700">
            <li className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg" aria-hidden>
                📱
              </span>
              <span>
                <strong className="text-slate-900">기기·브라우저 알림</strong>
                <br />
                <span className="text-slate-600">
                  휴대폰이나 PC에서 <strong>팝업·진동</strong>으로 받을지 여부만 설정해요. (아래 카드)
                </span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600" aria-hidden>
                <MessageCircle className="h-5 w-5" />
              </span>
              <span>
                <strong className="text-slate-900">채팅·모임 알림 내역</strong>
                <br />
                <span className="text-slate-600">
                  메시지와 모임 소식 목록은 <strong>댕팅·모임</strong> 화면에서 확인해요. 이 페이지에는 목록이 없어요.
                </span>
              </span>
            </li>
          </ul>
        </div>

        {/* 기기 푸시 */}
        <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50/80 p-4 shadow-sm">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Smartphone className="h-5 w-5 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-slate-900">브라우저·기기 알림 (푸시)</p>
              <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-600">
                {!canUseNotifications()
                  ? '이 브라우저는 시스템 알림을 지원하지 않아요.'
                  : perm === 'granted'
                    ? '허용됨 — 새 소식이 오면 기기에서 팝업으로 알려줄 수 있어요. (진동은 기기 지원 시)'
                    : perm === 'denied'
                      ? '차단됨 — 브라우저 사이트 설정에서 이 주소의 알림을 켜 주세요.'
                      : '아직 허용 전이에요. 아래에서 허용하면 모임·채팅 소식을 기기 팝업으로 받을 수 있어요.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleEnableNotify()}
              disabled={!canUseNotifications() || perm === 'granted'}
              className="inline-flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white shadow-md transition-transform active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none"
            >
              <Bell className="h-4 w-4 shrink-0" />
              {perm === 'granted' ? '푸시 허용됨' : '푸시 알림 허용하기'}
            </button>
            <button
              type="button"
              onClick={() => void handleTestNotify()}
              disabled={!canUseNotifications()}
              className="inline-flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm font-extrabold text-orange-800 shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              <Zap className="h-4 w-4 shrink-0" />
              테스트 알림 보내기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
