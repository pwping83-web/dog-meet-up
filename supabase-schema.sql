-- 수리마켓 데이터베이스 스키마
-- Supabase SQL Editor에서 이 쿼리를 실행하세요

-- 1. 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT,
  region_si TEXT,
  region_gu TEXT,
  avatar_url TEXT,
  is_repairer BOOLEAN DEFAULT FALSE
);

-- 2. 수리기사 테이블
CREATE TABLE IF NOT EXISTS repairers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  business_name TEXT NOT NULL,
  description TEXT,
  specialties TEXT[] DEFAULT '{}',
  service_regions_si TEXT[] DEFAULT '{}',
  service_regions_gu TEXT[] DEFAULT '{}',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  rating DECIMAL(3, 2) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE
);

-- 3. 수리 요청 테이블
CREATE TABLE IF NOT EXISTS repair_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  region_si TEXT NOT NULL,
  region_gu TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'in_progress', 'completed', 'cancelled')),
  quote_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0
);

-- 4. 견적/입찰 테이블
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES repair_requests(id) ON DELETE CASCADE,
  repairer_id UUID REFERENCES repairers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  amount INTEGER NOT NULL,
  message TEXT,
  estimated_days INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'))
);

-- 5. 메시지 테이블
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES repair_requests(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE
);

-- 6. 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('new_quote', 'quote_accepted', 'new_message', 'review', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_repair_requests_region ON repair_requests(region_si, region_gu);
CREATE INDEX IF NOT EXISTS idx_repair_requests_status ON repair_requests(status);
CREATE INDEX IF NOT EXISTS idx_repair_requests_created_at ON repair_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_request_id ON quotes(request_id);
CREATE INDEX IF NOT EXISTS idx_quotes_repairer_id ON quotes(repairer_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);

-- Row Level Security (RLS) 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairers ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 프로필
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS 정책: 수리기사
CREATE POLICY "Repairers are viewable by everyone"
  ON repairers FOR SELECT
  USING (true);

CREATE POLICY "Users can create own repairer profile"
  ON repairers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own repairer profile"
  ON repairers FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS 정책: 수리 요청
CREATE POLICY "Repair requests are viewable by everyone"
  ON repair_requests FOR SELECT
  USING (true);

CREATE POLICY "Users can create own repair requests"
  ON repair_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own repair requests"
  ON repair_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS 정책: 견적
CREATE POLICY "Quotes are viewable by request owner and repairer"
  ON quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM repair_requests 
      WHERE repair_requests.id = quotes.request_id 
      AND repair_requests.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM repairers 
      WHERE repairers.id = quotes.repairer_id 
      AND repairers.user_id = auth.uid()
    )
  );

CREATE POLICY "Repairers can create quotes"
  ON quotes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM repairers 
      WHERE repairers.id = quotes.repairer_id 
      AND repairers.user_id = auth.uid()
    )
  );

CREATE POLICY "Quote owners can update own quotes"
  ON quotes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM repairers 
      WHERE repairers.id = quotes.repairer_id 
      AND repairers.user_id = auth.uid()
    )
  );

-- RLS 정책: 메시지
CREATE POLICY "Messages are viewable by sender and receiver"
  ON messages FOR SELECT
  USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Message receivers can update read status"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- RLS 정책: 알림
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 트리거: 수리 요청에 견적이 추가될 때 quote_count 증가
CREATE OR REPLACE FUNCTION increment_quote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE repair_requests
  SET quote_count = quote_count + 1
  WHERE id = NEW.request_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_quote_created
  AFTER INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION increment_quote_count();

-- 트리거: 회원가입 시 자동으로 프로필 생성
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', '익명 사용자'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();

-- 샘플 데이터 (테스트용)
-- 실제 배포 시에는 제거하세요

-- 테스트 사용자 프로필
INSERT INTO profiles (id, name, region_si, region_gu, phone, is_repairer) VALUES
  ('00000000-0000-0000-0000-000000000001', '김철수', '서울특별시', '강남구', '010-1234-5678', false),
  ('00000000-0000-0000-0000-000000000002', '박영희', '서울특별시', '서초구', '010-2345-6789', true),
  ('00000000-0000-0000-0000-000000000003', '이민준', '경기도', '성남시', '010-3456-7890', true)
ON CONFLICT (id) DO NOTHING;

-- 테스트 수리기사
INSERT INTO repairers (id, user_id, business_name, description, specialties, service_regions_si, service_regions_gu, latitude, longitude, rating, review_count, verified) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000002', '박기사 수리샵', '10년 경력의 전동킥보드 전문 수리', ARRAY['전동킥보드', '전기자전거'], ARRAY['서울특별시'], ARRAY['강남구', '서초구', '송파구'], 37.4979, 127.0276, 4.8, 127, true),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000003', '이기사 드론센터', '드론/RC 전문 수리점', ARRAY['드론', 'RC카'], ARRAY['경기도'], ARRAY['성남시', '분당구'], 37.3595, 127.1052, 4.9, 85, true)
ON CONFLICT (id) DO NOTHING;

-- 테스트 수리 요청
INSERT INTO repair_requests (id, user_id, category, title, description, region_si, region_gu, latitude, longitude, status, quote_count, view_count) VALUES
  ('00000000-0000-0001-0000-000000000001', '00000000-0000-0000-0000-000000000001', '전동킥보드', '샤오미 킥보드 배터리 교체', '2년 사용한 샤오미 M365 Pro 킥보드인데 배터리가 금방 닳아요. 교체 비용이 얼마나 나올까요?', '서울특별시', '강남구', 37.4979, 127.0276, 'open', 3, 42),
  ('00000000-0000-0001-0000-000000000002', '00000000-0000-0000-0000-000000000001', '드론', 'DJI 미니3 프로 짐벌 고장', '추락 후 짐벌이 이상하게 움직여요', '서울특별시', '강남구', 37.4979, 127.0276, 'open', 1, 28)
ON CONFLICT (id) DO NOTHING;

-- 테스트 견적
INSERT INTO quotes (request_id, repairer_id, amount, message, estimated_days, status) VALUES
  ('00000000-0000-0001-0000-000000000001', '00000000-0000-0000-0001-000000000001', 150000, '정품 배터리로 교체해드립니다. 1년 보증 포함입니다.', 2, 'pending'),
  ('00000000-0000-0001-0000-000000000001', '00000000-0000-0000-0001-000000000002', 165000, '정품 + 무상 점검 서비스 포함', 1, 'pending')
ON CONFLICT (id) DO NOTHING;
