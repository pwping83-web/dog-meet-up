import { Link, useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  MapPin, Users, Heart, ArrowRight, Star,
  Shield, MessageCircle, ChevronRight, Sparkles,
  User, Bell, Loader2,
  Menu, X, Settings, LogOut, CreditCard,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { mockRequests, mockQuotes } from '../data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { isAppAdmin } from '../../lib/appAdmin';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { meetupVisibleInPublicFeed } from '../utils/meetupPublicVisibility';
import { getMergedMeetups } from '../../lib/userMeetupsStore';
import type { User } from '@supabase/supabase-js';
import { ExploreVirtualTrainingAd } from '../components/ExploreVirtualTrainingAd';
import { meetupCoverImageUrl, sanitizeDogProfileForPublicDisplay, virtualDogPhotoForSeed } from '../data/virtualDogPhotos';

function shortProfileLabel(user: User): string {
  const m = user.user_metadata ?? {};
  for (const key of ['nickname', 'name', 'full_name'] as const) {
    const v = m[key];
    if (typeof v === 'string' && v.trim()) {
      const t = v.trim();
      return t.length > 8 ? `${t.slice(0, 8)}…` : t;
    }
  }
  const local = user.email?.split('@')[0]?.trim();
  if (local) return local.length > 10 ? `${local.slice(0, 10)}…` : local;
  return '내 정보';
}

// 댕친 프로필 데이터
const dogProfiles = [
  { name: '뽀삐', breed: '포메라니안', age: '2살', mbti: '활발한아이', img: virtualDogPhotoForSeed('landing-dog-ppobb') },
  { name: '초코', breed: '웰시코기', img: virtualDogPhotoForSeed('landing-dog-choco'), age: '3살', mbti: '사교적아이' },
  { name: '보리', breed: '골든리트리버', img: virtualDogPhotoForSeed('landing-dog-bori'), age: '5살', mbti: '듬직한아이' },
  { name: '콩이', breed: '비글', img: virtualDogPhotoForSeed('landing-dog-kong'), age: '1살', mbti: '호기심아이' },
];

// MBTI 타입 프리뷰
const mbtiTypes = [
  { type: '활발한아이', emoji: '🔥', color: 'from-red-400 to-orange-400', desc: '에너지 폭발! 달리기 러버' },
  { type: '소심한아이', emoji: '🥺', color: 'from-amber-400 to-orange-400', desc: '조용한 산책을 좋아해요' },
  { type: '사교적아이', emoji: '🥳', color: 'from-yellow-400 to-amber-400', desc: '댕친 만드는게 취미!' },
  { type: '듬직한아이', emoji: '🛡️', color: 'from-orange-400 to-amber-500', desc: '든든한 동네 형/누나' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export function LandingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [exploreMenuOpen, setExploreMenuOpen] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [hoveredDog, setHoveredDog] = useState<number | null>(null);
  const [dbDogs, setDbDogs] = useState<any[]>([]);
  const [dogsLoading, setDogsLoading] = useState(true);

  // Supabase에서 등록된 댕댕이 불러오기
  useEffect(() => {
    const fetchDogs = async () => {
      try {
        setDogsLoading(true);
        const { data, error } = await supabase
          .from('dog_profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        setDbDogs(data || []);
      } catch (err) {
        console.error('강아지 정보를 불러오는데 실패했습니다:', err);
      } finally {
        setDogsLoading(false);
      }
    };
    fetchDogs();
  }, []);

  const [meetupFeedTick, setMeetupFeedTick] = useState(0);
  useEffect(() => {
    const onMeetups = () => setMeetupFeedTick((t) => t + 1);
    window.addEventListener('daeng-user-meetups-changed', onMeetups);
    return () => window.removeEventListener('daeng-user-meetups-changed', onMeetups);
  }, []);

  const mergedRequests = useMemo(
    () => getMergedMeetups(mockRequests),
    [location.key, location.pathname, meetupFeedTick],
  );

  const getQuoteCount = (id: string) => mockQuotes.filter((q) => q.meetupId === id).length;
  const meetupFeedItems = mergedRequests
    .filter((r) => r.category !== '돌봄' && meetupVisibleInPublicFeed(r))
    .slice(0, 6);
  const dolbomFeedItems = mergedRequests.filter((r) => r.category === '돌봄');

  const closeExploreMenu = () => setExploreMenuOpen(false);

  const handleExploreLogout = async () => {
    try {
      setLogoutBusy(true);
      await signOut();
      closeExploreMenu();
      navigate('/');
    } catch (e) {
      console.error(e);
      alert('로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLogoutBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh min-h-screen flex-col overflow-x-hidden bg-orange-50/30 pb-[5.5rem] md:pb-20">
      <LocationPickerModal open={locationPickerOpen} onClose={() => setLocationPickerOpen(false)} />

      <main className="flex w-full min-h-0 flex-1 flex-col">
      {/* ─── HERO SECTION ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 px-4 pt-5 pb-12 max-md:pb-14 md:pt-4 md:pb-10">
        {/* 배경 장식 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-yellow-300/20 rounded-full blur-2xl" />
          <span className="absolute top-6 right-4 text-5xl opacity-15 rotate-12 select-none">🐾</span>
          <span className="absolute bottom-8 left-6 text-4xl opacity-10 -rotate-12 select-none">🦴</span>
        </div>

        {/* 모바일: 제목 → 댕친 사진 → CTA(모임 만들기) / md↑: 제목 → CTA → 사진 */}
        <div className="relative z-10 flex flex-col md:min-h-0">
          {/* 헤더 */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex shrink-0 items-center justify-between pb-4 max-md:pb-5"
          >
            <div className="flex items-center gap-2 max-md:gap-2.5">
              <span className="text-2xl max-md:text-[1.75rem] md:text-xl" aria-hidden>🐕</span>
              <span className="text-xl max-md:text-[1.35rem] text-white/90 tracking-tight md:text-lg" style={{ fontWeight: 900 }}>댕댕마켓</span>
            </div>
            {authLoading ? (
              <span className="flex h-10 w-[4.5rem] max-md:h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 md:h-8 md:w-16 md:rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-white max-md:h-5 md:h-4 md:w-4" aria-hidden />
              </span>
            ) : user ? (
              <button
                type="button"
                onClick={() => setExploreMenuOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/40 bg-white/20 text-white backdrop-blur-md active:scale-95 transition-all md:h-9 md:w-9 md:rounded-xl"
                aria-label="메뉴·설정"
                aria-expanded={exploreMenuOpen}
              >
                <Menu className="h-6 w-6 md:h-5 md:w-5" strokeWidth={2.5} aria-hidden />
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-white/20 backdrop-blur-md text-white px-4 py-2.5 rounded-xl text-sm border border-white/30 active:scale-95 transition-all md:px-3 md:py-1.5 md:rounded-lg md:text-xs"
                style={{ fontWeight: 700 }}
              >
                로그인
              </Link>
            )}
          </motion.div>

          <div className="flex flex-col gap-6 pb-1 max-md:gap-7 md:gap-5">
            {/* 히어로 텍스트 — 모바일 당근형: 큰 제목·배지 */}
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span
                className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-3 py-2 rounded-full mb-4 border border-white/25 text-xs max-md:text-[13px] md:mb-3 md:px-2.5 md:py-1 md:text-[10px]"
                style={{ fontWeight: 800 }}
              >
                <Sparkles className="w-4 h-4 shrink-0 md:w-3 md:h-3" />
                강아지 MBTI 매칭 시스템
              </span>
              <h1
                className="text-white mb-3 leading-[1.12] tracking-tight text-[1.7rem] max-md:text-[1.95rem] max-md:mb-3.5 md:mb-2 md:text-2xl"
                style={{ fontWeight: 900 }}
              >
                우리 동네<br />
                <span className="text-yellow-200">댕친</span>을 찾아보세요
              </h1>
              <p
                className="text-orange-100/95 leading-relaxed text-sm max-md:text-[15px] max-md:leading-snug md:text-xs"
                style={{ fontWeight: 600 }}
              >
                성향이 맞는 댕댕이 친구를 찾고 있어요<br />
                산책·모임으로 사교성 넓혀줘요 🐾<br />
                친해진 댕친 집에 맡기고 오기도 해요
              </p>
            </motion.div>

            {/* 댕친 프로필 */}
            <motion.div
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
            >
              <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1 max-md:gap-3.5 md:gap-2">
                {dogProfiles.map((dog, i) => (
                  <motion.div
                    key={dog.name}
                    onHoverStart={() => setHoveredDog(i)}
                    onHoverEnd={() => setHoveredDog(null)}
                    whileTap={{ scale: 0.95 }}
                    className="min-w-[5.75rem] flex-shrink-0 rounded-2xl border border-white/70 bg-white/95 p-3 text-center shadow-lg shadow-orange-600/10 backdrop-blur-md max-md:min-w-[6.25rem] max-md:p-3.5 md:min-w-[72px] md:rounded-xl md:p-2"
                  >
                    <div className="mx-auto mb-2 h-[4.25rem] w-[4.25rem] overflow-hidden rounded-full bg-orange-100 ring-[3px] ring-white/90 max-md:h-[4.5rem] max-md:w-[4.5rem] md:mb-1.5 md:h-12 md:w-12 md:ring-2">
                      <ImageWithFallback
                        src={dog.img}
                        alt={dog.name}
                        className={`h-full w-full object-cover transition-transform duration-500 ${hoveredDog === i ? 'scale-110' : 'scale-100'}`}
                      />
                    </div>
                    <p className="truncate text-slate-800 text-xs max-md:text-[13px] md:text-[10px]" style={{ fontWeight: 900 }}>{dog.name}</p>
                    <p className="truncate text-slate-400 text-[10px] max-md:text-[11px] md:text-[8px]" style={{ fontWeight: 700 }}>{dog.breed}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="-mt-5 px-4 relative z-20 max-md:-mt-4">
        <div className="grid grid-cols-3 gap-2 rounded-3xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/50 max-md:gap-3 max-md:p-5 md:gap-3 md:rounded-2xl md:p-4">
          {[
            { num: '2,847', label: '등록 댕댕이', icon: '🐕' },
            { num: '1,230', label: '이번 달 만남', icon: '📅' },
            { num: '98%', label: '만족도', icon: '💛' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <span className="mb-1 block text-2xl max-md:text-[1.65rem] md:mb-0.5 md:text-lg">{stat.icon}</span>
              <p className="text-orange-600 text-base max-md:text-lg md:text-sm" style={{ fontWeight: 900 }}>{stat.num}</p>
              <p className="text-slate-400 text-[11px] max-md:text-xs md:text-[9px]" style={{ fontWeight: 700 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── REAL REGISTERED DOGS (Supabase) ─── */}
      {(!dogsLoading && dbDogs.length > 0) && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="px-4 mt-8"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-4 flex items-center justify-between max-md:mb-4 md:mb-3">
            <div>
              <h2 className="text-xl text-slate-900 max-md:text-[1.25rem] md:text-lg" style={{ fontWeight: 900 }}>
                새로운 댕친 <Heart className="inline h-5 w-5 fill-red-500 text-red-500 max-md:h-5 max-md:w-5 md:h-4 md:w-4" />
              </h2>
              <p className="mt-1 text-sm text-slate-400 max-md:text-[13px] md:mt-0.5 md:text-[11px]" style={{ fontWeight: 600 }}>최근 등록된 우리 동네 댕댕이</p>
            </div>
            <Link to="/search" className="flex items-center gap-1 text-sm text-orange-600 active:scale-95 transition-all max-md:text-sm md:text-xs" style={{ fontWeight: 800 }}>
              전체보기 <ArrowRight className="h-4 w-4 max-md:h-4 md:h-3.5 md:w-3.5" />
            </Link>
          </motion.div>

          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 no-scrollbar max-md:gap-3 md:gap-2.5">
            {dbDogs.map((dog, i) => {
              const d = sanitizeDogProfileForPublicDisplay({
                id: String(dog.id),
                name: typeof dog.name === 'string' ? dog.name : '',
                breed: dog.breed != null ? String(dog.breed) : null,
                age: typeof dog.age === 'number' && Number.isFinite(dog.age) ? dog.age : null,
                gender: dog.gender != null ? String(dog.gender) : null,
                photo_url: dog.photo_url != null ? String(dog.photo_url) : null,
              });
              return (
              <motion.div
                key={dog.id}
                variants={fadeUp}
                custom={i + 1}
                className="min-w-[7.25rem] flex-shrink-0 max-md:min-w-[7.5rem] md:min-w-[100px]"
              >
                <Link
                  to={`/dog/${dog.id}`}
                  className="block rounded-3xl border border-slate-100 bg-white p-4 text-center shadow-sm transition-transform active:scale-95 max-md:p-4 md:rounded-2xl md:p-3"
                >
                  <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-orange-100 shadow-inner max-md:h-[4.25rem] max-md:w-[4.25rem] md:mb-2 md:h-14 md:w-14 md:rounded-xl">
                    <ImageWithFallback
                      src={d.photoUrl}
                      fallbackSrc={virtualDogPhotoForSeed(`explore-db-dog-fallback-${dog.id}`)}
                      alt={d.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="truncate text-sm text-slate-800 max-md:text-[13px] md:text-[11px]" style={{ fontWeight: 900 }}>{d.name}</p>
                  <p className="truncate text-xs text-slate-400 max-md:text-[11px] md:text-[9px]" style={{ fontWeight: 600 }}>
                    {d.breed ?? ''}{d.age != null ? ` · ${d.age}살` : ''}
                  </p>
                </Link>
              </motion.div>
            );
            })}
          </div>
        </motion.section>
      )}

      {/* ─── HOW IT WORKS ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="mt-8 px-4 max-md:mt-10"
      >
        <motion.h2 variants={fadeUp} custom={0} className="mb-2 text-center text-xl text-slate-900 max-md:text-[1.35rem] md:mb-1.5 md:text-lg" style={{ fontWeight: 900 }}>
          이렇게 이용해요
        </motion.h2>
        <motion.p variants={fadeUp} custom={1} className="mb-6 text-center text-sm text-slate-400 max-md:mb-6 md:mb-5 md:text-xs" style={{ fontWeight: 600 }}>
          간단한 3단계로 시작하세요
        </motion.p>

        <div className="space-y-3 max-md:space-y-3.5">
          {[
            { step: '01', icon: <MapPin className="h-6 w-6 max-md:h-6 max-md:w-6 md:h-5 md:w-5" />, title: '위치 설정', desc: '하단 「위치」에서 동네를 맞추면 가까운 댕친·모임이 보여요', color: 'from-orange-500 to-amber-400' },
            { step: '02', icon: <Heart className="h-6 w-6 max-md:h-6 max-md:w-6 md:h-5 md:w-5" />, title: 'MBTI 매칭', desc: '강아지 성격 테스트로 잘 맞는 친구를 찾아요', color: 'from-orange-400 to-amber-500' },
            { step: '03', icon: <Users className="h-6 w-6 max-md:h-6 max-md:w-6 md:h-5 md:w-5" />, title: '만나 친해지기', desc: '모이자·만나자로 친해지면 출장·여행 때 서로 잠시 맡기기도 해요', color: 'from-orange-500 to-amber-400' },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              variants={fadeUp}
              custom={i + 2}
              className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm max-md:gap-4 max-md:p-5 md:gap-3 md:rounded-2xl md:p-4"
            >
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-md max-md:h-14 max-md:w-14 md:h-11 md:w-11 md:rounded-xl`}>
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2 md:mb-0.5">
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] text-orange-500 max-md:text-[11px] md:px-1.5 md:text-[9px]" style={{ fontWeight: 900 }}>STEP {item.step}</span>
                </div>
                <h3 className="mb-1 text-base text-slate-800 max-md:text-base md:mb-0.5 md:text-sm" style={{ fontWeight: 900 }}>{item.title}</h3>
                <p className="text-sm text-slate-400 max-md:leading-snug md:text-[11px]" style={{ fontWeight: 600 }}>{item.desc}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 max-md:h-5 max-md:w-5 md:h-4 md:w-4" />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ─── DOG MBTI PREVIEW ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="px-4 mt-10"
      >
        <motion.div variants={fadeUp} custom={0} className="mb-5 flex items-center justify-between max-md:mb-5 md:mb-4">
          <div>
            <h2 className="text-xl text-slate-900 max-md:text-[1.25rem] md:text-lg" style={{ fontWeight: 900 }}>강아지 MBTI</h2>
            <p className="mt-1 text-sm text-slate-400 max-md:text-[13px] md:mt-0.5 md:text-[11px]" style={{ fontWeight: 600 }}>성격에 맞는 댕친을 찾아요</p>
          </div>
          <Link to="/dog-mbti-test" className="flex items-center gap-1 text-sm text-orange-600 active:scale-95 transition-all max-md:text-sm md:text-xs" style={{ fontWeight: 800 }}>
            테스트하기 <ArrowRight className="h-4 w-4 max-md:h-4 md:h-3.5 md:w-3.5" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 max-md:gap-3 md:gap-2.5">
          {mbtiTypes.map((m, i) => (
            <motion.div
              key={m.type}
              variants={fadeUp}
              custom={i + 1}
            >
              <Link
                to="/dog-mbti-test"
                className="block rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.97] max-md:p-4 md:rounded-2xl md:p-3.5"
              >
                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${m.color} text-2xl shadow-md max-md:mb-3 max-md:h-12 max-md:w-12 max-md:text-[1.35rem] md:mb-2.5 md:h-10 md:w-10 md:rounded-xl md:text-xl`}>
                  {m.emoji}
                </div>
                <h4 className="mb-1 text-sm text-slate-800 max-md:text-sm md:mb-0.5 md:text-xs" style={{ fontWeight: 900 }}>{m.type}</h4>
                <p className="text-xs text-slate-400 max-md:leading-snug md:text-[10px]" style={{ fontWeight: 600 }}>{m.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ─── NEARBY MEETUPS ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="px-4 mt-10"
      >
        <motion.div variants={fadeUp} custom={0} className="mb-5 flex items-center justify-between max-md:mb-5 md:mb-4">
          <div>
            <h2 className="text-xl text-slate-900 max-md:text-[1.25rem] md:text-lg" style={{ fontWeight: 900 }}>
              🙌 모이자 · 만나자
            </h2>
            <p className="mt-1 text-sm text-slate-400 max-md:text-[13px] md:mt-0.5 md:text-[11px]" style={{ fontWeight: 600 }}>
              모이자는 공원·모임, 만나자는 1:1·교배·실종 글이에요
            </p>
          </div>
          <Link to="/sitters" className="flex items-center gap-1 text-sm text-orange-600 active:scale-95 transition-all max-md:text-sm md:text-xs" style={{ fontWeight: 800 }}>
            전체보기 <ArrowRight className="h-4 w-4 max-md:h-4 md:h-3.5 md:w-3.5" />
          </Link>
        </motion.div>

        <div className="space-y-3 max-md:space-y-3 md:space-y-2.5">
          {meetupFeedItems.map((req, i) => {
            const quoteCount = getQuoteCount(req.id);
            return (
              <motion.div key={req.id} variants={fadeUp} custom={i + 1}>
                <Link
                  to={`/meetup/${req.id}`}
                  className="flex gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-orange-100 hover:shadow-md active:scale-[0.98] max-md:gap-4 max-md:p-4 md:gap-3 md:rounded-2xl md:p-3"
                >
                  {/* 썸네일 */}
                  <div className="h-[4.5rem] w-[4.5rem] flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-yellow-50 max-md:h-[4.5rem] max-md:w-[4.5rem] md:h-16 md:w-16 md:rounded-xl">
                    <ImageWithFallback
                      src={meetupCoverImageUrl(req)}
                      fallbackSrc={virtualDogPhotoForSeed(`explore-moija-thumb-fallback-${req.id}`)}
                      alt={req.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {/* 내용 */}
                  <div className="min-w-0 flex-1 py-0.5">
                    <h3 className="mb-1 line-clamp-1 text-base text-slate-800 max-md:text-[15px] md:mb-0.5 md:text-xs" style={{ fontWeight: 800 }}>
                      {req.title}
                    </h3>
                    <p className="mb-2 text-sm text-slate-400 max-md:text-[13px] md:mb-1.5 md:text-[11px]" style={{ fontWeight: 600 }}>
                      {req.district} · {formatDistanceToNow(new Date(req.createdAt), { locale: ko })} 전
                    </p>
                    <div className="flex items-center gap-3">
                      {req.estimatedCost && (
                        <span className="text-base text-orange-600 max-md:text-[15px] md:text-xs" style={{ fontWeight: 900 }}>{req.estimatedCost}</span>
                      )}
                      {quoteCount > 0 && (
                        <span className="flex items-center gap-1 text-sm text-slate-400 max-md:text-xs md:text-[11px]" style={{ fontWeight: 700 }}>
                          <MessageCircle className="w-3 h-3" /> {quoteCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ─── 돌봄 · 맡기기 (모이자·만나자와 분리) — 상단에 가상 광고(작게) ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="px-4 mt-10"
      >
        <motion.div variants={fadeUp} custom={0} className="mb-2 max-md:mb-2.5">
          <ExploreVirtualTrainingAd variant="compact" />
        </motion.div>

        <motion.div variants={fadeUp} custom={1} className="mb-5 flex items-center justify-between max-md:mb-5 md:mb-4">
          <div>
            <h2 className="text-xl text-slate-900 max-md:text-[1.25rem] md:text-lg" style={{ fontWeight: 900 }}>
              🍼 돌봄 · 맡기기
            </h2>
            <p className="mt-1 text-sm text-slate-400 max-md:text-[13px] md:mt-0.5 md:text-[11px]" style={{ fontWeight: 600 }}>
              맡기기(돌봄 집)·방문 돌봄(주인 집) 등이 필요할 때 올리는 글이에요
            </p>
          </div>
          <Link
            to="/sitters?view=care&care=need"
            className="flex shrink-0 items-center gap-1 text-sm text-orange-600 active:scale-95 transition-all max-md:text-sm md:text-xs"
            style={{ fontWeight: 800 }}
          >
            전체보기 <ArrowRight className="h-4 w-4 max-md:h-4 md:h-3.5 md:w-3.5" />
          </Link>
        </motion.div>

        {dolbomFeedItems.length > 0 ? (
          <div className="space-y-3 max-md:space-y-3 md:space-y-2.5">
            {dolbomFeedItems.map((req, i) => {
              const quoteCount = getQuoteCount(req.id);
              return (
                <motion.div key={req.id} variants={fadeUp} custom={i + 2}>
                  <Link
                    to={`/meetup/${req.id}`}
                    className="flex gap-4 rounded-3xl border border-amber-100/90 bg-gradient-to-br from-amber-50/80 to-white p-4 shadow-sm transition-all hover:border-amber-200 hover:shadow-md active:scale-[0.98] max-md:gap-4 max-md:p-4 md:gap-3 md:rounded-2xl md:p-3"
                  >
                    <div className="flex h-[4.5rem] w-[4.5rem] flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 max-md:h-[4.5rem] max-md:w-[4.5rem] md:h-16 md:w-16 md:rounded-xl">
                      <ImageWithFallback
                        src={meetupCoverImageUrl(req)}
                        fallbackSrc={virtualDogPhotoForSeed(`explore-dolbom-thumb-fallback-${req.id}`)}
                        alt={req.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 py-0.5">
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] text-orange-700 max-md:text-[11px] md:text-[9px]"
                          style={{ fontWeight: 800 }}
                        >
                          돌봄
                        </span>
                        <h3
                          className="line-clamp-1 min-w-0 flex-1 text-base text-slate-800 max-md:text-[15px] md:mb-0 md:text-xs"
                          style={{ fontWeight: 800 }}
                        >
                          {req.title}
                        </h3>
                      </div>
                      <p className="mb-2 text-sm text-slate-400 max-md:text-[13px] md:mb-1.5 md:text-[11px]" style={{ fontWeight: 600 }}>
                        {req.district} · {formatDistanceToNow(new Date(req.createdAt), { locale: ko })} 전
                      </p>
                      <div className="flex items-center gap-3">
                        {req.estimatedCost && (
                          <span className="text-base text-orange-600 max-md:text-[15px] md:text-xs" style={{ fontWeight: 900 }}>
                            {req.estimatedCost}
                          </span>
                        )}
                        {quoteCount > 0 && (
                          <span className="flex items-center gap-1 text-sm text-slate-400 max-md:text-xs md:text-[11px]" style={{ fontWeight: 700 }}>
                            <MessageCircle className="h-3 w-3" /> {quoteCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.p
            variants={fadeUp}
            custom={2}
            className="rounded-2xl border border-dashed border-amber-200/80 bg-amber-50/40 py-4 text-center text-sm font-medium text-slate-500"
          >
            아직 돌봄·맡기기 글이 없어요.{' '}
            <Link to="/create-meetup?kind=dolbom" className="font-extrabold text-orange-600 underline underline-offset-2">
              글 올리기
            </Link>
          </motion.p>
        )}
      </motion.section>

      {/* ─── HERO IMAGE SECTION ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="px-4 mt-10"
      >
        <motion.div
          variants={fadeUp}
          custom={0}
          className="relative rounded-2xl overflow-hidden shadow-xl"
        >
          <ImageWithFallback
            src={virtualDogPhotoForSeed('landing-hero-banner')}
            alt="댕댕이 모임"
            className="w-full h-40 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-white/80 text-[9px] mb-0.5" style={{ fontWeight: 800 }}>이번 주 인기 모임</p>
            <h3 className="text-white text-sm mb-1.5" style={{ fontWeight: 900 }}>한강공원 대형견 산책 모임</h3>
            <div className="flex items-center gap-2.5 text-white/70 text-[11px]" style={{ fontWeight: 700 }}>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 12명 참여</span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> 4.9</span>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ─── TRUST & SAFETY ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="px-4 mt-10"
      >
        <motion.h2 variants={fadeUp} custom={0} className="text-lg text-slate-900 mb-4 text-center" style={{ fontWeight: 900 }}>
          안심하고 이용하세요
        </motion.h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: <Shield className="w-5 h-5" />, title: '동네 인증', desc: 'GPS 기반\n우리 동네만' },
            { icon: <Star className="w-5 h-5" />, title: '리뷰 시스템', desc: '솔직한 후기\n투명한 평가' },
            { icon: <MessageCircle className="w-5 h-5" />, title: '안전 채팅', desc: '1:1 채팅으로\n미리 소통' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              custom={i + 1}
              className="bg-white rounded-2xl p-3 text-center border border-slate-100 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 mx-auto mb-2">
                {item.icon}
              </div>
              <h4 className="text-slate-800 text-[11px] mb-0.5" style={{ fontWeight: 900 }}>{item.title}</h4>
              <p className="text-slate-400 text-[9px] whitespace-pre-line leading-relaxed" style={{ fontWeight: 600 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ─── FINAL CTA (비로그인만) ─── */}
      {!authLoading && !user && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="px-4 mt-10"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 rounded-2xl p-6 text-center relative overflow-hidden shadow-xl shadow-orange-200/50"
          >
            <div className="absolute inset-0 pointer-events-none">
              <span className="absolute -top-4 -left-4 text-6xl opacity-10 rotate-12 select-none">🐾</span>
              <span className="absolute -bottom-3 -right-3 text-5xl opacity-10 -rotate-12 select-none">🦴</span>
            </div>
            <div className="relative z-10">
              <span className="text-4xl mb-3 block">🐕</span>
              <h2 className="text-white text-xl mb-2 tracking-tight" style={{ fontWeight: 900 }}>
                지금 바로 시작해요!
              </h2>
              <p className="text-orange-100/90 text-xs mb-4 leading-relaxed" style={{ fontWeight: 600 }}>
                우리 동네 댕친들이 기다리고 있어요.
                <br />
                여행·출장으로 떠날 땐, 믿을 댕친 집에 맡기며 서로 도와줄 수 있어요
              </p>
              <Link
                to="/signup"
                className="inline-block bg-white text-orange-600 px-8 py-3 rounded-xl text-sm shadow-xl active:scale-[0.97] transition-all"
                style={{ fontWeight: 900 }}
              >
                무료로 가입하기 →
              </Link>
              <p className="text-orange-100/60 text-[11px] mt-3" style={{ fontWeight: 600 }}>
                이미 계정이 있나요?{' '}
                <Link to="/login" className="text-white underline underline-offset-2" style={{ fontWeight: 800 }}>
                  로그인
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.section>
      )}
      </main>

      {/* ─── FOOTER (콘텐츠가 짧을 때 화면 하단·탭바 위에 붙음) ─── */}
      <footer className="mt-auto shrink-0 px-4 pt-8 pb-2 text-center">
        <div className="flex flex-col items-center justify-end gap-0.5">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl" aria-hidden>
              🐕
            </span>
            <span className="text-orange-500" style={{ fontWeight: 900 }}>
              댕댕마켓
            </span>
          </div>
          <p className="text-slate-400 text-xs" style={{ fontWeight: 600 }}>
            우리 동네 반려견 소셜 커뮤니티
          </p>
          <p className="text-slate-300 text-[10px] mt-1" style={{ fontWeight: 600 }}>
            © 2026 댕댕마켓. All rights reserved.
          </p>
        </div>
      </footer>

      {exploreMenuOpen && user && (
        <div className="fixed inset-0 z-[200] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="explore-menu-title">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={closeExploreMenu}
            aria-label="닫기"
          />
          <div className="relative flex h-full w-[min(100%,288px)] flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <div className="min-w-0">
                <p id="explore-menu-title" className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  설정
                </p>
                <p className="truncate text-sm font-extrabold text-slate-900">{shortProfileLabel(user)}</p>
              </div>
              <button
                type="button"
                onClick={closeExploreMenu}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="메뉴 닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
              <Link
                to="/my"
                onClick={closeExploreMenu}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 hover:bg-orange-50"
              >
                <User className="h-5 w-5 text-orange-500" />
                마이페이지
              </Link>
              <button
                type="button"
                onClick={() => {
                  closeExploreMenu();
                  setLocationPickerOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-bold text-slate-800 hover:bg-orange-50"
              >
                <MapPin className="h-5 w-5 text-orange-500" />
                위치·동네 설정
              </button>
              <Link
                to="/profile/edit"
                onClick={closeExploreMenu}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 hover:bg-orange-50"
              >
                <Settings className="h-5 w-5 text-slate-500" />
                프로필 · 계정 설정
              </Link>
              <Link
                to="/notifications"
                replace
                onClick={closeExploreMenu}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 hover:bg-orange-50"
              >
                <Bell className="h-5 w-5 text-slate-500" />
                알림 설정
              </Link>
              <Link
                to="/billing"
                onClick={closeExploreMenu}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 hover:bg-orange-50"
              >
                <CreditCard className="h-5 w-5 text-brand" />
                인증 돌봄 · 목록 노출
              </Link>
              <Link
                to="/customer-service"
                onClick={closeExploreMenu}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 hover:bg-orange-50"
              >
                <MessageCircle className="h-5 w-5 text-slate-500" />
                고객센터
              </Link>
              {isAppAdmin(user) && (
                <Link
                  to="/admin"
                  onClick={closeExploreMenu}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 hover:bg-orange-50"
                >
                  <Shield className="h-5 w-5 text-slate-500" />
                  관리자
                </Link>
              )}
            </nav>
            <div className="border-t border-slate-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                disabled={logoutBusy}
                onClick={() => void handleExploreLogout()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3.5 text-sm font-extrabold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <LogOut className="h-5 w-5" />
                {logoutBusy ? '로그아웃 중…' : '로그아웃'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Alias for new route structure
export { LandingPage as ExplorePage };