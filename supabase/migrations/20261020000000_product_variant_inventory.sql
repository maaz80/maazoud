-- Per-size inventory for products. NULL means inventory is not tracked.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_3ml integer,
  ADD COLUMN IF NOT EXISTS stock_6ml integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_stock_3ml_nonnegative'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_stock_3ml_nonnegative CHECK (stock_3ml IS NULL OR stock_3ml >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_stock_6ml_nonnegative'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_stock_6ml_nonnegative CHECK (stock_6ml IS NULL OR stock_6ml >= 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.decrement_product_inventory_for_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  order_item jsonb;
  product_row public.products%ROWTYPE;
  product_id_text text;
  variant_size text;
  requested_quantity integer;
  available_quantity integer;
  variant_is_out_of_stock boolean;
  variant_in_stock boolean;
BEGIN
  FOR order_item IN
    SELECT value FROM jsonb_array_elements(COALESCE(NEW.items, '[]'::jsonb))
  LOOP
    product_id_text := order_item #>> '{product,id}';
    variant_size := lower(COALESCE(order_item->>'selectedSize', '3ml'));
    requested_quantity := COALESCE(NULLIF(order_item->>'quantity', '')::integer, 1);

    IF product_id_text IS NULL OR product_id_text = '' THEN
      CONTINUE;
    END IF;

    IF requested_quantity < 1 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', product_id_text
        USING ERRCODE = '22023';
    END IF;

    SELECT p.* INTO product_row
    FROM public.products AS p
    WHERE p.id::text = product_id_text
    FOR UPDATE;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    IF variant_size = '6ml' THEN
      available_quantity := product_row.stock_6ml;
      variant_is_out_of_stock := COALESCE(product_row.is_out_of_stock_6ml, false);
      variant_in_stock := product_row.in_stock_6ml IS DISTINCT FROM false;
    ELSE
      available_quantity := product_row.stock_3ml;
      variant_is_out_of_stock := COALESCE(product_row.is_out_of_stock_3ml, false);
      variant_in_stock := product_row.in_stock_3ml IS DISTINCT FROM false;
    END IF;

    IF COALESCE(product_row.is_out_of_stock, false)
      OR product_row.in_stock IS FALSE
      OR variant_is_out_of_stock
      OR NOT variant_in_stock THEN
      RAISE EXCEPTION 'Insufficient stock for product % (%). Available: %, requested: %',
        product_id_text, variant_size, available_quantity, requested_quantity
        USING ERRCODE = 'P0001';
    END IF;

    -- Preserve legacy behavior for products whose inventory is not tracked.
    IF available_quantity IS NULL THEN
      CONTINUE;
    END IF;

    IF available_quantity < requested_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product % (%). Available: %, requested: %',
        product_id_text, variant_size, available_quantity, requested_quantity
        USING ERRCODE = 'P0001';
    END IF;

    IF variant_size = '6ml' THEN
      UPDATE public.products
      SET stock_6ml = available_quantity - requested_quantity,
          is_out_of_stock_6ml = (available_quantity - requested_quantity = 0),
          in_stock_6ml = (available_quantity - requested_quantity > 0)
      WHERE id::text = product_id_text;
    ELSE
      UPDATE public.products
      SET stock_3ml = available_quantity - requested_quantity,
          is_out_of_stock_3ml = (available_quantity - requested_quantity = 0),
          in_stock_3ml = (available_quantity - requested_quantity > 0)
      WHERE id::text = product_id_text;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS decrement_product_inventory_after_order ON public.orders;
CREATE TRIGGER decrement_product_inventory_after_order
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.decrement_product_inventory_for_order();

-- Allow product detail pages to update their stock label while already open.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'products'
    ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
END $$;
