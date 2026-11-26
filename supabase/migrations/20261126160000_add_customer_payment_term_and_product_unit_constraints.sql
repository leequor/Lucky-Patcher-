BEGIN;

-- Temporarily remove dependent views so column types can be changed.
DROP VIEW public.customer_active;
DROP VIEW public.product_active;

-- S2-DBA-03: Standardize and validate customer payment terms
-- and product units.

-- 1. Remove existing constraints before converting legacy values.
ALTER TABLE public.customer
DROP CONSTRAINT IF EXISTS pay_ck;

ALTER TABLE public.product
DROP CONSTRAINT IF EXISTS unit_ck;

-- Increase column lengths to support standardized values.
ALTER TABLE public.customer
ALTER COLUMN payterm TYPE VARCHAR(20);

ALTER TABLE public.product
ALTER COLUMN unit TYPE VARCHAR(20);

-- 2. Convert existing customer payment terms.
UPDATE public.customer
SET payterm = CASE payterm
    WHEN '30D' THEN 'Net 30'
    WHEN '45D' THEN 'Net 45'
    ELSE payterm
END
WHERE payterm IN ('30D', '45D');

-- 3. Convert existing product unit abbreviations.
UPDATE public.product
SET unit = CASE unit
    WHEN 'ea' THEN 'each'
    WHEN 'pc' THEN 'piece'
    WHEN 'mtr' THEN 'meter'
    WHEN 'pkg' THEN 'pack'
    WHEN 'ltr' THEN 'liter'
    ELSE unit
END
WHERE unit IN ('ea', 'pc', 'mtr', 'pkg', 'ltr');

ALTER TABLE public.customer
DROP CONSTRAINT IF EXISTS customer_payterm_check;

-- 4. Add the new payment-term validation constraint.
-- NULL remains allowed because payment terms are optional.
ALTER TABLE public.customer
ADD CONSTRAINT customer_payterm_check
CHECK (
    payterm IN ('Net 30', 'Net 45', 'COD', 'Prepaid')
);

-- 5. Require a product unit.
ALTER TABLE public.product
ALTER COLUMN unit SET NOT NULL;

ALTER TABLE public.product
DROP CONSTRAINT IF EXISTS product_unit_check;

-- 6. Add the new product-unit validation constraint.
ALTER TABLE public.product
ADD CONSTRAINT product_unit_check
CHECK (
    unit IN (
        'each',
        'piece',
        'box',
        'pack',
        'set',
        'pair',
        'kg',
        'g',
        'liter',
        'meter',
        'roll'
    )
);

-- 7. Document the validation rules.
COMMENT ON CONSTRAINT customer_payterm_check
ON public.customer IS
'Allows Net 30, Net 45, COD, or Prepaid. NULL is allowed.';

COMMENT ON CONSTRAINT product_unit_check
ON public.product IS
'Restricts product units to the approved application unit list.';

-- Recreate customer_active with its original definition.
CREATE VIEW public.customer_active
WITH (security_invoker = true)
AS
SELECT
    custno,
    custname,
    address,
    payterm,
    is_deleted,
    stamp
FROM public.customer
WHERE is_deleted = false;

-- Recreate product_active with its original definition.
CREATE VIEW public.product_active
WITH (security_invoker = true)
AS
SELECT
    prodcode,
    description,
    unit,
    is_deleted,
    stamp
FROM public.product
WHERE is_deleted = false;

-- Restore the original view permissions.
GRANT ALL PRIVILEGES ON public.customer_active
TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON public.product_active
TO anon, authenticated, service_role;

COMMIT;
