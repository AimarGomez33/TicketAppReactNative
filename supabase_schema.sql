-- ==============================================================================
-- SCHEMA SUPABASE PARA TICKET APP POS (ANTOJITOS MEXICANOS MARGARITA)
-- ==============================================================================
-- Copia y pega este script completo en el SQL Editor de tu panel de Supabase.

-- 1. Tabla de Estado de Mesas en Tiempo Real
CREATE TABLE IF NOT EXISTS tables_state (
  table_number VARCHAR(10) PRIMARY KEY,
  status VARCHAR(20) NOT NULL DEFAULT 'free', -- 'free' | 'busy' | 'bill_requested' | 'cleaning'
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  waiter_name VARCHAR(50),
  active_order_id UUID
);

-- Inicializar 12 mesas por defecto
INSERT INTO tables_state (table_number, status)
VALUES 
  ('1', 'free'), ('2', 'free'), ('3', 'free'), ('4', 'free'),
  ('5', 'free'), ('6', 'free'), ('7', 'free'), ('8', 'free'),
  ('9', 'free'), ('10', 'free'), ('11', 'free'), ('12', 'free'),
  ('Llevar', 'free')
ON CONFLICT (table_number) DO NOTHING;

-- 2. Tabla de Órdenes Maestras
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' | 'paid' | 'cancelled'
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(20), -- 'cash' | 'card' | 'transfer'
  amount_paid NUMERIC(10,2) DEFAULT 0,
  change_given NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Tabla de Platillos y Rondas
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  table_number VARCHAR(10) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  notes TEXT DEFAULT '',
  round_number INT NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'sent_to_kitchen'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar Publicación en Tiempo Real (Supabase Realtime)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE tables_state;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- 5. Políticas de Acceso RLS permisivas para la app POS (anon)
ALTER TABLE tables_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo en tables_state para anon" ON tables_state
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo en orders para anon" ON orders
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo en order_items para anon" ON order_items
  FOR ALL USING (true) WITH CHECK (true);
