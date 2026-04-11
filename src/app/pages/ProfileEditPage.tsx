// 파일 경로: src/app/pages/ProfileEditPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Camera, MapPin, CheckCircle2, ShieldCheck, ChevronDown, Loader2 } from 'lucide-react';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { useUserLocation } from '../../contexts/UserLocationContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { displayNameFromUser } from '../../lib/ensurePublicProfile';

/** 숫자만 받아 010-0000-0000 형태로 (최대 11자리) */
function formatKoreanMobileDigits(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

function phoneDigitsOk(digits: string): boolean {
  if (digits.length === 0) return true;
  return digits.length >= 10 && digits.length <= 11;
}

export function ProfileEditPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { fullLabel, location: userLoc, locationBasedEnabled } = useUserLocation();
  const [profileMode, setProfileMode] = useState<'general' | 'repairer'>('general');
  const [locationOpen, setLocationOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saveBusy, setSaveBusy] = useState(false);

  const [formData, setFormData] = useState({
    nickname: '',
    phone: '',
    avatarTheme: 'default',
    specialty: '산책 · 방문 돌봄', // 돌봄회원 탭 (로컬만)
  });

  const loadProfile = useCallback(async () => {
    if (!user) {
      setFormData((prev) => ({
        ...prev,
        nickname: '',
        phone: '',
      }));
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    const { data, error } = await supabase.from('profiles').select('name, phone').eq('id', user.id).maybeSingle();
    if (error) {
      console.warn('[프로필 수정] profiles 조회:', error.message);
    }
    const nameFromProfile = data?.name?.trim();
    const phoneFromProfile = data?.phone?.trim() ?? '';
    setFormData((prev) => ({
      ...prev,
      nickname: (nameFromProfile || displayNameFromUser(user)).slice(0, 10),
      phone: phoneFromProfile ? formatKoreanMobileDigits(phoneFromProfile) : '',
    }));
    setProfileLoading(false);
  }, [user]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  /** 프로필 테마 — 댕댕마켓용 강아지 캐릭터 (이전 수리마켓 킥보드·드론·렌치 제거) */
  const themeAvatars = [
    { id: 'default', emoji: '👤', bg: 'bg-slate-100', border: 'border-slate-200' },
    { id: 'pup', emoji: '🐶', bg: 'bg-amber-100', border: 'border-amber-300' },
    { id: 'poodle', emoji: '🐩', bg: 'bg-orange-100', border: 'border-orange-300' },
    { id: 'retriever', emoji: '🦮', bg: 'bg-orange-100', border: 'border-orange-300' },
  ];

  const locationVerified = userLoc.source === 'gps' || userLoc.source === 'map';
  const hasRegion = Boolean(userLoc.city && userLoc.district);
  const phoneDigits = formData.phone.replace(/\D/g, '');
  const phoneOk = phoneDigitsOk(phoneDigits);

  // 프로필 완성도 (동네는 UserLocation과 동일 — 별도 시·구 폼 없음)
  const completionRate =
    formData.nickname && phoneOk && phoneDigits.length > 0 && hasRegion
      ? locationVerified
        ? 100
        : 80
      : formData.nickname && phoneOk && phoneDigits.length > 0
        ? 60
        : formData.nickname
          ? 45
          : 35;

  const handleSave = async () => {
    if (!user) {
      alert('로그인 후 저장할 수 있어요.');
      navigate('/login');
      return;
    }
    if (!formData.nickname.trim()) {
      alert('닉네임을 입력해 주세요.');
      return;
    }
    if (!phoneOk) {
      alert('전화번호는 10~11자리 숫자로 입력해 주세요. (예: 010-1234-5678)');
      return;
    }
    if (phoneDigits.length === 0) {
      alert('연락을 위해 전화번호를 입력해 주세요.');
      return;
    }

    setSaveBusy(true);
    try {
      const phoneOut = formatKoreanMobileDigits(phoneDigits);
      const { error } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          name: formData.nickname.trim().slice(0, 10),
          phone: phoneOut,
        },
        { onConflict: 'id' },
      );
      if (error) {
        alert(error.message || '저장에 실패했습니다.');
        return;
      }
      alert('프로필이 저장되었습니다! 💾');
      navigate('/my');
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <LocationPickerModal open={locationOpen} onClose={() => setLocationOpen(false)} />
      <header className="sticky top-0 z-50 bg-market-header shadow-market-lg">
        <div className="mx-auto flex h-14 max-w-screen-md items-center justify-between px-4">
          <button
            type="button"
            onClick={() => navigate('/explore')}
            className="-ml-2 rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
            aria-label="뒤로"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-extrabold text-white">프로필 수정</h1>
          <div className="w-8" aria-hidden />
        </div>
      </header>

      <div className="max-w-screen-md mx-auto p-4 space-y-4">
        {authLoading || profileLoading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" aria-label="불러오는 중" />
          </div>
        ) : (
          <>
        {!user ? (
          <div className="rounded-2xl border border-brand/25 bg-brand-soft px-4 py-3 text-sm font-medium text-slate-800">
            로그인하면 닉네임·전화번호를 저장할 수 있어요.
          </div>
        ) : null}

        {/* 일반회원 / 돌봄회원 탭 */}
        <div className="bg-slate-100 p-1 rounded-2xl flex relative mb-6">
          <button
            type="button"
            onClick={() => setProfileMode('general')}
            className={`z-10 flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${profileMode === 'general' ? 'text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            일반회원
          </button>
          <button 
            type="button"
            onClick={() => setProfileMode('repairer')}
            className={`z-10 flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${profileMode === 'repairer' ? 'text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            돌봄회원
          </button>
          {/* 토글 애니메이션 배경 */}
          <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl transition-transform duration-300 shadow-sm ${profileMode === 'repairer' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`} />
        </div>

        {/* 프로필 완성도 게이지 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-end mb-3">
            <div>
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                내 프로필 신뢰도 {completionRate === 100 && <ShieldCheck className="h-4 w-4 text-brand" aria-hidden />}
              </span>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {completionRate === 100
                  ? '완벽해요! 이웃들이 신뢰할 수 있어요.'
                  : hasRegion
                    ? '아래에서 지도·GPS로 위치를 맞추면 신뢰도가 올라가요.'
                    : '동네·위치를 맞추면 신뢰도가 올라가요.'}
              </p>
            </div>
            <span className="text-xl font-black text-brand">{completionRate}%</span>
          </div>
          <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${completionRate === 100 ? 'bg-gradient-to-r from-brand to-brand-bright' : 'bg-gradient-to-r from-brand-bright to-amber-300'}`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* 프로필 사진 & 테마 선택 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-extrabold text-slate-800 mb-4">프로필 이미지</h3>
          <div className="flex flex-col items-center">
            {/* 현재 아바타 뷰 */}
            <div className="relative mb-5 group cursor-pointer">
              <div className={`w-24 h-24 rounded-3xl border-4 ${themeAvatars.find(t => t.id === formData.avatarTheme)?.bg} ${themeAvatars.find(t => t.id === formData.avatarTheme)?.border} flex items-center justify-center text-4xl shadow-inner transition-colors`}>
                {themeAvatars.find(t => t.id === formData.avatarTheme)?.emoji}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-slate-800 text-white p-2 rounded-full shadow-lg border-2 border-white group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
            </div>

            {/* 테마 팔레트 */}
            <div className="flex gap-3 justify-center bg-slate-50 p-2.5 rounded-2xl">
              {themeAvatars.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setFormData({...formData, avatarTheme: theme.id})}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl transition-all ${theme.bg} ${formData.avatarTheme === theme.id ? 'scale-110 ring-2 ring-brand ring-offset-2' : 'opacity-70 hover:opacity-100'}`}
                >
                  {theme.emoji}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 font-bold mt-3 text-center px-2">
              사진을 올리거나, 댕댕이 캐릭터(품종 느낌)를 골라보세요
            </p>
          </div>
        </div>

        {/* 닉네임 수정 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <label className="flex justify-between text-sm font-extrabold text-slate-800 mb-2">
            닉네임
            <span className="text-xs text-slate-400 font-medium">{formData.nickname.length}/10자</span>
          </label>
          <input
            type="text"
            value={formData.nickname}
            maxLength={10}
            onChange={(e) => setFormData({...formData, nickname: e.target.value})}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-bold text-slate-800 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
          />
        </div>

        {/* 동네·위치 — 마이페이지와 같은 저장소(LocationPickerModal), 시·구 드롭다운 이중 노출 없음 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-extrabold text-slate-800">동네·위치</label>
            {locationVerified ? (
              <span className="flex items-center gap-1 rounded-lg border border-brand/20 bg-brand/10 px-2 py-1 text-[11px] font-extrabold text-brand">
                <CheckCircle2 className="w-3.5 h-3.5" /> 위치 맞춤
              </span>
            ) : (
              <span className="text-[11px] font-bold text-slate-400">지도·GPS는 아래에서</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mb-3">
            내댕댕 화면과 같은 설정이에요. 한 곳에서만 바꿔도 앱 전체에 반영돼요.
          </p>
          <button
            type="button"
            title={fullLabel}
            onClick={() => setLocationOpen(true)}
            className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-left transition-colors hover:bg-slate-100"
          >
            <MapPin className={`h-5 w-5 shrink-0 ${locationBasedEnabled ? 'text-brand' : 'text-slate-400'}`} />
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">{fullLabel}</span>
            <ChevronDown className="w-5 h-5 shrink-0 text-slate-400" />
          </button>
        </div>

        {/* 전화번호 — 카카오 등 OAuth는 전화를 넘기지 않는 경우가 많아 profiles.phone 에 직접 저장 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <label className="block text-sm font-extrabold text-slate-800 mb-2">전화번호</label>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="010-0000-0000"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: formatKoreanMobileDigits(e.target.value) })
            }
            disabled={!user}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-bold text-slate-800 transition-all placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:opacity-60"
          />
          <p className="mt-2 text-[11px] font-medium leading-relaxed text-slate-500">
            카카오 로그인만으로는 전화번호가 넘어오지 않을 수 있어요. 연락 가능한 번호를 직접 입력한 뒤 저장해 주세요.
          </p>
        </div>

        {/* 돌봄회원: 맡김 돌봄 안내 */}
        {profileMode === 'repairer' && (
          <div className="animate-fadeIn rounded-3xl border-2 border-brand/20 bg-brand-soft p-5">
            <h3 className="mb-2 text-sm font-extrabold text-slate-900">🐕 도와드릴 수 있는 돌봄</h3>
            <p className="mb-3 text-xs font-medium leading-relaxed text-slate-700">
              모임 글과는 달리, <strong className="font-bold text-slate-900">잠시 맡아 돌봐 주시는</strong> 활동이에요. 산책·집 방문·하루 맡기기 등 편하신 방식을 적어 주세요.
            </p>
            <input
              type="text"
              value={formData.specialty}
              onChange={(e) => setFormData({...formData, specialty: e.target.value})}
              placeholder="예: 주간 방문 돌봄, 산책 대행, 퍼피 케어"
              className="w-full rounded-2xl border border-brand/25 bg-white px-4 py-3.5 font-bold text-slate-800 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
          </div>
        )}

          </>
        )}
      </div>

      {/* 하단 고정 저장 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50 pb-safe max-w-[430px] mx-auto">
        <div className="max-w-screen-md mx-auto">
          <button 
            type="button"
            onClick={() => void handleSave()}
            disabled={saveBusy || authLoading || profileLoading}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-market-cta text-lg font-bold text-white shadow-market transition-all hover:opacity-[0.92] active:scale-[0.98] disabled:opacity-50"
          >
            {saveBusy ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : null}
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}