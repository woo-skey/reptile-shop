-- 매장 기본 정보 저장용 singleton 테이블
-- 홈 하단 "매장 정보" 섹션에 노출되며, 관리자 페이지에서 편집.

CREATE TABLE IF NOT EXISTS store_info (
  key text PRIMARY KEY DEFAULT 'main',
  address text,
  phone text,
  business_hours text,
  closed_days text,
  instagram_url text,
  kakao_url text,
  map_url text,
  extra_note text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 기본 row 보장 (key='main')
INSERT INTO store_info (key) VALUES ('main') ON CONFLICT (key) DO NOTHING;

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION touch_store_info_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS store_info_set_updated_at ON store_info;
CREATE TRIGGER store_info_set_updated_at
  BEFORE UPDATE ON store_info
  FOR EACH ROW
  EXECUTE FUNCTION touch_store_info_updated_at();

-- 퍼블릭 조회 허용
ALTER TABLE store_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read store_info" ON store_info;
CREATE POLICY "Public can read store_info"
  ON store_info
  FOR SELECT
  USING (true);
