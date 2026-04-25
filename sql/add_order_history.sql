-- 메뉴 계산기 주문 저장
CREATE TABLE IF NOT EXISTS order_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  items jsonb NOT NULL,         -- [{ key, name, suffix, unitPrice, quantity }, ...]
  total integer NOT NULL,
  label text,                    -- 사용자가 붙이는 메모 (옵션)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_history_user_idx
  ON order_history(user_id, created_at DESC);

ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_orders" ON order_history;
CREATE POLICY "select_own_orders" ON order_history
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_orders" ON order_history;
CREATE POLICY "insert_own_orders" ON order_history
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_orders" ON order_history;
CREATE POLICY "delete_own_orders" ON order_history
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
