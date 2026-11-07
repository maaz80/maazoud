ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS base_cost numeric,
  ADD COLUMN IF NOT EXISTS inspired_by text;
