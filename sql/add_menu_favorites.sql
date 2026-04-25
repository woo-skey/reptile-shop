-- 메뉴 즐겨찾기
CREATE TABLE IF NOT EXISTS menu_favorites (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  menu_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, menu_id)
);

CREATE INDEX IF NOT EXISTS menu_favorites_user_idx
  ON menu_favorites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS menu_favorites_menu_idx
  ON menu_favorites(menu_id);

ALTER TABLE menu_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_menu_favorites" ON menu_favorites;
CREATE POLICY "select_own_menu_favorites" ON menu_favorites
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_menu_favorites" ON menu_favorites;
CREATE POLICY "insert_own_menu_favorites" ON menu_favorites
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_menu_favorites" ON menu_favorites;
CREATE POLICY "delete_own_menu_favorites" ON menu_favorites
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
