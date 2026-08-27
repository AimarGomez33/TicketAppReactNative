-- Ejecutar una sola vez en Supabase SQL Editor para instalaciones existentes.
-- Hace que todos los cambios relevantes entreguen suficiente contexto a Realtime.

ALTER TABLE menu_categories REPLICA IDENTITY FULL;
ALTER TABLE menu_products REPLICA IDENTITY FULL;
ALTER TABLE tables_state REPLICA IDENTITY FULL;
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE order_items REPLICA IDENTITY FULL;

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS kitchen_station VARCHAR(50) DEFAULT 'station_a';

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
  SET price = NEW.price
  FROM public.orders AS order_header
  WHERE item.order_id = order_header.id
    AND order_header.status = 'active'
    AND item.product_id = NEW.id;

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
