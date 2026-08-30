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
  kitchen_station VARCHAR(50) DEFAULT 'station_a', -- 'station_a' | 'station_b'
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
  payment_method VARCHAR(20), -- 'cash'
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
  kitchen_station VARCHAR(50) DEFAULT 'station_a',
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
  ('demo-prod-1', 'Producto de ejemplo 1', 50.00, 'demo-cat-1', 'Descripción de muestra', 'station_a', false, 1),
  ('demo-prod-2', 'Producto de ejemplo 2', 25.00, 'demo-cat-2', 'Descripción de muestra', 'station_a', false, 2),
  ('ext-personalizado', 'Concepto personalizado', 0.00, 'extras', 'Monto y concepto libre definido por el operador', 'station_a', true, 3)
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

-- Los precios de órdenes activas se recalculan desde el catálogo central.
-- Las órdenes pagadas conservan su precio histórico.
CREATE OR REPLACE FUNCTION refresh_active_orders_after_product_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.price IS NOT DISTINCT FROM OLD.price THEN
    RETURN NEW;
  END IF;

  UPDATE order_items AS item
  SET price = NEW.price
  FROM orders AS order_header
  WHERE item.order_id = order_header.id
    AND order_header.status = 'active'
    AND item.product_id = NEW.id;

  UPDATE orders AS order_header
  SET total = COALESCE((
    SELECT SUM(item.price * item.quantity)
    FROM order_items AS item
    WHERE item.order_id = order_header.id
  ), 0)
  WHERE order_header.status = 'active';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS menu_product_price_updates_active_orders ON menu_products;
CREATE TRIGGER menu_product_price_updates_active_orders
AFTER UPDATE OF price ON menu_products
FOR EACH ROW
EXECUTE FUNCTION refresh_active_orders_after_product_price_change();

-- ==============================================================================
-- 7. Políticas de Acceso RLS
-- ==============================================================================
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Entrega a Realtime el valor anterior y nuevo en UPDATE/DELETE. Es esencial
-- para que todas las terminales puedan reconciliar comandas sin estado local.
ALTER TABLE menu_categories REPLICA IDENTITY FULL;
ALTER TABLE menu_products REPLICA IDENTITY FULL;
ALTER TABLE tables_state REPLICA IDENTITY FULL;
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE order_items REPLICA IDENTITY FULL;

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
