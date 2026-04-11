import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  MapPin, Users, Heart, ArrowRight, Star,
  Shield, MessageCircle, ChevronRight, Sparkles,
  Home, PlusCircle, User, Search, Bell, Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { mockRequests, mockQuotes } from '../data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { supabase } from '../../lib/supabase';

// 댕친 프로필 데이터
const dogProfiles = [
  { name: '뽀삐', breed: '포메라니안', age: '2살', mbti: '활발한아이', img: 'https://images.unsplash.com/photo-1636890906264-135013858f6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFsbCUyMGRvZyUyMHBvbWVyYW5pYW4lMjBhZG9yYWJsZXxlbnwxfHx8fDE3NzE4NjA1ODB8MA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: '초코', breed: '웰시코기', img: 'https://images.unsplash.com/photo-1759914915081-b206224de813?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3JnaSUyMHB1cHB5JTIwY3V0ZSUyMG91dGRvb3J8ZW58MXx8fHwxNzcxODYwNTc5fDA&ixlib=rb-4.1.0&q=80&w=1080', age: '3살', mbti: '사교적아이' },
  { name: '보리', breed: '골든리트리버', img: 'https://images.unsplash.com/photo-1709497083259-2767f307aa55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWJyYWRvciUyMHJldHJpZXZlciUyMGZyaWVuZGx5JTIwc21pbGV8ZW58MXx8fHwxNzcxODYwNTgwfDA&ixlib=rb-4.1.0&q=80&w=1080', age: '5살', mbti: '듬직한아이' },
  { name: '콩이', breed: '비글', img: 'https://images.unsplash.com/photo-1677414129192-e82d85a882a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFnbGUlMjBkb2clMjBvdXRkb29yJTIwc3Vubnl8ZW58MXx8fHwxNzcxODYwNTgwfDA&ixlib=rb-4.1.0&q=80&w=1080', age: '1살', mbti: '호기심아이' },
];

// MBTI 타입 프리뷰
const mbtiTypes = [
  { type: '활발한아이', emoji: '🔥', color: 'from-red-400 to-orange-400', desc: '에너지 폭발! 달리기 러버' },
  { type: '소심한아이', emoji: '🥺', color: 'from-violet-400 to-purple-400', desc: '조용한 산책을 좋아해요' },
  { type: '사교적아이', emoji: '🥳', color: 'from-yellow-400 to-amber-400', desc: '댕친 만드는게 취미!' },
  { type: '듬직한아이', emoji: '🛡️', color: 'from-emerald-400 to-teal-400', desc: '든든한 동네 형/누나' },
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

  const getQuoteCount = (id: string) => mockQuotes.filter(q => q.repairRequestId === id).length;
  const recentMeetups = mockRequests.slice(0, 6);

  return (
    <div className="min-h-screen bg-orange-50/30 pb-20 overflow-x-hidden">

      {/* ─── HERO SECTION ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 pt-4 pb-10 px-4">
        {/* 배경 장식 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-yellow-300/20 rounded-full blur-2xl" />
          <span className="absolute top-6 right-4 text-5xl opacity-15 rotate-12 select-none">🐾</span>
          <span className="absolute bottom-8 left-6 text-4xl opacity-10 -rotate-12 select-none">🦴</span>
        </div>

        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xl">🐕</span>
            <span className="text-lg text-white/90 tracking-tight" style={{ fontWeight: 900 }}>댕댕마켓</span>
          </div>
          <Link
            to="/login"
            className="bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs border border-white/30 active:scale-95 transition-all"
            style={{ fontWeight: 700 }}
          >
            로그인
          </Link>
        </motion.div>

        {/* 히어로 텍스트 */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-full mb-3 border border-white/20" style={{ fontWeight: 800 }}>
              <Sparkles className="w-3 h-3" />
              강아지 MBTI 매칭 시스템
            </span>
            <h1 className="text-white text-2xl mb-2 leading-tight tracking-tight" style={{ fontWeight: 900 }}>
              우리 동네<br />
              <span className="text-yellow-200">댕친</span>을 찾아보세요
            </h1>
            <p className="text-orange-100/90 text-xs mb-5 leading-relaxed" style={{ fontWeight: 600 }}>
              성격이 맞는 댕댕이 친구를 찾고<br />
              산책·훈련 모임에 함께 참여해요 🐾
            </p>
          </motion.div>

          {/* CTA 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex gap-2.5"
          >
            <Link
              to="/signup"
              className="flex-1 bg-white text-orange-600 py-3 rounded-xl text-center text-sm shadow-xl shadow-orange-600/20 active:scale-[0.97] transition-all"
              style={{ fontWeight: 800 }}
            >
              시작하기
            </Link>
            <Link
              to="/sitters"
              className="flex-1 bg-white/15 backdrop-blur-md text-white py-3 rounded-xl text-center text-sm border border-white/25 active:scale-[0.97] transition-all"
              style={{ fontWeight: 800 }}
            >
              둘러보기
            </Link>
          </motion.div>
        </div>

        {/* 댕친 프로필 카드 가로 스크롤 */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative z-10 mt-5"
        >
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
            {dogProfiles.map((dog, i) => (
              <motion.div
                key={dog.name}
                onHoverStart={() => setHoveredDog(i)}
                onHoverEnd={() => setHoveredDog(null)}
                whileTap={{ scale: 0.95 }}
                className="min-w-[72px] bg-white/95 backdrop-blur-md rounded-xl p-2 shadow-lg shadow-orange-600/10 border border-white/60 flex-shrink-0 text-center"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden mx-auto mb-1.5 bg-orange-100 ring-2 ring-white/80">
                  <ImageWithFallback
                    src={dog.img}
                    alt={dog.name}
                    className={`w-full h-full object-cover transition-transform duration-500 ${hoveredDog === i ? 'scale-110' : 'scale-100'}`}
                  />
                </div>
                <p className="text-slate-800 text-[10px] truncate" style={{ fontWeight: 900 }}>{dog.name}</p>
                <p className="text-slate-400 text-[8px] truncate" style={{ fontWeight: 700 }}>{dog.breed}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── STATS BAR ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="-mt-5 px-4 relative z-20"
      >
        <motion.div
          variants={fadeUp}
          custom={0}
          className="bg-white rounded-2xl p-4 shadow-lg shadow-slate-200/50 border border-slate-100 grid grid-cols-3 gap-3"
        >
          {[
            { num: '2,847', label: '등록 댕댕이', icon: '🐕' },
            { num: '1,230', label: '이번달 모임', icon: '📅' },
            { num: '98%', label: '만족도', icon: '💛' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <span className="text-lg block mb-0.5">{stat.icon}</span>
              <p className="text-orange-600 text-sm" style={{ fontWeight: 900 }}>{stat.num}</p>
              <p className="text-slate-400 text-[9px]" style={{ fontWeight: 700 }}>{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.section>

      {/* ─── REAL REGISTERED DOGS (Supabase) ─── */}
      {(!dogsLoading && dbDogs.length > 0) && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="px-4 mt-8"
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg text-slate-900" style={{ fontWeight: 900 }}>
                새로운 댕친 <Heart className="w-4 h-4 fill-red-500 text-red-500 inline" />
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5" style={{ fontWeight: 600 }}>최근 등록된 우리 동네 댕댕이</p>
            </div>
            <Link to="/search" className="flex items-center gap-1 text-orange-600 text-xs active:scale-95 transition-all" style={{ fontWeight: 800 }}>
              전체보기 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
            {dbDogs.map((dog, i) => (
              <motion.div
                key={dog.id}
                variants={fadeUp}
                custom={i + 1}
                className="min-w-[100px] bg-white rounded-2xl p-3 border border-slate-100 shadow-sm text-center flex-shrink-0 active:scale-95 transition-transform"
              >
                <div className="w-14 h-14 rounded-xl mx-auto bg-orange-100 flex items-center justify-center text-3xl mb-2 shadow-inner overflow-hidden">
                  {dog.photo_url ? (
                    <ImageWithFallback src={dog.photo_url} alt={dog.name} className="w-full h-full object-cover" />
                  ) : (
                    '🐶'
                  )}
                </div>
                <p className="text-slate-800 text-[11px] truncate" style={{ fontWeight: 900 }}>{dog.name}</p>
                <p className="text-slate-400 text-[9px] truncate" style={{ fontWeight: 600 }}>
                  {dog.breed}{dog.age ? ` · ${dog.age}살` : ''}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ─── HOW IT WORKS ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="px-4 mt-8"
      >
        <motion.h2 variants={fadeUp} custom={0} className="text-lg text-slate-900 mb-1.5 text-center" style={{ fontWeight: 900 }}>
          이렇게 이용해요
        </motion.h2>
        <motion.p variants={fadeUp} custom={1} className="text-xs text-slate-400 text-center mb-5" style={{ fontWeight: 600 }}>
          간단한 3단계로 시작하세요
        </motion.p>

        <div className="space-y-3">
          {[
            { step: '01', icon: <MapPin className="w-5 h-5" />, title: '동네 설정', desc: '우리 동네를 선택하면 가까운 댕친들이 보여요', color: 'from-orange-500 to-amber-400' },
            { step: '02', icon: <Heart className="w-5 h-5" />, title: 'MBTI 매칭', desc: '강아지 성격 테스트로 잘 맞는 친구를 찾아요', color: 'from-pink-500 to-rose-400' },
            { step: '03', icon: <Users className="w-5 h-5" />, title: '모임 참여', desc: '산책, 훈련, 놀이 모임에 참여 신청해요', color: 'from-emerald-500 to-teal-400' },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              variants={fadeUp}
              custom={i + 2}
              className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] text-orange-500 px-1.5 py-0.5 bg-orange-50 rounded-full" style={{ fontWeight: 900 }}>STEP {item.step}</span>
                </div>
                <h3 className="text-slate-800 text-sm mb-0.5" style={{ fontWeight: 900 }}>{item.title}</h3>
                <p className="text-slate-400 text-[11px]" style={{ fontWeight: 600 }}>{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
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
        <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg text-slate-900" style={{ fontWeight: 900 }}>강아지 MBTI</h2>
            <p className="text-[11px] text-slate-400 mt-0.5" style={{ fontWeight: 600 }}>성격에 맞는 댕친을 찾아요</p>
          </div>
          <Link to="/dog-mbti-test" className="flex items-center gap-1 text-orange-600 text-xs active:scale-95 transition-all" style={{ fontWeight: 800 }}>
            테스트하기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 gap-2.5">
          {mbtiTypes.map((m, i) => (
            <motion.div
              key={m.type}
              variants={fadeUp}
              custom={i + 1}
            >
              <Link
                to="/dog-mbti-test"
                className="block bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md active:scale-[0.97] transition-all"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-xl mb-2.5 shadow-md`}>
                  {m.emoji}
                </div>
                <h4 className="text-slate-800 text-xs mb-0.5" style={{ fontWeight: 900 }}>{m.type}</h4>
                <p className="text-slate-400 text-[10px]" style={{ fontWeight: 600 }}>{m.desc}</p>
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
        <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg text-slate-900" style={{ fontWeight: 900 }}>🐾 동네 모임</h2>
            <p className="text-[11px] text-slate-400 mt-0.5" style={{ fontWeight: 600 }}>우리 동네에서 열리는 모임이에요</p>
          </div>
          <Link to="/sitters" className="flex items-center gap-1 text-orange-600 text-xs active:scale-95 transition-all" style={{ fontWeight: 800 }}>
            전체보기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        <div className="space-y-2.5">
          {recentMeetups.map((req, i) => {
            const quoteCount = getQuoteCount(req.id);
            return (
              <motion.div key={req.id} variants={fadeUp} custom={i + 1}>
                <Link
                  to={`/meetup/${req.id}`}
                  className="flex gap-3 bg-white rounded-2xl p-3 border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-100 active:scale-[0.98] transition-all"
                >
                  {/* 썸네일 */}
                  <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-orange-100 to-yellow-50">
                    {req.images && req.images.length > 0 ? (
                      <ImageWithFallback
                        src={req.images[0]}
                        alt={req.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {req.category === '산책' ? '🐕' : req.category === '훈련' ? '🎓' : '🐾'}
                      </div>
                    )}
                  </div>
                  {/* 내용 */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <h3 className="text-slate-800 text-xs mb-0.5 line-clamp-1" style={{ fontWeight: 800 }}>
                      {req.title}
                    </h3>
                    <p className="text-slate-400 text-[11px] mb-1.5" style={{ fontWeight: 600 }}>
                      {req.district} · {formatDistanceToNow(new Date(req.createdAt), { locale: ko })} 전
                    </p>
                    <div className="flex items-center gap-3">
                      {req.estimatedCost && (
                        <span className="text-orange-600 text-xs" style={{ fontWeight: 900 }}>{req.estimatedCost}</span>
                      )}
                      {quoteCount > 0 && (
                        <span className="flex items-center gap-1 text-slate-400 text-[11px]" style={{ fontWeight: 700 }}>
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
            src="https://images.unsplash.com/photo-1766114314882-89b64589f2c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2dzJTIwcGxheWluZyUyMHRvZ2V0aGVyJTIwcGFyayUyMGdyb3VwfGVufDF8fHx8MTc3MTg2MDU3OXww&ixlib=rb-4.1.0&q=80&w=1080"
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

      {/* ─── FINAL CTA ─── */}
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
            <p className="text-orange-100/90 text-xs mb-4" style={{ fontWeight: 600 }}>
              우리 동네 댕친들이 기다리고 있어요
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

      {/* ─── FOOTER ─── */}
      <footer className="px-4 mt-10 mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-xl">🐕</span>
          <span className="text-orange-500" style={{ fontWeight: 900 }}>댕댕마켓</span>
        </div>
        <p className="text-slate-400 text-xs" style={{ fontWeight: 600 }}>
          우리 동네 반려견 소셜 커뮤니티
        </p>
        <p className="text-slate-300 text-[10px] mt-2" style={{ fontWeight: 600 }}>
          © 2026 댕댕마켓. All rights reserved.
        </p>
      </footer>

      {/* ─── BOTTOM NAV ─── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-orange-50 z-50 pb-safe max-w-[430px] mx-auto">
        <div className="flex items-center justify-around h-14 px-2">
          <Link to="/" className="flex flex-col items-center gap-0.5 text-slate-400">
            <Home className="w-5 h-5" /><span className="text-[9px]" style={{ fontWeight: 800 }}>홈</span>
          </Link>
          <Link to="/sitters" className="flex flex-col items-center gap-0.5 text-slate-400">
            <MapPin className="w-5 h-5" /><span className="text-[9px]" style={{ fontWeight: 800 }}>동네번개</span>
          </Link>
          <Link to="/create-meetup" className="flex flex-col items-center -mt-5 group">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-400/40 group-active:scale-90 transition-all border-[3px] border-white">
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5" style={{ fontWeight: 800 }}>등록하기</span>
          </Link>
          <Link to="/chats" className="flex flex-col items-center gap-0.5 text-slate-400">
            <MessageCircle className="w-5 h-5" /><span className="text-[9px]" style={{ fontWeight: 800 }}>댕팅</span>
          </Link>
          <Link to="/my" className="flex flex-col items-center gap-0.5 text-slate-400">
            <User className="w-5 h-5" /><span className="text-[9px]" style={{ fontWeight: 800 }}>내댕댕</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

// Alias for new route structure
export { LandingPage as ExplorePage };