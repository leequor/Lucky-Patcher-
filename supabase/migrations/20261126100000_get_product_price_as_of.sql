
-- Return the latest active product price effective on or before a given date.
-- Returns zero rows when no price applies yet.

CREATE OR REPLACE FUNCTION public.get_product_price_as_of(
    p_prodcode VARCHAR,
    p_as_of_date DATE
)
RETURNS TABLE (
    prodcode VARCHAR,
    unitprice NUMERIC,
    effdate DATE
)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
    SELECT
        ph.prodcode,
        ph.unitprice,
        ph.effdate
    FROM public.pricehist AS ph
    WHERE ph.prodcode = p_prodcode
      AND ph.effdate <= p_as_of_date
      AND ph.is_deleted = false
    ORDER BY ph.effdate DESC
    LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.get_product_price_as_of(VARCHAR, DATE)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_product_price_as_of(VARCHAR, DATE)
TO authenticated;
