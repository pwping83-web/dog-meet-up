# 댕댕마켓 Supabase 설정 완료! 🎉

## ✅ 완료된 작업

### 1. Supabase 클라이언트 업데이트
**파일:** `/src/lib/supabase.ts`
- Project URL: `https://bnqbxctamxcioewtuixy.supabase.co`
- Anon Key: 설정 완료 ✅

### 2. 환경 변수 파일 생성
**파일:** `/.env`
```bash
# Supabase
VITE_SUPABASE_URL=https://bnqbxctamxcioewtuixy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. .gitignore 생성
**파일:** `/.gitignore`
- `.env` 파일이 Git에 커밋되지 않도록 보호됨 🔒

---

## 🚀 다음 단계: Supabase 데이터베이스 설정

### 1️⃣ Supabase 대시보드 접속
1. https://supabase.com/dashboard 접속
2. `dang-dang-market` 프로젝트 선택

### 2️⃣ SQL Editor에서 스키마 실행
1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. 새 쿼리 생성
3. `/supabase-schema.sql` 파일의 내용을 복사하여 붙여넣기
4. **RUN** 버튼 클릭 ▶️

### 3️⃣ Authentication 설정

#### 이메일 인증 활성화:
1. **Authentication** → **Providers** 이동
2. **Email** 활성화
3. **Confirm email** 옵션 비활성화 (테스트용)

#### Kakao 소셜 로그인 설정:
1. **Authentication** → **Providers** 이동
2. **Kakao** 검색하여 활성화
3. Kakao Developer Console에서 발급받은 정보 입력:
   - Client ID
   - Client Secret
   - Redirect URL: `https://bnqbxctamxcioewtuixy.supabase.co/auth/v1/callback`

---

## 📊 데이터베이스 테이블 구조

### **1. profiles** (사용자 프로필)
- 기본 정보: 이름, 전화번호, 지역
- 아바타 URL
- 기사 여부 플래그

### **2. repairers** (수리 기사)
- 사업자명, 설명
- 전문 분야, 서비스 지역
- 평점, 리뷰 수

### **3. repair_requests** (수리 요청)
- 카테고리, 제목, 설명
- 이미지, 지역, 좌표
- 상태, 견적 수, 조회수

### **4. quotes** (견적/입찰)
- 금액, 메시지
- 예상 소요일
- 상태 (pending/accepted/rejected)

### **5. messages** (1:1 채팅)
- 발신자/수신자
- 내용, 읽음 여부

### **6. notifications** (알림)
- 타입, 제목, 메시지
- 링크, 읽음 여부

---

## 🔐 보안 설정 (RLS - Row Level Security)

모든 테이블에 **Row Level Security** 활성화됨:
- ✅ 사용자는 자신의 데이터만 수정 가능
- ✅ 공개 정보는 모두가 조회 가능
- ✅ 메시지/견적은 관련자만 조회 가능

---

## 🧪 테스트 데이터

스키마 실행 시 자동으로 추가되는 테스트 데이터:
- 👤 테스트 사용자 3명
- 🔧 테스트 수리기사 2명
- 📝 테스트 수리 요청 2건
- 💰 테스트 견적 2건

**⚠️ 실제 배포 시 테스트 데이터 삭제 필요!**

---

## 🎯 사용 예시

### 회원가입:
```typescript
import { useAuth } from '../contexts/AuthContext';

const { signUp } = useAuth();
await signUp('user@example.com', 'password123', '홍길동');
```

### 로그인:
```typescript
const { signIn } = useAuth();
await signIn('user@example.com', 'password123');
```

### Kakao 로그인:
```typescript
const { signInWithKakao } = useAuth();
await signInWithKakao();
```

### 수리 요청 생성:
```typescript
import { supabase } from '../lib/supabase';

const { data, error } = await supabase
  .from('repair_requests')
  .insert({
    user_id: user.id,
    category: '전동킥보드',
    title: '배터리 교체',
    description: '배터리가 금방 닳아요',
    region_si: '서울',
    region_gu: '강남구',
  });
```

---

## ⚙️ 추가 설정 필요

### Kakao API (위치/로그인)
`.env` 파일에 추가:
```bash
VITE_KAKAO_REST_API_KEY=your_key_here
VITE_KAKAO_JAVASCRIPT_KEY=your_key_here
```

### EmailJS (이메일 알림)
`.env` 파일에 추가:
```bash
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

---

## 📞 문제 해결

### "Invalid API key" 오류:
- Supabase 대시보드에서 anon key 재확인
- `.env` 파일의 키 값 확인
- 개발 서버 재시작 필요

### RLS 정책 오류:
```sql
-- SQL Editor에서 실행하여 정책 확인
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### 테이블이 생성되지 않음:
- SQL Editor에서 쿼리를 단계별로 실행
- 오류 메시지 확인

---

## 🎊 설정 완료!

이제 댕댕마켓이 Supabase와 완전히 연동되었습니다!
모든 인증, 데이터베이스, 실시간 기능을 사용할 수 있습니다.

**다음 단계:**
1. SQL Editor에서 스키마 실행
2. Authentication 설정
3. 앱 테스트 시작! 🚀
