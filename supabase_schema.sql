-- ==============================================================================
-- SCHEMA SUPABASE PARA TICKET APP POS & ADMIN APP
-- ==============================================================================
-- Copia y pega este script completo en el SQL Editor de tu panel de Supabase.

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
-- SEED INICIAL DE CATEGORÍAS
-- ==============================================================================
INSERT INTO menu_categories (id, name, icon_name, sort_order)
VALUES
  ('antojitos', 'Antojitos', 'UtensilsCrossed', 1),
  ('quesadillas', 'Quesadillas', 'Flame', 2),
  ('tostadas', 'Tostadas', 'Flame', 3),
  ('pambazos', 'Pambazos & Guajoloyet', 'Flame', 4),
  ('guajolotas', 'Guajolotas & Volcanes', 'Flame', 5),
  ('pozole', 'Pozole', 'UtensilsCrossed', 6),
  ('hamburguesas', 'Hamburguesas', 'Beef', 7),
  ('alitas', 'Alitas', 'Flame', 8),
  ('tacos', 'Tacos', 'Beef', 9),
  ('papas', 'Papas Francesas', 'Flame', 10),
  ('bebidas', 'Bebidas & Cafetería', 'Coffee', 11),
  ('extras', 'Extras & Personalizados', 'PlusCircle', 12)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon_name = EXCLUDED.icon_name,
  sort_order = EXCLUDED.sort_order;

