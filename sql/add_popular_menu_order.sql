-- 홈 "인기메뉴" 섹션에 노출할 메뉴를 관리자가 선택할 수 있도록 하는 컬럼 추가
-- popular_order: NULL 이면 인기메뉴 아님, 숫자이면 해당 순서로 홈에 노출 (오름차순, 앞에서 3개)

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS popular_order integer;

-- 인기메뉴만 걸러서 정렬할 때 쓰는 부분 인덱스
CREATE INDEX IF NOT EXISTS menu_items_popular_order_idx
  ON menu_items (popular_order)
  WHERE popular_order IS NOT NULL;
