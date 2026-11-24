CREATE UNIQUE INDEX IF NOT EXISTS pricehist_active_prodcode_effdate_key
ON public.pricehist (prodcode, effdate)
WHERE is_deleted = false;

CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    actor_id UUID REFERENCES auth.users(id),
    details JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE VIEW public.product_current_price
WITH (security_invoker = true) AS
SELECT DISTINCT ON (prodcode)
    prodcode,
    unitprice,
    effdate
FROM public.pricehist
WHERE is_deleted = false
  AND effdate <= CURRENT_DATE
ORDER BY prodcode, effdate DESC;

GRANT SELECT ON public.product_current_price TO authenticated;

CREATE OR REPLACE FUNCTION public.audit_customer_product_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_before JSONB;
    v_after JSONB;
    v_row JSONB;
    v_entity_type TEXT;
    v_entity_id TEXT;
    v_action TEXT := lower(TG_OP);
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'An authenticated user is required for this change.'
            USING ERRCODE = '42501';
    END IF;

    IF TG_OP <> 'INSERT' THEN
        v_before := to_jsonb(OLD);
    END IF;
    IF TG_OP <> 'DELETE' THEN
        v_after := to_jsonb(NEW);
    END IF;
    v_row := COALESCE(v_after, v_before);

    CASE TG_TABLE_NAME
        WHEN 'customer' THEN
            v_entity_type := 'customer';
            v_entity_id := v_row ->> 'custno';
        WHEN 'product' THEN
            v_entity_type := 'product';
            v_entity_id := v_row ->> 'prodcode';
        WHEN 'pricehist' THEN
            v_entity_type := 'product_price';
            v_entity_id := concat_ws(
                ':',
                v_row ->> 'prodcode',
                COALESCE(v_after ->> 'effdate', v_before ->> 'effdate')
            );
        ELSE
            RAISE EXCEPTION 'Unsupported audit table: %', TG_TABLE_NAME;
    END CASE;

    IF TG_OP = 'UPDATE' THEN
        IF v_before ->> 'is_deleted' = 'false'
            AND v_after ->> 'is_deleted' = 'true' THEN
            v_action := 'delete';
        ELSIF v_before ->> 'is_deleted' = 'true'
            AND v_after ->> 'is_deleted' = 'false' THEN
            v_action := 'restore';
        END IF;
    END IF;

    INSERT INTO public.audit_log (
        entity_type,
        entity_id,
        action,
        actor_id,
        details
    ) VALUES (
        v_entity_type,
        v_entity_id,
        v_action,
        auth.uid(),
        jsonb_build_object('before', v_before, 'after', v_after)
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_customer_product_change()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS customer_audit_changes ON public.customer;
CREATE TRIGGER customer_audit_changes
AFTER INSERT OR UPDATE OR DELETE ON public.customer
FOR EACH ROW
EXECUTE FUNCTION public.audit_customer_product_change();

DROP TRIGGER IF EXISTS product_audit_changes ON public.product;
CREATE TRIGGER product_audit_changes
AFTER INSERT OR UPDATE OR DELETE ON public.product
FOR EACH ROW
EXECUTE FUNCTION public.audit_customer_product_change();

DROP TRIGGER IF EXISTS pricehist_audit_changes ON public.pricehist;
CREATE TRIGGER pricehist_audit_changes
AFTER INSERT OR UPDATE OR DELETE ON public.pricehist
FOR EACH ROW
EXECUTE FUNCTION public.audit_customer_product_change();
