ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

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

CREATE OR REPLACE FUNCTION public.soft_delete_product(p_product_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_product public.products%ROWTYPE;
    v_table TEXT;
    v_has_children BOOLEAN := FALSE;
    v_tables TEXT[] := ARRAY[
        'price_history',
        'product_price_history',
        'product_prices',
        'sale_details',
        'sales_details',
        'sale_items',
        'order_items'
    ];
BEGIN
    SELECT * INTO v_product
    FROM public.products
    WHERE id::TEXT = p_product_id;

    IF NOT FOUND OR v_product.deleted_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'code', CASE WHEN NOT FOUND THEN 'not_found' ELSE 'already_deleted' END
        );
    END IF;

    FOREACH v_table IN ARRAY v_tables LOOP
        IF to_regclass('public.' || v_table) IS NOT NULL
           AND EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = v_table
                  AND column_name = 'product_id'
           ) THEN
            EXECUTE format(
                'SELECT EXISTS (SELECT 1 FROM public.%I WHERE product_id::TEXT = $1)',
                v_table
            ) INTO v_has_children USING p_product_id;

            IF v_has_children THEN
                RETURN jsonb_build_object('success', FALSE, 'code', 'active_children');
            END IF;
        END IF;
    END LOOP;

    UPDATE public.products
    SET deleted_at = NOW()
    WHERE id = v_product.id
    RETURNING * INTO v_product;

    INSERT INTO public.audit_log (
        entity_type, entity_id, action, actor_id, details
    ) VALUES (
        'product',
        p_product_id,
        'delete',
        auth.uid(),
        jsonb_build_object('deleted_at', v_product.deleted_at)
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'code', 'deleted',
        'product', to_jsonb(v_product)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_product(p_product_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_product public.products%ROWTYPE;
BEGIN
    SELECT * INTO v_product
    FROM public.products
    WHERE id::TEXT = p_product_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'code', 'not_found');
    END IF;

    UPDATE public.products
    SET deleted_at = NULL
    WHERE id = v_product.id
    RETURNING * INTO v_product;

    INSERT INTO public.audit_log (
        entity_type, entity_id, action, actor_id, details
    ) VALUES (
        'product',
        p_product_id,
        'restore',
        auth.uid(),
        jsonb_build_object('restored_at', NOW())
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'code', 'restored',
        'product', to_jsonb(v_product)
    );
END;
$$;
