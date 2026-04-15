/**
 * 앱 내부에서 바로 참조 가능한 비즈니스 메모 팩
 * - 특허/IP
 * - 지원사업 요약
 * - 다른 AI 인수인계 템플릿
 */

export const BUSINESS_MEMO_PACK = {
  title: '댕댕마켓 비즈니스 메모 팩',
  summary: [
    '지역 기반 반려견 커뮤니티·돌봄 연결 PWA',
    '핵심 스택: React(Vite) + Supabase(Auth/RLS/Edge) + Stripe',
    '초기 전략: 인증 돌봄/교배 노출 한시 무료, 이후 단계적 유료 전환',
  ],
  grantPitch: {
    oneLine:
      '지역 기반 반려견 커뮤니티와 돌봄 연결을 Supabase·Stripe 위에 구현한 모바일 웹(PWA) 서비스',
    threeLines: [
      '견주가 모이자·만나자·돌봄 맡기기 글을 올리고 이웃과 연결됩니다.',
      '운영 인증을 거친 보호맘/댕집사 중심으로 신뢰 가능한 돌봄 연결을 지향합니다.',
      '인증·노출·결제 정책을 DB(RLS)와 Edge Function으로 묶어 운영 안정성을 높입니다.',
    ],
    socialValue: [
      '1인 가구 등 돌봄 공백 완화로 파양 압력 감소에 기여',
      '운영 검증 + 접근제어(RLS) 기반 신뢰 네트워크',
      '지역 돌봄/훈련 인력의 신규 고객 접점 확대',
    ],
  },
  patentAndIp: {
    caution: '법률·변리 자문이 아닌 내부 검토용 요약. 출원 전 변리사 상담 필수.',
    keyPoints: [
      '소프트웨어 단독 아이디어보다 기술적 과제-해결-효과를 구체화해야 유리',
      '비즈니스 규칙/UI만으로는 특허성 판단이 불리할 수 있음',
      '상표·저작권·영업비밀 전략을 함께 설계하는 것이 실무적으로 중요',
    ],
    checklist: [
      '외부 이미지/폰트/라이브러리 라이선스 점검',
      '기여자 저작권 귀속/계약 정리',
      '출원 검토 기능에 대한 선행기술 조사 범위 정의',
    ],
  },
  aiHandoffTemplate: [
    '[프로젝트] 댕댕마켓 (Dog Meet-up)',
    '[스택] Vite + React + TypeScript + Supabase + Stripe + Edge Functions',
    '[증상]',
    '-',
    '[환경]',
    '- URL:',
    '- 브라우저:',
    '[재현]',
    '1.',
    '2.',
    '[기대 / 실제]',
    '-',
    '[이미 시도한 것]',
    '-',
  ].join('\n'),
  references: [
    'docs/project-pack/01-grant-support.md',
    'docs/project-pack/02-ai-handoff-troubleshooting.md',
    'docs/project-pack/06-patents-and-ip.md',
    'docs/지원사업용_프로젝트_요약서.md',
  ],
} as const;

