-- Keep tracked inventory accurate when an admin adds items to an existing order.
CREATE OR REPLACE FUNCTION public.decrement_product_inventory_for_order_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  changed_variant record;
  product_row public.products%ROWTYPE;
  available_quantity integer;
  variant_is_out_of_stock boolean;
  variant_in_stock boolean;
BEGIN
  FOR changed_variant IN
    WITH old_counts AS (
      SELECT
        old_item.value #>> '{product,id}' AS product_id,
        lower(COALESCE(old_item.value->>'selectedSize', '3ml')) AS variant_size,
        SUM(COALESCE(NULLIF(old_item.value->>'quantity', '')::integer, 1)) AS quantity
      FROM jsonb_array_elements(COALESCE(OLD.items, '[]'::jsonb)) AS old_item(value)
      GROUP BY 1, 2
    ),
    new_counts AS (
      SELECT
        new_item.value #>> '{product,id}' AS product_id,
        lower(COALESCE(new_item.value->>'selectedSize', '3ml')) AS variant_size,
        SUM(COALESCE(NULLIF(new_item.value->>'quantity', '')::integer, 1)) AS quantity
      FROM jsonb_array_elements(COALESCE(NEW.items, '[]'::jsonb)) AS new_item(value)
      GROUP BY 1, 2
    )
    SELECT n.product_id, n.variant_size, n.quantity - COALESCE(o.quantity, 0) AS quantity_delta
    FROM new_counts AS n
    LEFT JOIN old_counts AS o USING (product_id, variant_size)
    WHERE n.product_id IS NOT NULL
      AND n.product_id <> ''
      AND n.quantity > COALESCE(o.quantity, 0)
  LOOP
    SELECT p.* INTO product_row
    FROM public.products AS p
    WHERE p.id::text = changed_variant.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    IF changed_variant.variant_size = '6ml' THEN
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
        changed_variant.product_id, changed_variant.variant_size, available_quantity, changed_variant.quantity_delta
        USING ERRCODE = 'P0001';
    END IF;

    -- A NULL stock value means this variant is intentionally not tracked.
    IF available_quantity IS NULL THEN
      CONTINUE;
    END IF;

    IF available_quantity < changed_variant.quantity_delta THEN
      RAISE EXCEPTION 'Insufficient stock for product % (%). Available: %, requested: %',
        changed_variant.product_id, changed_variant.variant_size, available_quantity, changed_variant.quantity_delta
        USING ERRCODE = 'P0001';
    END IF;

    IF changed_variant.variant_size = '6ml' THEN
      UPDATE public.products
      SET stock_6ml = available_quantity - changed_variant.quantity_delta,
          is_out_of_stock_6ml = (available_quantity - changed_variant.quantity_delta = 0),
          in_stock_6ml = (available_quantity - changed_variant.quantity_delta > 0)
      WHERE id::text = changed_variant.product_id;
    ELSE
      UPDATE public.products
      SET stock_3ml = available_quantity - changed_variant.quantity_delta,
          is_out_of_stock_3ml = (available_quantity - changed_variant.quantity_delta = 0),
          in_stock_3ml = (available_quantity - changed_variant.quantity_delta > 0)
      WHERE id::text = changed_variant.product_id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS decrement_product_inventory_on_order_item_update ON public.orders;
CREATE TRIGGER decrement_product_inventory_on_order_item_update
BEFORE UPDATE OF items ON public.orders
FOR EACH ROW
WHEN (OLD.items IS DISTINCT FROM NEW.items)
EXECUTE FUNCTION public.decrement_product_inventory_for_order_update();
