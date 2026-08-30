-- Ejecutar una sola vez en Supabase SQL Editor para instalaciones existentes.
-- Hace que todos los cambios relevantes entreguen suficiente contexto a Realtime.

ALTER TABLE menu_categories REPLICA IDENTITY FULL;
ALTER TABLE menu_products REPLICA IDENTITY FULL;
ALTER TABLE tables_state REPLICA IDENTITY FULL;
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE order_items REPLICA IDENTITY FULL;

-- Instalaciones creadas antes del esquema actual pueden tener una clave
-- primaria sin default. La aplicación no manda IDs: Postgres debe generarlos.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER TABLE order_items
ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS kitchen_station VARCHAR(50) DEFAULT 'station_a';

-- Los modificadores (guisado, queso, papas, etc.) son datos del catálogo,
-- no condiciones en la app. Cada terminal los carga desde esta columna.
ALTER TABLE menu_products
ADD COLUMN IF NOT EXISTS modifier_groups JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Atajos de mostrador administrados en Supabase. No se incluyen productos
-- favoritos dentro de la app: cada negocio define los suyos.
ALTER TABLE menu_products
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE menu_products
ADD COLUMN IF NOT EXISTS favorite_order INT NOT NULL DEFAULT 0;

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS menu_product_id VARCHAR(50);

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS modifier_total NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Una orden para llevar usa un folio único (L-...) y no representa una mesa
-- física. Este tipo permite distinguirla en reportes e integraciones.
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) NOT NULL DEFAULT 'table';

UPDATE orders
SET order_type = 'takeaway'
WHERE table_number LIKE 'L-%';

UPDATE order_items
SET menu_product_id = product_id
WHERE menu_product_id IS NULL;

UPDATE order_items AS item
SET kitchen_station = product.kitchen_station
FROM menu_products AS product
WHERE item.product_id = product.id
  AND (item.kitchen_station IS NULL OR item.kitchen_station = '');

-- Identificadores técnicos neutrales para estaciones de cocina. Conserva la
-- asignación actual de cada producto sin dejar categorías comerciales en app.
UPDATE menu_products
SET kitchen_station = CASE kitchen_station
  WHEN 'mexican' THEN 'station_a'
  WHEN 'american_tacos' THEN 'station_b'
  ELSE kitchen_station
END;

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

-- Cuando cambia un precio, se actualizan únicamente órdenes activas. Las
-- órdenes pagadas conservan el precio histórico con el que se cobraron.
CREATE OR REPLACE FUNCTION public.refresh_active_orders_after_product_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.price IS NOT DISTINCT FROM OLD.price THEN
    RETURN NEW;
  END IF;

  UPDATE public.order_items AS item
  SET price = NEW.price + COALESCE(item.modifier_total, 0)
  FROM public.orders AS order_header
  WHERE item.order_id = order_header.id
    AND order_header.status = 'active'
    AND COALESCE(item.menu_product_id, item.product_id) = NEW.id;

  UPDATE public.orders AS order_header
  SET total = COALESCE((
    SELECT SUM(item.price * item.quantity)
    FROM public.order_items AS item
    WHERE item.order_id = order_header.id
  ), 0)
  WHERE order_header.status = 'active';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS menu_product_price_updates_active_orders ON public.menu_products;
CREATE TRIGGER menu_product_price_updates_active_orders
AFTER UPDATE OF price ON public.menu_products
FOR EACH ROW
EXECUTE FUNCTION public.refresh_active_orders_after_product_price_change();

