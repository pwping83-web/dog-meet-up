# 🔧 수리마켓 플랫폼 설정 가이드

## 📌 목차
1. [전화번호 인증 (SMS)](#1-전화번호-인증-sms)
2. [카카오 아이디 연동](#2-카카오-아이디-연동)
3. [현재 위치로 찾기](#3-현재-위치로-찾기)
4. [이메일 알림](#4-이메일-알림-emailjs)
5. [데이터베이스 (Supabase)](#5-데이터베이스-supabase)
6. [선택사항: 결제 시스템](#6-선택사항-결제-시스템)

---

## 1️⃣ 전화번호 인증 (SMS)

### 📱 **왜 필요한가요?**
- 회원가입 시 전화번호 본인인증
- 수리 요청/견적 알림 문자 발송
- 신뢰도 높은 거래 환경 조성

### 🎯 **추천 서비스 비교**

| 서비스 | 월 기본료 | SMS 단가 | 한국어 지원 | 추천도 |
|--------|----------|----------|------------|--------|
| **알리고** | 무료 | 8~15원 | ⭐⭐⭐ 최고 | ✅ 강력추천 |
| **쿨SMS** | 무료 | 9~13원 | ⭐⭐⭐ 최고 | ✅ 추천 |
| **솔라피 (SENS)** | 무료 | 10~20원 | ⭐⭐⭐ 최고 | ⭐ 좋음 |
| **Twilio** | $0 | 80~120원 | ⭐ 보통 | ❌ 비쌈 |

### 📝 **알리고(Aligo) 가입 및 설정 (추천)**

#### **1단계: 회원가입**
```
🔗 https://smartsms.aligo.in
```

1. **회원가입** 클릭
2. 사업자 또는 개인 선택
   - **개인**: 주민등록증 사본 필요
   - **사업자**: 사업자등록증 사본 필요
3. 회원정보 입력
   - 아이디, 비밀번호
   - 이름, 전화번호, 이메일
4. 이메일 인증 완료

#### **2단계: 발신번호 등록**
1. 로그인 → **발신번호 관리**
2. **발신번호 등록** 클릭
3. 본인 전화번호 입력 (예: 010-1234-5678)
4. **인증번호 발송** → SMS로 받은 번호 입력
5. 승인 완료 (약 1~2시간 소요)

#### **3단계: API 키 발급**
1. **API 관리** 메뉴
2. **API Key** 복사
   ```
   예시: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```
3. **사용자 ID** 확인 (로그인 아이디)

#### **4단계: 충전**
- 최소 충전: 10,000원
- 무통장 입금 또는 카드 결제
- **테스트**: 가입 시 5,000원 무료 크레딧 제공 ✅

#### **5단계: 환경변수 설정**
`.env` 파일에 추가:
```bash
VITE_ALIGO_API_KEY=your_api_key_here
VITE_ALIGO_USER_ID=your_user_id_here
VITE_ALIGO_SENDER=01012345678
```

#### **6단계: 코드 예시**
```typescript
// SMS 발송 함수
async function sendSMS(phone: string, message: string) {
  const formData = new FormData();
  formData.append('key', import.meta.env.VITE_ALIGO_API_KEY);
  formData.append('user_id', import.meta.env.VITE_ALIGO_USER_ID);
  formData.append('sender', import.meta.env.VITE_ALIGO_SENDER);
  formData.append('receiver', phone);
  formData.append('msg', message);
  
  const response = await fetch('https://apis.aligo.in/send/', {
    method: 'POST',
    body: formData,
  });
  
  const result = await response.json();
  return result.result_code === '1'; // 성공 시 1
}

// 인증번호 발송
const code = Math.floor(100000 + Math.random() * 900000); // 6자리
sendSMS('01012345678', `[수리마켓] 인증번호는 [${code}] 입니다.`);
```

---

## 2️⃣ 카카오 아이디 연동

### 🟡 **왜 필요한가요?**
- 간편 로그인 (회원가입 과정 단축)
- 카카오톡 알림톡 발송 가능
- 사용자 신뢰도 향상

### 📝 **Kakao Developers 가입 및 설정**

#### **1단계: 애플리케이션 생성**
```
🔗 https://developers.kakao.com
```

1. **카카오 계정으로 로그인**
2. 우측 상단 **내 애플리케이션** 클릭
3. **애플리케이션 추가하기**
   - 앱 이름: `수리마켓`
   - 사업자명: 개인 또는 회사명

#### **2단계: 앱 키 확인**
애플리케이션 선택 → **앱 키** 탭

| 키 종류 | 용도 | 필요 여부 |
|---------|------|-----------|
| **REST API 키** | 서버에서 사용 | ✅ 필수 |
| **JavaScript 키** | 웹에서 사용 | ✅ 필수 |
| **Native App 키** | 앱에서 사용 | ❌ 불필요 |

복사할 키:
```
JavaScript 키: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
REST API 키: b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7
```

#### **3단계: 플랫폼 등록**
**앱 설정** → **플랫폼**

1. **Web 플랫폼 등록**
   - 사이트 도메인: `http://localhost:5173`
   - 배포 후: `https://yourdomain.com` 추가

#### **4단계: 카카오 로그인 활성화**
**제품 설정** → **카카오 로그인**

1. **활성화 설정** → ON
2. **Redirect URI 등록**
   - `http://localhost:5173/auth/kakao/callback`
   - `https://yourdomain.com/auth/kakao/callback`

#### **5단계: 동의항목 설정**
**제품 설정** → **카카오 로그인** → **동의항목**

| 항목 | 필수 여부 | 설명 |
|------|-----------|------|
| 닉네임 | 필수 선택 | 사용자 이름 |
| 프로필 사진 | 선택 | 프로필 이미지 |
| 카카오계정(이메일) | 필수 선택 | 이메일 주소 |
| 전화번호 | 선택 | 연락처 |

#### **6단계: 환경변수 설정**
`.env` 파일에 추가:
```bash
VITE_KAKAO_JAVASCRIPT_KEY=your_javascript_key_here
VITE_KAKAO_REST_API_KEY=your_rest_api_key_here
VITE_KAKAO_REDIRECT_URI=http://localhost:5173/auth/kakao/callback
```

#### **7단계: 코드 예시**
```typescript
// Kakao SDK 초기화 (App.tsx)
useEffect(() => {
  if (window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init(import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY);
  }
}, []);

// 카카오 로그인 버튼
const handleKakaoLogin = () => {
  window.Kakao.Auth.login({
    success: (authObj: any) => {
      console.log('로그인 성공:', authObj);
      
      // 사용자 정보 가져오기
      window.Kakao.API.request({
        url: '/v2/user/me',
        success: (res: any) => {
          console.log('사용자 정보:', res);
          const { id, kakao_account } = res;
          const email = kakao_account.email;
          const nickname = kakao_account.profile.nickname;
          
          // 서버에 저장 또는 로그인 처리
        },
        fail: (error: any) => {
          console.error('사용자 정보 가져오기 실패:', error);
        },
      });
    },
    fail: (error: any) => {
      console.error('로그인 실패:', error);
    },
  });
};
```

#### **8단계: Kakao SDK 추가**
`index.html`에 추가:
```html
<script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"></script>
```

---

## 3️⃣ 현재 위치로 찾기

### 📍 **왜 필요한가요?**
- 사용자 근처 수리 기사 자동 매칭
- "강남구", "서초구" 자동 선택
- 거리 기반 정렬

### 🗺️ **Kakao 로컬 API 사용**

#### **1단계: 이미 위에서 생성한 Kakao 앱 사용**
카카오 로그인과 **동일한 애플리케이션** 사용 가능!

#### **2단계: REST API 키 확인**
위의 "2️⃣ 카카오 아이디 연동" → **2단계**에서 복사한 REST API 키 사용

#### **3단계: 환경변수 (이미 설정됨)**
```bash
VITE_KAKAO_REST_API_KEY=your_rest_api_key_here
```

#### **4단계: 코드 예시**
```typescript
// 현재 위치 가져오기
const handleCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert('위치 서비스를 지원하지 않는 브라우저입니다.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      
      try {
        // Kakao API로 위도/경도 → 주소 변환
        const response = await fetch(
          `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${longitude}&y=${latitude}`,
          {
            headers: {
              Authorization: `KakaoAK ${import.meta.env.VITE_KAKAO_REST_API_KEY}`,
            },
          }
        );
        
        const data = await response.json();
        const region = data.documents[0];
        
        const city = region.region_1depth_name; // "서울특별시"
        const district = region.region_2depth_name; // "강남구"
        
        console.log('현재 위치:', city, district);
        
        // 상태 업데이트
        setSelectedCity(city.replace('특별시', '').replace('광역시', ''));
        setSelectedDistrict(district);
        
        alert(`현재 위치: ${city} ${district}로 설정되었습니다.`);
      } catch (error) {
        console.error('주소 변환 실패:', error);
        alert('위치 정보를 가져오는데 실패했습니다.');
      }
    },
    (error) => {
      console.error('위치 권한 거부:', error);
      alert('위치 권한을 허용해주세요.\n\n설정 > 개인정보 보호 > 위치 서비스');
    },
    {
      enableHighAccuracy: true, // 정확도 우선
      timeout: 5000,
      maximumAge: 0,
    }
  );
};
```

#### **5단계: 브라우저 권한 설정**
사용자가 "현재 위치로 찾기" 클릭 시:

1. **Chrome**: 주소창 왼쪽 🔒 아이콘 → 위치 → 허용
2. **Safari**: Safari → 설정 → 웹사이트 → 위치 → 허용
3. **모바일**: 설정 → 개인정보 보호 → 위치 서비스 → Safari/Chrome → 허용

---

## 4️⃣ 이메일 알림 (EmailJS)

### 📧 **왜 필요한가요?**
- 수리 요청 접수 알림
- 견적 도착 알림
- 거래 확정 알림

### ✅ **이미 구현 완료!**
현재 프로젝트에 이미 EmailJS가 설정되어 있습니다.

#### **확인 방법**
```typescript
// src/app/services/emailService.ts 파일 확인
- SERVICE_ID: 설정됨
- TEMPLATE_IDs: 7개 템플릿 구현됨
- PUBLIC_KEY: 발급됨
```

#### **사용 중인 템플릿**
1. **수리 요청 접수** (고객 → 고객)
2. **새로운 견적 도착** (기사 → 고객)
3. **견적 수락 알림** (고객 → 기사)
4. **수리 완료** (기사 → 고객)
5. **리뷰 작성 요청** (시스템 → 고객)
6. **새로운 수리 요청** (시스템 → 기사)
7. **결제 완료** (시스템 → 고객/기사)

#### **추가 설정이 필요한 경우**
```
🔗 https://www.emailjs.com
```

1. 회원가입 (Google 계정 연동 가능)
2. **Email Services** → Gmail 연동
3. **Email Templates** → 템플릿 생성
4. **Account** → Public Key 복사

`.env`:
```bash
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

---

## 5️⃣ 데이터베이스 (Supabase)

### 🗄️ **왜 필요한가요?**
- 사용자, 수리 요청, 견적 데이터 저장
- 실시간 알림 (New Quote, Status Update)
- 파일 업로드 (수리 사진)

### 📝 **Supabase 가입 및 설정**

#### **1단계: 프로젝트 생성**
```
🔗 https://supabase.com
```

1. **Start your project** → GitHub 계정 로그인
2. **New Project** 클릭
3. 프로젝트 정보 입력:
   - **Name**: `repair-market`
   - **Database Password**: 강력한 비밀번호 생성 (복사해두기!)
   - **Region**: `Northeast Asia (Seoul)` ✅ 한국 서버
   - **Pricing Plan**: Free (무료)

#### **2단계: API 키 확인**
**Settings** → **API**

| 키 종류 | 용도 |
|---------|------|
| **Project URL** | https://xxxxx.supabase.co |
| **anon public** | 클라이언트에서 사용 (공개 가능) |
| **service_role** | 서버에서 사용 (비밀!) |

#### **3단계: 테이블 생성**
**Table Editor** → **New Table**

##### **users 테이블**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  district TEXT,
  profile_image TEXT,
  user_type TEXT CHECK (user_type IN ('customer', 'repairer')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

##### **repair_requests 테이블**
```sql
CREATE TABLE repair_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  location TEXT,
  district TEXT,
  images TEXT[],
  estimated_cost TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

##### **quotes 테이블**
```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repair_request_id UUID REFERENCES repair_requests(id),
  repairer_id UUID REFERENCES users(id),
  estimated_cost TEXT NOT NULL,
  estimated_duration TEXT,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **4단계: Storage 설정 (이미지 업로드)**
**Storage** → **New Bucket**

1. **Bucket Name**: `repair-images`
2. **Public**: ✅ (체크) → 공개 이미지
3. **Allowed MIME types**: `image/*`

#### **5단계: Row Level Security (RLS) 설정**
**Authentication** → **Policies**

```sql
-- 모든 사용자가 수리 요청 조회 가능
CREATE POLICY "Public read access"
ON repair_requests FOR SELECT
USING (true);

-- 본인만 수리 요청 작성 가능
CREATE POLICY "Users can create own requests"
ON repair_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### **6단계: 환경변수 설정**
`.env`:
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

#### **7단계: Supabase 클라이언트 초기화**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

---

## 6️⃣ 선택사항: 결제 시스템

### 💳 **왜 필요한가요?**
- 견적 수락 후 선결제 (에스크로)
- 수리 완료 후 기사에게 자동 정산
- 플랫폼 수수료 (5~10%)

### 🏦 **추천 PG사 비교**

| PG사 | 수수료 | 정산 주기 | 사업자 필요 | 추천도 |
|------|--------|----------|-------------|--------|
| **토스페이먼츠** | 2.9~3.5% | D+1 | ✅ 필수 | ⭐⭐⭐ |
| **KG이니시스** | 3.0~3.8% | 주 1회 | ✅ 필수 | ⭐⭐ |
| **페이팔** | 3.6% + 고정수수료 | 즉시 | ❌ 불필요 | ⭐ (해외용) |
| **스트라이프** | 2.9% + 고정수수료 | 즉시 | ❌ 불필요 | ❌ (한국 미지원) |

### 📝 **토스페이먼츠 가입 (추천)**

#### **1단계: 사업자 등록**
```
🔗 https://www.tosspayments.com
```

**주의**: 개인 사업자 또는 법인 사업자 등록 필수!

1. **회원가입** → 사업자 정보 입력
2. **사업자등록증** 업로드
3. **정산 계좌** 등록

#### **2단계: 테스트 연동**
**개발자센터** → **API 키 발급**

| 환경 | 클라이언트 키 | 시크릿 키 |
|------|---------------|-----------|
| **테스트** | test_ck_xxx | test_sk_xxx |
| **운영** | live_ck_xxx | live_sk_xxx |

#### **3단계: 환경변수**
```bash
VITE_TOSS_CLIENT_KEY=test_ck_xxxxxxxxxxxxxxxx
VITE_TOSS_SECRET_KEY=test_sk_xxxxxxxxxxxxxxxx
```

#### **4단계: 간단 결제 예시**
```typescript
// 결제 요청
const requestPayment = () => {
  const tossPayments = TossPayments(import.meta.env.VITE_TOSS_CLIENT_KEY);
  
  tossPayments.requestPayment('카드', {
    amount: 150000, // 15만원
    orderId: 'ORDER_20260222_001',
    orderName: '전동킥보드 배터리 교체',
    successUrl: 'http://localhost:5173/payment/success',
    failUrl: 'http://localhost:5173/payment/fail',
  });
};
```

---

## 📋 최종 체크리스트

### ✅ **필수 가입 (무료)**
- [ ] **Kakao Developers** (로그인 + 위치)
  - JavaScript 키
  - REST API 키
- [ ] **Supabase** (데이터베이스)
  - Project URL
  - anon key
- [ ] **EmailJS** (이메일 알림)
  - Service ID
  - Public Key

### ⭐ **권장 가입**
- [ ] **알리고** (SMS 인증)
  - API Key
  - User ID
  - 발신번호

### 💰 **사업자 필요**
- [ ] **토스페이먼츠** (결제)
  - 사업자등록증 필수
  - Client Key
  - Secret Key

---

## 🔐 환경변수 전체 정리

프로젝트 루트에 `.env` 파일 생성:

```bash
# ===== 필수 =====

# Kakao (로그인 + 위치)
VITE_KAKAO_JAVASCRIPT_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
VITE_KAKAO_REST_API_KEY=b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7
VITE_KAKAO_REDIRECT_URI=http://localhost:5173/auth/kakao/callback

# Supabase (데이터베이스)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# EmailJS (이메일 알림)
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=your_public_key_xxxxxx

# ===== 권장 =====

# 알리고 (SMS 인증)
VITE_ALIGO_API_KEY=your_aligo_api_key
VITE_ALIGO_USER_ID=your_aligo_user_id
VITE_ALIGO_SENDER=01012345678

# ===== 선택 (사업자 필요) =====

# 토스페이먼츠 (결제)
VITE_TOSS_CLIENT_KEY=test_ck_xxxxxxxxxxxxxxxx
VITE_TOSS_SECRET_KEY=test_sk_xxxxxxxxxxxxxxxx
```

---

## 🚀 개발 순서 추천

### **Phase 1: 기본 기능 (무료)**
1. ✅ Kakao 로그인 연동
2. ✅ Kakao 위치 서비스
3. ✅ Supabase 데이터 저장
4. ✅ EmailJS 알림

**예상 비용**: 0원 (완전 무료)

### **Phase 2: 신뢰도 향상 (소액)**
5. SMS 인증 (알리고)

**예상 비용**: 월 1만원 ~ 5만원 (사용량 기준)

### **Phase 3: 수익화 (사업자 필요)**
6. 결제 시스템 (토스페이먼츠)

**예상 비용**: 거래액의 2.9~3.5% 수수료

---

## 💡 FAQ

### Q1. 사업자 등록 없이 시작 가능한가요?
**A**: 네! Phase 1~2까지는 개인으로 가능합니다.
- 결제 기능만 사업자 필요
- 테스트는 토스페이먼츠 샌드박스로 가능

### Q2. 모든 서비스를 다 가입해야 하나요?
**A**: 최소 구성:
- **필수**: Kakao, Supabase (완전 무료)
- **선택**: 이메일 알림, SMS 인증, 결제

### Q3. 무료 플랜으로 얼마나 버틸 수 있나요?
**A**:
- **Supabase**: 월 5GB 저장, 50,000 Row 무료
- **EmailJS**: 월 200건 무료
- **Kakao API**: 무제한 무료
- **예상**: 월 500명 사용자까지 무료 가능

### Q4. 실제 운영 시 월 비용은?
**A**:
- **SMS**: 1만~5만원 (인증 1,000건 기준)
- **Supabase**: 0~25달러 (Pro 플랜)
- **EmailJS**: 0~15달러 (Team 플랜)
- **서버**: 0원 (프론트엔드만 사용 시)
- **합계**: 월 5~10만원

---

## 📞 고객센터 정보

| 서비스 | 고객센터 | 응답 시간 |
|--------|----------|-----------|
| **Kakao** | https://devtalk.kakao.com | 1~2일 |
| **Supabase** | Discord 채널 | 즉시 (영어) |
| **알리고** | 1577-3894 | 평일 9-6시 |
| **토스페이먼츠** | 1544-7772 | 평일 9-6시 |

---

## 🎯 다음 단계

1. **위의 체크리스트 확인**하며 하나씩 가입
2. **환경변수 파일** 생성 (`.env`)
3. **테스트 코드** 작성하여 연동 확인
4. **Phase 1부터 단계별** 구현

---

**🔥 추가로 필요한 내용이 있으면 언제든 물어보세요!**
