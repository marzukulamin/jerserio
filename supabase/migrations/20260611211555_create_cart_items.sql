CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  jersey_id text NOT NULL,
  jersey_name text NOT NULL,
  color text NOT NULL,
  size text NOT NULL,
  country text NOT NULL,
  price numeric(10,2) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_cart_items" ON cart_items FOR INSERT
  TO anon WITH CHECK (true);

CREATE POLICY "select_cart_items" ON cart_items FOR SELECT
  TO anon USING (true);

CREATE POLICY "update_cart_items" ON cart_items FOR UPDATE
  TO anon USING (true) WITH CHECK (true);

CREATE POLICY "delete_cart_items" ON cart_items FOR DELETE
  TO anon USING (true);