-- Configuración extraída de "Menú completo (1).pdf". Puede editarse desde
-- Supabase; al cambiarla Realtime vuelve a cargar el catálogo en los equipos.
UPDATE public.menu_products
SET modifier_groups = $json$
[
  {
    "id": "guisado",
    "label": "ELIGE EL GUISADO",
    "minSelections": 1,
    "maxSelections": 1,
    "options": [
      {"id": "tinga-pollo", "name": "Tinga de pollo"},
      {"id": "bistec", "name": "Bistec"},
      {"id": "huitlacoche", "name": "Huitlacoche"},
      {"id": "chicharron-prensado", "name": "Chicharrón prensado"},
      {"id": "huevo", "name": "Huevo"},
      {"id": "molleja", "name": "Molleja"},
      {"id": "chorizo", "name": "Chorizo"},
      {"id": "picadillo", "name": "Picadillo"},
      {"id": "mole-verde", "name": "Mole verde"},
      {"id": "panza", "name": "Panza"},
      {"id": "champiñones", "name": "Champiñones"},
      {"id": "pollo", "name": "Pollo"},
      {"id": "bistec-nopales", "name": "Bistec con nopales"},
      {"id": "papa-chorizo", "name": "Papa con chorizo"}
    ]
  },
  {
    "id": "queso",
    "label": "¿CON QUESO?",
    "minSelections": 0,
    "maxSelections": 1,
    "options": [{"id": "con-queso", "name": "Con queso", "priceDelta": 0}]
  }
]
$json$::jsonb
WHERE id = 'gen-quesadilla';

-- Pambazos: la carta no incluye chorizo entre sus guisados.
UPDATE public.menu_products AS target
SET modifier_groups = jsonb_build_array(
  jsonb_build_object(
    'id', 'guisado', 'label', 'ELIGE EL GUISADO', 'minSelections', 1,
    'maxSelections', CASE WHEN target.id LIKE '%-comb' THEN 2 ELSE 1 END,
    'options', jsonb_build_array(
      jsonb_build_object('id', 'pollo', 'name', 'Pollo'),
      jsonb_build_object('id', 'papa-chorizo', 'name', 'Papa con chorizo'),
      jsonb_build_object('id', 'tinga-pollo', 'name', 'Tinga de pollo'),
      jsonb_build_object('id', 'bistec', 'name', 'Bistec'),
      jsonb_build_object('id', 'huitlacoche', 'name', 'Huitlacoche'),
      jsonb_build_object('id', 'chicharron', 'name', 'Chicharrón'),
      jsonb_build_object('id', 'huevo', 'name', 'Huevo'),
      jsonb_build_object('id', 'molleja', 'name', 'Molleja'),
      jsonb_build_object('id', 'picadillo', 'name', 'Picadillo'),
      jsonb_build_object('id', 'mole-verde', 'name', 'Mole verde'),
      jsonb_build_object('id', 'panza', 'name', 'Panza'),
      jsonb_build_object('id', 'champiñones', 'name', 'Champiñones'),
      jsonb_build_object('id', 'bistec-nopales', 'name', 'Bistec con nopales')
    )
  ),
  jsonb_build_object(
    'id', 'queso-extra', 'label', 'QUESO EXTRA', 'minSelections', 0, 'maxSelections', 1,
    'options', jsonb_build_array(jsonb_build_object('id', 'con-queso-extra', 'name', 'Con queso', 'priceDelta', 15))
  )
)
WHERE target.id IN ('gen-pambazo-nat', 'gen-pambazo-adob', 'gen-pambazo-nat-comb', 'gen-pambazo-adob-comb');

UPDATE public.menu_products
SET modifier_groups = $json$
[
  {
    "id": "guisado", "label": "ELIGE EL GUISADO", "minSelections": 1, "maxSelections": 1,
    "options": [
      {"id": "pollo", "name": "Pollo"}, {"id": "papa-chorizo", "name": "Papa con chorizo"},
      {"id": "tinga-pollo", "name": "Tinga de pollo"}, {"id": "bistec", "name": "Bistec"},
      {"id": "huitlacoche", "name": "Huitlacoche"}, {"id": "chicharron", "name": "Chicharrón"},
      {"id": "huevo", "name": "Huevo"}, {"id": "molleja", "name": "Molleja"},
      {"id": "picadillo", "name": "Picadillo"}, {"id": "mole-verde", "name": "Mole verde"},
      {"id": "panza", "name": "Panza"}, {"id": "champiñones", "name": "Champiñones"},
      {"id": "bistec-nopales", "name": "Bistec con nopales"}, {"id": "chorizo", "name": "Chorizo"}
    ]
  },
  {
    "id": "queso-extra", "label": "QUESO EXTRA", "minSelections": 0, "maxSelections": 1,
    "options": [{"id": "con-queso-extra", "name": "Con queso", "priceDelta": 15}]
  }
]
$json$::jsonb
WHERE id = 'gen-guajolota';

