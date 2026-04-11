# 🚀 Supabase 설정 가이드

## 1️⃣ 데이터베이스 스키마 생성

1. Supabase Dashboard로 이동: https://supabase.com/dashboard/project/kqchqaqsbqdvchwxekfx

2. 좌측 메뉴에서 **SQL Editor** 클릭

3. **New Query** 버튼 클릭

4. 프로젝트 루트의 `supabase-schema.sql` 파일 내용을 복사해서 붙여넣기

5. **Run** 버튼 클릭하여 실행

✅ 완료되면 다음 테이블들이 생성됩니다:
- `profiles` - 사용자 프로필
- `repairers` - 수리기사 정보
- `repair_requests` - 수리 요청
- `quotes` - 견적/입찰
- `messages` - 채팅 메시지
- `notifications` - 알림

---

## 2️⃣ Authentication 설정

### 이메일 인증 비활성화 (개발용)

1. Supabase Dashboard → **Authentication** → **Providers**

2. **Email** 프로바이더 설정

3. **Confirm email** 토글을 **OFF**로 설정

4. **Save** 클릭

> ⚠️ 프로덕션 환경에서는 이메일 인증을 켜는 것을 권장합니다!

### 테스트 계정 생성 (선택)

SQL Editor에서 실행:

\`\`\`sql
-- 테스트 사용자 생성
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@repair.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"name": "테스트 사용자"}'::jsonb
);
\`\`\`

---

## 3️⃣ Storage 설정 (이미지 업로드용)

### Bucket 생성

1. Supabase Dashboard → **Storage**

2. **Create a new bucket** 클릭

3. Bucket 이름: `repair-images`

4. **Public bucket** 체크 (이미지를 공개로 설정)

5. **Create bucket** 클릭

### Storage Policy 설정

SQL Editor에서 실행:

\`\`\`sql
-- 누구나 이미지 조회 가능
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'repair-images');

-- 로그인한 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'repair-images' 
  AND auth.role() = 'authenticated'
);

-- 업로드한 사용자만 삭제 가능
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'repair-images' 
  AND auth.uid() = owner
);
\`\`\`

---

## 4️⃣ 데이터베이스 확인

1. Supabase Dashboard → **Table Editor**

2. 생성된 테이블 확인:
   - ✅ profiles
   - ✅ repairers
   - ✅ repair_requests
   - ✅ quotes
   - ✅ messages
   - ✅ notifications

3. 샘플 데이터가 자동으로 들어있는지 확인
   - 테스트 프로필 2개
   - 테스트 수리기사 2명
   - 테스트 수리 요청 2건
   - 테스트 견적 2개

---

## 5️⃣ 연결 테스트

앱을 실행하고 다음을 확인:

1. **회원가입** 페이지에서 새 계정 생성
2. **로그인** 성공 확인
3. **수리 요청 작성** 테스트
4. **견적 제출** 테스트 (수리기사로 등록 필요)

---

## 📋 주요 기능별 데이터베이스 쿼리 예시

### 수리 요청 목록 가져오기 (지역별)

\`\`\`typescript
const { data, error } = await supabase
  .from('repair_requests')
  .select('*, profiles(name, avatar_url)')
  .eq('region_si', '서울특별시')
  .eq('region_gu', '강남구')
  .eq('status', 'open')
  .order('created_at', { ascending: false });
\`\`\`

### 견적 제출하기

\`\`\`typescript
const { data, error } = await supabase
  .from('quotes')
  .insert({
    request_id: requestId,
    repairer_id: repairerId,
    amount: 150000,
    message: '정품 배터리로 교체해드립니다',
    estimated_days: 2
  });
\`\`\`

### 내 수리 요청 보기

\`\`\`typescript
const { data, error } = await supabase
  .from('repair_requests')
  .select('*, quotes(*, repairers(*, profiles(*)))')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
\`\`\`

### 채팅 메시지 가져오기

\`\`\`typescript
const { data, error } = await supabase
  .from('messages')
  .select('*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)')
  .or(\`sender_id.eq.\${userId},receiver_id.eq.\${userId}\`)
  .order('created_at', { ascending: true });
\`\`\`

---

## 🔒 보안 체크리스트

- ✅ Row Level Security (RLS) 활성화됨
- ✅ 사용자별 데이터 접근 제한
- ✅ 공개 키만 프론트엔드에 노출
- ⚠️ Service Role Key는 절대 프론트엔드에 사용 금지!

---

## 🐛 문제 해결

### "relation does not exist" 오류
→ `supabase-schema.sql` 파일을 SQL Editor에서 실행했는지 확인

### "JWT expired" 오류
→ 로그아웃 후 다시 로그인

### 이미지 업로드 실패
→ Storage bucket 생성 및 정책 설정 확인

### RLS 정책 오류
→ SQL Editor에서 정책이 제대로 생성되었는지 확인

---

## 📞 추가 지원

- Supabase 공식 문서: https://supabase.com/docs
- Discord 커뮤니티: https://discord.supabase.com

**설정 완료!** 🎉
