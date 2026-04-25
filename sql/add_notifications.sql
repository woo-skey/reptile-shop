-- 인앱 알림 (in-app notifications)
-- 게시글에 댓글이 달릴 때 작성자에게 알림 row 자동 삽입.
-- 본인이 본인 글에 댓글 달면 알림 만들지 않음.

CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  source_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON notifications(user_id, is_read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- INSERT는 트리거(SECURITY DEFINER)에서만 들어가도록 정책을 따로 두지 않음.

-- 댓글 작성 시 게시글 작성자에게 알림 자동 삽입
CREATE OR REPLACE FUNCTION notify_post_author_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_row RECORD;
  commenter_name text;
BEGIN
  SELECT id, author_id, type, title INTO post_row
    FROM posts WHERE id = NEW.post_id;

  IF post_row.author_id IS NULL OR post_row.author_id = NEW.author_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, username) INTO commenter_name
    FROM profiles WHERE id = NEW.author_id;

  INSERT INTO notifications (user_id, type, title, body, link, source_id)
  VALUES (
    post_row.author_id,
    'comment_on_my_post',
    COALESCE(commenter_name, '단골') || '님이 댓글을 남겼습니다',
    LEFT(NEW.content, 80),
    '/' || post_row.type || '/' || post_row.id,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_post_author_on_comment ON comments;
CREATE TRIGGER trg_notify_post_author_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_author_on_comment();

-- Realtime 활성화 (Supabase 대시보드에서 토글 가능; 명시적으로 추가)
-- 이미 활성화된 경우 에러 무시
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