UPDATE public.menu_products
SET modifier_groups = $json$
[
  {
    "id": "guisado", "label": "ELIGE EL GUISADO", "minSelections": 1, "maxSelections": 1,
    "options": [
      {"id": "pata-res", "name": "Pata de res"}, {"id": "tinga-pollo", "name": "Tinga de pollo"},
      {"id": "picadillo", "name": "Picadillo"}, {"id": "mole-verde", "name": "Mole verde"},
      {"id": "panza", "name": "Panza"}, {"id": "champiñones", "name": "Champiñones"},
      {"id": "pollo", "name": "Pollo"}, {"id": "bistec-nopales", "name": "Bistec con nopales"},
      {"id": "papa-chorizo", "name": "Papa con chorizo"}
    ]
  }
]
$json$::jsonb
WHERE id = 'gen-tostada';

UPDATE public.menu_products
SET modifier_groups = $json$
[
  {
    "id": "papas",
    "label": "AGREGAR PAPAS",
    "minSelections": 0,
    "maxSelections": 1,
    "options": [{"id": "con-papas", "name": "Con papas", "priceDelta": 30}]
  }
]
$json$::jsonb
WHERE id IN (
  'gen-burg-americana', 'gen-burg-especial', 'gen-burg-suiza',
  'gen-burg-texana', 'gen-burg-pollo-bbq'
);

UPDATE public.menu_products
SET modifier_groups = $json$
[
  {
    "id": "carne", "label": "ELIGE LA CARNE", "minSelections": 1, "maxSelections": 1,
    "options": [
      {"id": "arrachera", "name": "Arrachera"}, {"id": "costilla", "name": "Costilla"},
      {"id": "carne-enchilada", "name": "Carne enchilada"}, {"id": "bistec", "name": "Bistec"},
      {"id": "chorizo", "name": "Chorizo"}, {"id": "campechano", "name": "Campechano"},
      {"id": "chistorra", "name": "Chistorra"}, {"id": "chorizo-argentino", "name": "Chorizo argentino"}
    ]
  },
  {
    "id": "queso", "label": "¿CON QUESO?", "minSelections": 0, "maxSelections": 1,
    "options": [{"id": "con-queso", "name": "Con queso", "priceDelta": 12}]
  }
]
$json$::jsonb
WHERE id = 'gen-taco';

UPDATE public.menu_products AS target
SET modifier_groups = jsonb_build_array(
  jsonb_build_object(
    'id', 'salsa', 'label', 'ELIGE LA SALSA', 'minSelections', 1,
    'maxSelections', CASE WHEN target.id = 'gen-alitas-12' THEN 2 ELSE 1 END,
    'options', jsonb_build_array(
      jsonb_build_object('id', 'bbq', 'name', 'BBQ'),
      jsonb_build_object('id', 'bbq-picante', 'name', 'BBQ picante'),
      jsonb_build_object('id', 'bufalo', 'name', 'Búfalo'),
      jsonb_build_object('id', 'mango-habanero', 'name', 'Mango-habanero'),
      jsonb_build_object('id', 'lemon-pepper', 'name', 'Lemon pepper'),
      jsonb_build_object('id', 'ajo-parmesano', 'name', 'Ajo parmesano')
    )
  ),
  jsonb_build_object(
    'id', 'papas', 'label', 'AGREGAR PAPAS', 'minSelections', 0, 'maxSelections', 1,
    'options', jsonb_build_array(jsonb_build_object('id', 'con-papas', 'name', 'Con papas', 'priceDelta', 30))
  )
)
WHERE target.id IN ('gen-alitas-6', 'gen-alitas-12');

