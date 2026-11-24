CREATE TABLE IF NOT EXISTS public.product_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    effective_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS product_prices_product_effective_date_key
ON public.product_prices (product_id, effective_date);

CREATE INDEX IF NOT EXISTS product_prices_product_date_idx
ON public.product_prices (product_id, effective_date DESC);

INSERT INTO public.product_prices (product_id, amount, effective_date)
SELECT id, current_price, CURRENT_DATE
FROM public.products
WHERE current_price IS NOT NULL
ON CONFLICT (product_id, effective_date) DO NOTHING;

ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_prices TO authenticated;

CREATE POLICY "Product price viewers can read price rows"
ON public.product_prices
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE users.id = auth.uid()
          AND users.role IN ('admin', 'superadmin')
    )
    OR EXISTS (
        SELECT 1
        FROM public.user_rights
        WHERE user_rights.user_id = auth.uid()
          AND user_rights.right_code = 'products.price.view'
    )
);

CREATE POLICY "Product price editors can add price rows"
ON public.product_prices
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE users.id = auth.uid()
          AND users.role IN ('admin', 'superadmin')
    )
    OR EXISTS (
        SELECT 1
        FROM public.user_rights
        WHERE user_rights.user_id = auth.uid()
          AND user_rights.right_code = 'products.price.add'
    )
);

CREATE POLICY "Product price editors can update price rows"
ON public.product_prices
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE users.id = auth.uid()
          AND users.role IN ('admin', 'superadmin')
    )
    OR EXISTS (
        SELECT 1
        FROM public.user_rights
        WHERE user_rights.user_id = auth.uid()
          AND user_rights.right_code = 'products.price.edit'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE users.id = auth.uid()
          AND users.role IN ('admin', 'superadmin')
    )
    OR EXISTS (
        SELECT 1
        FROM public.user_rights
        WHERE user_rights.user_id = auth.uid()
          AND user_rights.right_code = 'products.price.edit'
    )
);

CREATE POLICY "Product price deleters can delete price rows"
ON public.product_prices
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE users.id = auth.uid()
          AND users.role IN ('admin', 'superadmin')
    )
    OR EXISTS (
        SELECT 1
        FROM public.user_rights
        WHERE user_rights.user_id = auth.uid()
          AND user_rights.right_code = 'products.price.delete'
    )
);

CREATE OR REPLACE FUNCTION public.refresh_product_current_price(p_product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_current_price NUMERIC(12, 2);
BEGIN
    PERFORM 1
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    SELECT amount INTO v_current_price
    FROM public.product_prices
    WHERE product_id = p_product_id
      AND effective_date <= CURRENT_DATE
    ORDER BY effective_date DESC
    LIMIT 1;

    UPDATE public.products
    SET current_price = v_current_price
    WHERE id = p_product_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_product_current_price_from_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.refresh_product_current_price(OLD.product_id);
        RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.product_id IS DISTINCT FROM NEW.product_id THEN
        PERFORM public.refresh_product_current_price(OLD.product_id);
    END IF;
    PERFORM public.refresh_product_current_price(NEW.product_id);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_product_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_product_id UUID;
    v_price_id UUID;
    v_details JSONB;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'An authenticated user is required to change product prices.'
            USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'INSERT' THEN
        v_product_id := NEW.product_id;
        v_price_id := NEW.id;
        v_details := jsonb_build_object('after', to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        v_product_id := NEW.product_id;
        v_price_id := NEW.id;
        v_details := jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW));
    ELSE
        v_product_id := OLD.product_id;
        v_price_id := OLD.id;
        v_details := jsonb_build_object('before', to_jsonb(OLD));
    END IF;

    INSERT INTO public.audit_log (entity_type, entity_id, action, actor_id, details)
    VALUES (
        'product_price',
        v_price_id::TEXT,
        lower(TG_OP),
        auth.uid(),
        jsonb_build_object('product_id', v_product_id, 'price', v_details)
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_product_price_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.current_price IS NOT NULL THEN
        INSERT INTO public.product_prices (product_id, amount, effective_date)
        VALUES (NEW.id, NEW.current_price, CURRENT_DATE);
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_product_current_price(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_product_current_price_from_history() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_product_price_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.seed_product_price_history() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS product_prices_sync_current_price ON public.product_prices;
CREATE TRIGGER product_prices_sync_current_price
AFTER INSERT OR UPDATE OR DELETE ON public.product_prices
FOR EACH ROW
EXECUTE FUNCTION public.sync_product_current_price_from_history();

DROP TRIGGER IF EXISTS product_prices_write_audit ON public.product_prices;
CREATE TRIGGER product_prices_write_audit
AFTER INSERT OR UPDATE OR DELETE ON public.product_prices
FOR EACH ROW
EXECUTE FUNCTION public.audit_product_price_change();

DROP TRIGGER IF EXISTS products_seed_initial_price ON public.products;
CREATE TRIGGER products_seed_initial_price
AFTER INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.seed_product_price_history();
