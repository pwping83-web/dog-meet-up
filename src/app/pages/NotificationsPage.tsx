import { Link } from 'react-router';
import { ArrowLeft, Bell, X, Smartphone, Zap } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import {
  canUseNotifications,
  pulseVibrate,
  requestNotificationPermission,
  showDeviceNotification,
} from '../../lib/deviceNotify';

interface Notification {
  id: string;
  type: 'quote' | 'chat' | 'status' | 'review';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  details?: string;
  category?: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    isRead: false,
    type: 'quote',
    title: '💰 새로운 모임 신청이 도착했어요!',
    message: '강아지엄마님이 "한강 산책 모임"에 참여 신청을 보냈어요',
    timestamp: '5분 전',
    category: 'quote',
    link: '/meetup/1',
    details: '강아지엄마님께서 회원님의 모임에 참여 신청을 보내셨습니다.\n\n모임: 한강 산책 모임\n시간: 오후 2시\n위치: 서울 강남구\n\n상세 내용을 확인하고 수락해주세요!',
  },
  {
    id: '2',
    isRead: false,
    type: 'chat',
    title: '💬 새로운 메시지',
    message: '댕댕산책러버: 내일 시간 괜찮으시면 같이 산책해요!',
    timestamp: '1시간 전',
    category: 'chat',
    link: '/chat/2',
    details: '댕댕산책러버님으로부터 새로운 메시지가 도착했습니다.\n\n"내일 시간 괜찮으시면 같이 산책해요!"\n\n채팅방에서 자세한 내용을 확인해보세요.',
  },
  {
    id: '3',
    isRead: true,
    type: 'quote',
    title: '💰 참여 신청 2개 추가!',
    message: '요청하신 모임에 총 3개의 참여 신청이 도착했어요. 확인해보세요',
    timestamp: '3시간 전',
    category: 'quote',
    link: '/meetup/1',
    details: '회원님의 모임에 2개의 참여 신청이 추가로 도착했습니다.\n\n총 신청: 3명\n모임: 한강 산책\n일시: 내일 오후 2시\n\n가장 적합한 분들을 선택해주세요!',
  },
  {
    id: '4',
    isRead: true,
    type: 'status',
    title: '✅ 모임 완료',
    message: '한강 산책 모임이 성공적으로 완료되었어요!',
    timestamp: '어제',
    link: '/meetup/3',
    details: '한강 산책 모임이 성공적으로 완료되었습니다!\n\n모임 내용: 한강 산책\n완료 시간: 2024년 2월 21일 오후 3시\n만남 장소: 서울 강남구 한강공원\n\n함께한 댕친들에게 리뷰를 남겨주세요!',
  },
  {
    id: '5',
    isRead: true,
    type: 'review',
    title: '⭐ 리뷰를 남겨주세요',
    message: '완료된 모임에 대한 후기를 남겨주시면 다른 분들께 큰 도움이 돼요',
    timestamp: '2일 전',
    details: '완료된 모임은 어떠셨나요?\n\n다른 분들을 위해 솔직한 리뷰를 남겨주세요!\n\n• 모임 분위기는 어떠셨나요?\n• 댕집사님은 친절하셨나요?\n• 다시 참여하실 의향이 있으신가요?\n\n여러분의 소중한 의견이 커뮤니티를 더 좋게 만듭니다.',
  },
  {
    id: '6',
    isRead: true,
    type: 'chat',
    title: '💬 새로운 메시지',
    message: '골든러버: 사진 몇 장만 더 보내주실 수 있나요?',
    timestamp: '3일 전',
    category: 'chat',
    link: '/chat/4',
    details: '골든러버님으로부터 새로운 메시지가 도착했습니다.\n\n"사진 몇 장만 더 보내주실 수 있나요?"\n\n모임 확인을 위해 추가 사진이 필요하다고 합니다.',
  },
];

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
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
      await showDeviceNotification('댕댕마켓', '알림이 켜졌어요. 모임·채팅 소식을 이렇게 보내드릴게요 🐾', {
        tag: 'daeng-permission-on',
      });
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
    await showDeviceNotification('댕댕마켓 테스트', '새 모임 신청이 도착했어요! (테스트 알림)', {
      tag: `daeng-test-${Date.now()}`,
    });
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const openNotification = (n: Notification) => {
    pulseVibrate([60, 40, 60]);
    setSelectedNotification(n);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* 헤더 */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-10">
        <div className="px-4 h-14 flex items-center justify-between max-w-screen-md mx-auto">
          <div className="flex items-center gap-2">
            <Link to="/explore" className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors" aria-label="메인으로">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-lg font-extrabold text-slate-800">알림</h1>
            {unreadCount > 0 && (
              <span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs px-2.5 py-1 rounded-full font-black shadow-sm shadow-orange-500/20">
                {unreadCount}
              </span>
            )}
          </div>
          <button 
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="text-sm text-orange-600 font-bold hover:text-orange-700 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            모두 읽음
          </button>
        </div>
      </header>

      {/* 휴대폰 알림 · 진동 */}
      <div className="max-w-screen-md mx-auto px-4 pt-4">
        <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50/80 p-4 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Smartphone className="h-5 w-5 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-slate-900">휴대폰 알림 · 진동</p>
              <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-600">
                {!canUseNotifications()
                  ? '이 브라우저는 시스템 알림을 지원하지 않아요.'
                  : perm === 'granted'
                    ? '알림이 허용됐어요. 새 소식이 오면 팝업과 진동(지원 기기)으로 알려드려요.'
                    : perm === 'denied'
                      ? '알림이 차단돼 있어요. 브라우저 사이트 설정에서 알림을 켜 주세요.'
                      : '아래에서 허용하면 모임·채팅 알림이 폰에 뜨고, 진동도 함께 울려요.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleEnableNotify()}
              disabled={!canUseNotifications() || perm === 'granted'}
              className="inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white shadow-md transition-transform active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none"
            >
              <Bell className="h-4 w-4 shrink-0" />
              {perm === 'granted' ? '알림 허용됨' : '알림 허용하기'}
            </button>
            <button
              type="button"
              onClick={() => void handleTestNotify()}
              disabled={!canUseNotifications()}
              className="inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm font-extrabold text-orange-800 shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              <Zap className="h-4 w-4 shrink-0" />
              테스트 알림 + 진동
            </button>
          </div>
        </div>
      </div>

      {/* 알림 목록 */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-5">
            <span className="text-4xl">🔔</span>
          </div>
          <p className="text-slate-600 font-bold text-lg mb-2">아직 알림이 없어요</p>
          <p className="text-sm text-slate-400 font-medium text-center">
            모임이나 참여 신청이 도착하면 알려드릴게요
          </p>
        </div>
      ) : (
        <div className="max-w-screen-md mx-auto p-4 space-y-3">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => openNotification(notification)}
              className={`w-full rounded-3xl border transition-all active:scale-[0.98] ${
                !notification.isRead 
                  ? 'bg-orange-50/50 border-orange-100 hover:shadow-md hover:border-orange-200' 
                  : 'bg-white border-slate-100 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-4 p-4">
                {/* 아이콘 */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                    !notification.isRead 
                      ? 'bg-gradient-to-br from-orange-500 to-yellow-500' 
                      : 'bg-slate-200'
                  }`}
                >
                  <Bell
                    className={`w-5 h-5 ${
                      !notification.isRead ? 'text-white' : 'text-slate-500'
                    }`}
                  />
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0 py-1 text-left">
                  <h3
                    className={`font-extrabold text-sm mb-1 ${
                      !notification.isRead ? 'text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    {notification.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-600 mb-2 line-clamp-2 leading-relaxed">
                    {notification.message}
                  </p>
                  <span className="text-xs font-bold text-slate-400">
                    {notification.timestamp}
                  </span>
                </div>

                {/* 읽지 않음 표시 */}
                {!notification.isRead && (
                  <div className="w-2.5 h-2.5 bg-orange-500 rounded-full flex-shrink-0 mt-2 shadow-sm shadow-orange-500/30" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 알림 상세 모달 */}
      {selectedNotification && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-[2rem] w-full max-w-full animate-slideUp">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-800">알림 상세</h3>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 내용 */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="mb-4">
                <h4 className="text-xl font-extrabold text-slate-800 mb-2">
                  {selectedNotification.title}
                </h4>
                <p className="text-xs font-bold text-slate-400">
                  {selectedNotification.timestamp}
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 mb-6">
                <p className="text-sm font-medium text-slate-700 whitespace-pre-line leading-relaxed">
                  {selectedNotification.details || selectedNotification.message}
                </p>
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-3">
                {selectedNotification.link && (
                  <Link
                    to={selectedNotification.link}
                    className="block w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-4 rounded-2xl text-center font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
                  >
                    {selectedNotification.type === 'quote' && '신청 확인하기 💰'}
                    {selectedNotification.type === 'chat' && '채팅방 가기 💬'}
                    {selectedNotification.type === 'status' && '상세 보기 ✅'}
                    {selectedNotification.type === 'review' && '리뷰 작성하기 ⭐'}
                  </Link>
                )}
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="w-full bg-slate-100 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors active:scale-[0.98]"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}