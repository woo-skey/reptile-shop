-- 홈 메인 배너 이미지를 관리자가 교체할 수 있도록 store_info에 hero_image_url 컬럼 추가.
-- 값이 비어있으면 기본 배너 이미지(/reptile_image.png)로 fallback.

ALTER TABLE store_info
  ADD COLUMN IF NOT EXISTS hero_image_url text;