UPDATE public.menu_products
SET modifier_groups = $json$
[
  {
    "id": "salsa", "label": "ELIGE LA SALSA", "minSelections": 1, "maxSelections": 1,
    "options": [
      {"id": "bbq", "name": "BBQ"}, {"id": "bbq-picante", "name": "BBQ picante"},
      {"id": "bufalo", "name": "Búfalo"}, {"id": "mango-habanero", "name": "Mango-habanero"},
      {"id": "lemon-pepper", "name": "Lemon pepper"}, {"id": "ajo-parmesano", "name": "Ajo parmesano"}
    ]
  }
]
$json$::jsonb
WHERE id = 'gen-papas-boneless';

UPDATE public.menu_products
SET modifier_groups = $json$
[
  {
    "id": "proteina", "label": "ELIGE LA PROTEÍNA", "minSelections": 1, "maxSelections": 1,
    "options": [
      {"id": "pollo", "name": "Pollo"}, {"id": "puerco", "name": "Puerco"}, {"id": "combinado", "name": "Combinado"}
    ]
  },
  {
    "id": "crema", "label": "CREMA EXTRA", "minSelections": 0, "maxSelections": 1,
    "options": [{"id": "con-crema-extra", "name": "Con crema extra", "priceDelta": 10}]
  }
]
$json$::jsonb
WHERE id IN ('gen-pozole-chico', 'gen-pozole-grande');

-- Corrige y completa la categoría de papas de instalaciones existentes.
INSERT INTO public.menu_products
  (id, name, price, category_id, description, kitchen_station, is_custom_price, is_active, sort_order)
VALUES
  ('gen-papas-francesa', 'Papas Sencillas', 60.00, 'papas', 'Porción individual de papas crujientes con sal y sazón', 'station_b', false, true, 28),
  ('gen-papas-boneless', 'Papas con Boneless', 130.00, 'papas', 'Papas acompañadas de boneless', 'station_b', false, true, 29),
  ('gen-papas-aros-bbq', 'Papas con Aros de Cebolla y BBQ', 110.00, 'papas', 'Papas acompañadas de aros de cebolla y salsa BBQ', 'station_b', false, true, 30)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  category_id = EXCLUDED.category_id,
  description = EXCLUDED.description,
  kitchen_station = EXCLUDED.kitchen_station,
  is_custom_price = EXCLUDED.is_custom_price,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- Correcciones de carta confirmadas visualmente en el PDF.
UPDATE public.menu_products
SET price = 140.00
WHERE id = 'gen-alitas-12';

UPDATE public.menu_products
SET name = 'Taco',
    description = 'Tortilla de harina o de maíz, nopales y perejil frito'
WHERE id = 'gen-taco';

-- Este producto puede ser recién creado por el INSERT anterior, por lo que
-- su configuración se aplica después de asegurar que ya existe.
UPDATE public.menu_products
SET modifier_groups = $json$
[
  {
    "id": "salsa", "label": "ELIGE LA SALSA", "minSelections": 1, "maxSelections": 1,
    "options": [
      {"id": "bbq", "name": "BBQ"}, {"id": "bbq-picante", "name": "BBQ picante"},
      {"id": "bufalo", "name": "Búfalo"}, {"id": "mango-habanero", "name": "Mango-habanero"},
      {"id": "lemon-pepper", "name": "Lemon pepper"}, {"id": "ajo-parmesano", "name": "Ajo parmesano"}
    ]
  }
]
$json$::jsonb
WHERE id = 'gen-papas-boneless';

-- Las versiones antiguas "con queso" se sustituyen por el checkbox del
-- producto base para no mostrar opciones duplicadas.
UPDATE public.menu_products
SET is_active = false
WHERE id IN ('gen-pambazo-nat-queso', 'gen-pambazo-adob-queso');
