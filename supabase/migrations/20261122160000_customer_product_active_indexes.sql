-- Issue #75: Customer and Product active views and indexes
-- Existing active views are preserved.

-- Enable trigram support for partial text searches (ILIKE).
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Customer indexes: active rows only.
CREATE INDEX IF NOT EXISTS idx_customer_active_name_trgm
ON public.customer USING gin (custname extensions.gin_trgm_ops)
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_customer_active_custno_trgm
ON public.customer USING gin (custno extensions.gin_trgm_ops)
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_customer_active_name
ON public.customer (custname)
WHERE is_deleted = false;

-- Product indexes: active rows only.
CREATE INDEX IF NOT EXISTS idx_product_active_description_trgm
ON public.product USING gin (description extensions.gin_trgm_ops)
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_product_active_prodcode_trgm
ON public.product USING gin (prodcode extensions.gin_trgm_ops)
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_product_active_description
ON public.product (description)
WHERE is_deleted = false;

-- Customer active view
CREATE OR REPLACE VIEW public.customer_active AS
SELECT
    custno,
    custname,
    address,
    payterm,
    is_deleted,
    stamp
FROM public.customer
WHERE is_deleted = false;

-- Product active view
CREATE OR REPLACE VIEW public.product_active AS
SELECT
    prodcode,
    description,
    unit,
    is_deleted,
    stamp
FROM public.product
WHERE is_deleted = false;
