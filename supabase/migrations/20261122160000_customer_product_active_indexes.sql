
-- Issue #75: Customer and Product active views and indexes

-- Enable trigram search support.
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Active customer view.
CREATE OR REPLACE VIEW public.customer_active AS
SELECT
    custno,
    custname,
    address,
    payterm,
    is_deleted,
    stamp
FROM public.customer
WHERE NOT is_deleted;

-- Active product view.
CREATE OR REPLACE VIEW public.product_active AS
SELECT
    prodcode,
    description,
    unit,
    is_deleted,
    stamp
FROM public.product
WHERE NOT is_deleted;

-- Customer search indexes.
CREATE INDEX IF NOT EXISTS idx_customer_active_custno_trgm
ON public.customer USING gin (custno extensions.gin_trgm_ops)
WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_customer_active_custname_trgm
ON public.customer USING gin (custname extensions.gin_trgm_ops)
WHERE NOT is_deleted;

-- Customer active-list sorting index.
CREATE INDEX IF NOT EXISTS idx_customer_active_custname
ON public.customer (custname)
WHERE NOT is_deleted;

-- Product search indexes.
CREATE INDEX IF NOT EXISTS idx_product_active_prodcode_trgm
ON public.product USING gin (prodcode extensions.gin_trgm_ops)
WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_product_active_description_trgm
ON public.product USING gin (description extensions.gin_trgm_ops)
WHERE NOT is_deleted;

-- Product active-list sorting index.
CREATE INDEX IF NOT EXISTS idx_product_active_description
ON public.product (description)
WHERE NOT is_deleted;
