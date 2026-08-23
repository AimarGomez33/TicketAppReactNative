-- ==============================================================================
-- SCHEMA SUPABASE PLANTILLA (GENÉRICO / DEMO)
-- ==============================================================================
-- Copia y pega este script en el SQL Editor de Supabase para inicializar la estructura.

-- 1. Tabla de Categorías de Menú
CREATE TABLE IF NOT EXISTS menu_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon_name VARCHAR(50),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Platillos / Productos de Menú
CREATE TABLE IF NOT EXISTS menu_products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  category_id VARCHAR(50) REFERENCES menu_categories(id) ON DELETE SET NULL,
  description TEXT DEFAULT '',
  kitchen_station VARCHAR(50) DEFAULT 'mexican', -- 'mexican' | 'american_tacos'
  is_custom_price BOOLEAN NOT NULL DEFAULT false, -- True para extras con precio abierto
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Estado de Mesas en Tiempo Real
CREATE TABLE IF NOT EXISTS tables_state (
  table_number VARCHAR(10) PRIMARY KEY,
  status VARCHAR(20) NOT NULL DEFAULT 'free', -- 'free' | 'busy' | 'bill_requested' | 'cleaning'
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  waiter_name VARCHAR(50),
  active_order_id UUID
);

-- Inicializar mesas por defecto
INSERT INTO tables_state (table_number, status)
VALUES 
  ('1', 'free'), ('2', 'free'), ('3', 'free'), ('4', 'free'),
  ('5', 'free'), ('6', 'free'), ('7', 'free'), ('8', 'free'),
  ('9', 'free'), ('10', 'free'), ('11', 'free'), ('12', 'free'),
  ('Llevar', 'free')
ON CONFLICT (table_number) DO NOTHING;

-- 4. Tabla de Órdenes Maestras
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

-- 5. Tabla de Ítems de la Orden
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

-- ==============================================================================
-- SEED DE DEMOSTRACIÓN (EJEMPLO)
-- ==============================================================================
INSERT INTO menu_categories (id, name, icon_name, sort_order)
VALUES
  ('demo-cat-1', 'Platillos Principales', 'UtensilsCrossed', 1),
  ('demo-cat-2', 'Bebidas', 'Coffee', 2),
  ('extras', 'Extras & Personalizados', 'PlusCircle', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu_products (id, name, price, category_id, description, kitchen_station, is_custom_price, sort_order)
VALUES
  ('demo-prod-1', 'Platillo Ejemplo 1', 50.00, 'demo-cat-1', 'Descripción de muestra', 'mexican', false, 1),
  ('demo-prod-2', 'Bebida Ejemplo', 25.00, 'demo-cat-2', 'Bebida de muestra', 'mexican', false, 2),
  ('ext-personalizado', 'Extra Personalizado', 0.00, 'extras', 'Monto y concepto libre definido por el operador', 'mexican', true, 3)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 6. Habilitar Publicación en Tiempo Real (Supabase Realtime)
-- ==============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE menu_categories;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE menu_products;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE tables_state;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ==============================================================================
-- 7. Políticas de Acceso RLS
-- ==============================================================================
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo en menu_categories para anon" ON menu_categories;
CREATE POLICY "Permitir todo en menu_categories para anon" ON menu_categories
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en menu_products para anon" ON menu_products;
CREATE POLICY "Permitir todo en menu_products para anon" ON menu_products
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en tables_state para anon" ON tables_state;
CREATE POLICY "Permitir todo en tables_state para anon" ON tables_state
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en orders para anon" ON orders;
CREATE POLICY "Permitir todo en orders para anon" ON orders
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en order_items para anon" ON order_items;
CREATE POLICY "Permitir todo en order_items para anon" ON order_items
  FOR ALL USING (true) WITH CHECK (true);
