ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS base_cost numeric,
  ADD COLUMN IF NOT EXISTS base_cost_3ml numeric,
  ADD COLUMN IF NOT EXISTS base_cost_6ml numeric,
  ADD COLUMN IF NOT EXISTS inspired_by text;

UPDATE public.products
SET base_cost_3ml = base_cost
WHERE base_cost_3ml IS NULL AND base_cost IS NOT NULL;

UPDATE public.products
SET base_cost_6ml = base_cost
WHERE base_cost_6ml IS NULL AND base_cost IS NOT NULL;
