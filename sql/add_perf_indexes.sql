-- 핫 쿼리 패턴과 RLS 정책 컬럼에 대한 인덱스 보강
-- public 스키마 명시 + 테이블별 EXCEPTION 블록으로 부분 실패 격리

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS posts_type_created_at_idx
    ON public.posts(type, created_at DESC);

  CREATE INDEX IF NOT EXISTS posts_type_pinned_created_idx
    ON public.posts(type, is_pinned DESC, created_at DESC);

  CREATE INDEX IF NOT EXISTS posts_author_created_idx
    ON public.posts(author_id, created_at DESC);

  CREATE INDEX IF NOT EXISTS posts_author_type_created_idx
    ON public.posts(author_id, type, created_at DESC);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'posts 테이블이 없어 건너뜁니다';
END $$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS comments_post_created_idx
    ON public.comments(post_id, created_at);

  CREATE INDEX IF NOT EXISTS comments_author_created_idx
    ON public.comments(author_id, created_at DESC);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'comments 테이블이 없어 건너뜁니다';
END $$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS menu_items_category_sort_created_idx
    ON public.menu_items(category, sort_order, created_at);

  CREATE INDEX IF NOT EXISTS menu_items_available_category_sort_idx
    ON public.menu_items(category, sort_order, created_at)
    WHERE is_available = true;

  CREATE INDEX IF NOT EXISTS menu_items_popular_idx
    ON public.menu_items(popular_order)
    WHERE popular_order IS NOT NULL AND is_available = true;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'menu_items 테이블이 없어 건너뜁니다';
END $$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS profiles_username_idx
    ON public.profiles(username);

  CREATE INDEX IF NOT EXISTS profiles_created_idx
    ON public.profiles(created_at DESC);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'profiles 테이블이 없어 건너뜁니다';
END $$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS popups_active_created_idx
    ON public.popups(is_active, created_at DESC)
    WHERE is_active = true;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'popups 테이블이 없어 건너뜁니다';
END $$;
