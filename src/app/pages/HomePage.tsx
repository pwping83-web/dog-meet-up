import { Link } from 'react-router';
import { motion } from 'motion/react';

// 떠다니는 이모지 데이터
const floatingEmojis = [
  { emoji: '🐕', x: '12%', y: '18%', size: 32, delay: 0, duration: 6 },
  { emoji: '🐾', x: '78%', y: '12%', size: 24, delay: 1.2, duration: 7 },
  { emoji: '🦴', x: '85%', y: '55%', size: 20, delay: 0.5, duration: 5.5 },
  { emoji: '🐶', x: '8%', y: '62%', size: 28, delay: 2, duration: 6.5 },
  { emoji: '💛', x: '70%', y: '75%', size: 18, delay: 0.8, duration: 5 },
  { emoji: '🐾', x: '25%', y: '80%', size: 22, delay: 1.5, duration: 7.5 },
  { emoji: '🐕', x: '55%', y: '22%', size: 20, delay: 2.5, duration: 6 },
  { emoji: '💛', x: '40%', y: '8%', size: 16, delay: 3, duration: 5.5 },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-orange-50 via-white to-amber-50/50">

      {/* ─── 배경 장식 ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* 부드러운 원형 그라디언트들 */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-yellow-200/25 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-100/20 rounded-full blur-3xl" />

        {/* 떠다니는 이모지들 */}
        {floatingEmojis.map((item, i) => (
          <motion.span
            key={i}
            className="absolute select-none"
            style={{ left: item.x, top: item.y, fontSize: item.size }}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: [0, 0.4, 0.4, 0],
              y: [20, -20, -40, -60],
            }}
            transition={{
              delay: item.delay,
              duration: item.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {item.emoji}
          </motion.span>
        ))}
      </div>

      {/* ─── 메인 콘텐츠 ─── */}
      <div className="relative z-10 flex flex-col items-center px-8 text-center">

        {/* 로고 아이콘 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          className="mb-6"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-[28px] flex items-center justify-center shadow-2xl shadow-orange-300/40">
            <span className="text-5xl">🐕</span>
          </div>
        </motion.div>

        {/* 오늘의 활동 배지 */}
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-600 text-[11px] px-3.5 py-1.5 rounded-full mb-5"
          style={{ fontFamily: "'Jua', sans-serif" }}
        >
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          오늘 237 친구들이 뛰어놀았어요!
        </motion.span>

        {/* 앱 이름 */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-4xl tracking-tight mb-3"
          style={{ fontFamily: "'Jua', sans-serif" }}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500">
            댕댕마켓
          </span>
        </motion.h1>

        {/* 한 줄 설명 */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="text-slate-500 text-base leading-relaxed mb-2"
          style={{ fontFamily: "'Jua', sans-serif" }}
        >
          우리 동네 반려견 친구 만들기
        </motion.p>

        {/* 부가 설명 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="text-slate-400 text-sm mb-14"
          style={{ fontFamily: "'Jua', sans-serif" }}
        >
          성격 맞는 댕친과 산책하고, 함께 놀아요
        </motion.p>

        {/* 입장하기 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <Link
            to="/explore"
            className="inline-block rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-14 py-4 text-base font-bold text-white shadow-xl shadow-orange-400/30 transition-transform active:scale-[0.96]"
            style={{ fontFamily: "'Jua', sans-serif" }}
          >
            입장하기
          </Link>
        </motion.div>
      </div>

      {/* ─── 하단 브랜딩 ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-0 right-0 text-center"
      >
        <p className="text-slate-300 text-[11px]" style={{ fontFamily: "'Jua', sans-serif" }}>
          &copy; 2026 댕댕마켓
        </p>
      </motion.div>
    </div>
  );
}