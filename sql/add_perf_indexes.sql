-- 핫 쿼리 패턴과 RLS 정책 컬럼에 대한 인덱스 보강
-- 모두 IF NOT EXISTS라 여러 번 실행해도 안전

-- ============================================================
-- posts: 커뮤니티/공지 목록, 홈 최근글, 마이페이지, 프로필
-- ============================================================

-- 홈 + community/notice 목록 (type 필터 + 최신순)
CREATE INDEX IF NOT EXISTS posts_type_created_at_idx
  ON posts(type, created_at DESC);

-- admin/notices 목록 (is_pinned 우선 + 최신순)
CREATE INDEX IF NOT EXISTS posts_type_pinned_created_idx
  ON posts(type, is_pinned DESC, created_at DESC);

-- 마이페이지/프로필 (작성자별 + 최신순)
CREATE INDEX IF NOT EXISTS posts_author_created_idx
  ON posts(author_id, created_at DESC);

-- 프로필 페이지에서 type='community'만 보여주는 케이스
CREATE INDEX IF NOT EXISTS posts_author_type_created_idx
  ON posts(author_id, type, created_at DESC);

-- ============================================================
-- comments: 게시글 상세 페이지, 마이페이지, 프로필
-- ============================================================

-- 게시글 상세 (post_id 필터 + 시간순)
CREATE INDEX IF NOT EXISTS comments_post_created_idx
  ON comments(post_id, created_at);

-- 마이페이지/프로필 (작성자별 + 최신순)
CREATE INDEX IF NOT EXISTS comments_author_created_idx
  ON comments(author_id, created_at DESC);

-- ============================================================
-- menu_items: /menu, /event, 홈 인기메뉴, admin 메뉴 관리
-- ============================================================

-- 메뉴 페이지 (category + 정렬)
CREATE INDEX IF NOT EXISTS menu_items_category_sort_created_idx
  ON menu_items(category, sort_order, created_at);

-- 활성 메뉴만 (메뉴/이벤트 페이지에서 자주 필터)
CREATE INDEX IF NOT EXISTS menu_items_available_category_sort_idx
  ON menu_items(category, sort_order, created_at)
  WHERE is_available = true;

-- 홈 인기 메뉴 (popular_order NOT NULL인 것만 인덱스)
CREATE INDEX IF NOT EXISTS menu_items_popular_idx
  ON menu_items(popular_order)
  WHERE popular_order IS NOT NULL AND is_available = true;

-- ============================================================
-- profiles: 로그인, /u/[username], RLS 정책 (role 체크)
-- ============================================================

-- /u/[username] 조회 (이미 unique 제약이 있을 수 있지만 명시적으로)
CREATE INDEX IF NOT EXISTS profiles_username_idx
  ON profiles(username);

-- 관리자 회원 목록 (가입일순)
CREATE INDEX IF NOT EXISTS profiles_created_idx
  ON profiles(created_at DESC);

-- ============================================================
-- popups: 홈에서 활성 팝업 1개 픽
-- ============================================================

CREATE INDEX IF NOT EXISTS popups_active_created_idx
  ON popups(is_active, created_at DESC)
  WHERE is_active = true;