-- ==============================================================================
-- SEED INICIAL DE PRODUCTOS (INCLUYE PAMBAZOS C/QUESO Y EXTRA PERSONALIZADO)
-- ==============================================================================
INSERT INTO menu_products (id, name, price, category_id, description, kitchen_station, is_custom_price, sort_order)
VALUES
  -- --- ANTOJITOS ---
  ('gen-chalupa', 'Chalupa', 6.00, 'antojitos', 'Tortillita de maíz, papa, salsa, lechuga, queso rallado y pollo', 'mexican', false, 1),
  ('gen-mollejas', 'Orden de Mollejas', 25.00, 'antojitos', '2 tortillas maíz, 3 mollejas de pollo, salsa, lechuga, queso rallado', 'mexican', false, 2),
  ('gen-patitas', 'Orden de Patitas', 25.00, 'antojitos', '2 tortillas maíz, 3 patitas de pollo, salsa, lechuga, queso rallado', 'mexican', false, 3),
  ('gen-higados', 'Orden de Hígados', 25.00, 'antojitos', '2 tortillas maíz, 3 hígados de pollo, salsa, lechuga, queso rallado', 'mexican', false, 4),
  ('gen-huevo', 'Huevo Preparado', 22.00, 'antojitos', '2 tortillas maíz, 1 huevo, salsa, lechuga, queso rallado', 'mexican', false, 5),
  ('gen-alon', 'Alón Preparado', 25.00, 'antojitos', '2 tortillas maíz, 1 alita de pollo, salsa, lechuga, queso rallado', 'mexican', false, 6),

  -- --- QUESADILLAS ---
  ('gen-quesadilla', 'Quesadilla', 33.00, 'quesadillas', 'Con o sin queso. Especificar guisado en notas', 'mexican', false, 7),

  -- --- TOSTADAS ---
  ('gen-tostada', 'Tostada', 37.00, 'tostadas', 'Tostada de maíz, crema, guisado a elegir, lechuga, queso rallado', 'mexican', false, 8),

  -- --- PAMBAZOS & GUAJOLOYET ---
  ('gen-pambazo-nat', 'Pambazo Natural', 38.00, 'pambazos', 'Papa, salsa, lechuga, queso rallado y 1 guisado', 'mexican', false, 9),
  ('gen-pambazo-nat-queso', 'Pambazo Natural con Queso', 53.00, 'pambazos', 'Pambazo natural + Porción de Queso Oaxaca fundido ($38 + $15)', 'mexican', false, 10),
  ('gen-pambazo-adob', 'Pambazo Adobado', 43.00, 'pambazos', 'Papa, salsa, lechuga, queso rallado y 1 guisado', 'mexican', false, 11),
  ('gen-pambazo-adob-queso', 'Pambazo Adobado con Queso', 58.00, 'pambazos', 'Pambazo adobado + Porción de Queso Oaxaca fundido ($43 + $15)', 'mexican', false, 12),
  ('gen-pambazo-nat-comb', 'Pambazo Natural Combinado', 45.00, 'pambazos', 'Papa, salsa, lechuga, queso rallado y 2 guisados', 'mexican', false, 13),
  ('gen-pambazo-adob-comb', 'Pambazo Adobado Combinado', 50.00, 'pambazos', 'Papa, salsa, lechuga, queso rallado y 2 guisados', 'mexican', false, 14),
  ('gen-guajoloyet-nat', 'Guajoloyet Natural', 65.00, 'pambazos', 'Pambazo con 2 chalupas, pollo, huevo, chorizo, salsa, lechuga y queso', 'mexican', false, 15),
  ('gen-guajoloyet-adob', 'Guajoloyet Adobado', 70.00, 'pambazos', 'Pambazo adobado con 2 chalupas, pollo, huevo, chorizo, salsa, lechuga y queso', 'mexican', false, 16),

  -- --- GUAJOLOTAS / VOLCANES ---
  ('gen-guajolota', 'Guajolota / Volcán', 60.00, 'guajolotas', 'Guisado, salsa, lechuga, queso rallado y queso Oaxaca', 'mexican', false, 17),

  -- --- POZOLE ---
  ('gen-pozole-chico', 'Pozole Chico', 100.00, 'pozole', 'Pollo, puerco o combinado. Incluye tostadas y guarnición', 'mexican', false, 18),
  ('gen-pozole-grande', 'Pozole Grande', 120.00, 'pozole', 'Pollo, puerco o combinado. Incluye tostadas y guarnición', 'mexican', false, 19),

  -- --- HAMBURGUESAS ---
  ('gen-burg-americana', 'Hamburguesa Americana', 60.00, 'hamburguesas', 'Carne, queso americano, aderezo de la casa, cebolla, pepinillos', 'american_tacos', false, 20),
  ('gen-burg-especial', 'Hamburguesa Especial', 90.00, 'hamburguesas', 'Carne, tocino, queso Oaxaca, queso americano, aderezo, lechuga, cebolla', 'american_tacos', false, 21),
  ('gen-burg-suiza', 'Hamburguesa Suiza', 90.00, 'hamburguesas', 'Carne, queso Oaxaca, americano, manchego, aderezo, lechuga, cebolla', 'american_tacos', false, 22),
  ('gen-burg-texana', 'Hamburguesa Texana', 110.00, 'hamburguesas', 'Carne, queso manchego, tocino, aros de cebolla, salsa BBQ, aderezo', 'american_tacos', false, 23),
  ('gen-burg-pollo-bbq', 'Hamburguesa Pollo BBQ', 105.00, 'hamburguesas', 'Pollo crují, queso manchego, tocino, salsa BBQ, aderezo, lechuga', 'american_tacos', false, 24),

  -- --- ALITAS ---
  ('gen-alitas-6', 'Alitas (6 pzas)', 80.00, 'alitas', 'Salsas: BBQ, BBQ Picante, Búfalo, Mango-Habanero, Lemon Pepper, Ajo Parmesano', 'american_tacos', false, 25),
  ('gen-alitas-12', 'Alitas (12 pzas)', 150.00, 'alitas', 'Salsas: BBQ, BBQ Picante, Búfalo, Mango-Habanero, Lemon Pepper, Ajo Parmesano', 'american_tacos', false, 26),

  -- --- TACOS ---
  ('gen-taco', 'Taco (Bistec/Arrachera/Costilla)', 35.00, 'tacos', 'Harina o maíz, nopales y perejil frito. Especificar carne en notas', 'american_tacos', false, 27),

  -- --- PAPAS ---
  ('gen-papas-francesa', 'Papas a la Francesa', 45.00, 'papas', 'Porción individual de papas crujientes con sal y sazón', 'american_tacos', false, 28),

  -- --- BEBIDAS & CAFETERÍA ---
  ('gen-refresco', 'Refresco (Vidrio / Lata)', 28.00, 'bebidas', 'Coca-Cola, Sangría, Manzanita, Squirt, 7up, Mirinda, Sprite, Boing, etc.', 'mexican', false, 29),
  ('gen-agua-500', 'Agua de Sabor (1/2 L)', 26.00, 'bebidas', 'Horchata, Nuez, Jamaica, Limón con chía, Mojito, Jamaica sin azúcar', 'mexican', false, 30),
  ('gen-agua-1000', 'Agua Natural (1 L)', 24.00, 'bebidas', 'Agua natural embotellada 1L', 'mexican', false, 31),
  ('gen-cafe', 'Café Americano', 24.00, 'bebidas', 'Café americano recién hecho', 'mexican', false, 32),

  -- --- EXTRAS & PERSONALIZADOS ---
  ('ext-personalizado', 'Extra Personalizado', 0.00, 'extras', 'Monto y descripción libre definido al momento por el operador', 'mexican', true, 33),
  ('ext-papas-combo', 'Extra: Con Papas', 30.00, 'extras', 'Complemento de papas para hamburguesas o alitas', 'american_tacos', false, 34),
  ('ext-queso-taco', 'Extra: Con Queso (Taco)', 12.00, 'extras', 'Queso fundido extra para tacos', 'american_tacos', false, 35),
  ('ext-queso-guajoloyet', 'Extra: Queso o Guisado', 15.00, 'extras', 'Porción extra de queso Oaxaca o guisado (Guajoloyet / Volcán / Pambazo)', 'mexican', false, 36),
  ('ext-crema-pozole', 'Extra: Crema (Pozole)', 10.00, 'extras', 'Porción extra de crema', 'mexican', false, 37)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  category_id = EXCLUDED.category_id,
  description = EXCLUDED.description,
  kitchen_station = EXCLUDED.kitchen_station,
  is_custom_price = EXCLUDED.is_custom_price,
  sort_order = EXCLUDED.sort_order;

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
-- 7. Políticas de Acceso RLS (Lectura pública / Anónima para POS y Admin)
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
