CREATE TABLE IF NOT EXISTS public.department (
    deptcode TEXT PRIMARY KEY,
    deptname TEXT NOT NULL,
    description TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    stamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.department ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.department TO authenticated;
GRANT SELECT ON public.department_active TO authenticated;

CREATE POLICY "Department viewers can read departments"
ON public.department
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
          AND users.role IN ('superadmin', 'admin')
    )
    OR EXISTS (
        SELECT 1 FROM public.user_rights
        WHERE user_rights.user_id = auth.uid()
          AND user_rights.right_code = 'departments.view'
    )
);

CREATE POLICY "Department adders can insert departments"
ON public.department
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
          AND users.role IN ('superadmin', 'admin')
    )
    OR EXISTS (
        SELECT 1 FROM public.user_rights
        WHERE user_rights.user_id = auth.uid()
          AND user_rights.right_code = 'departments.add'
    )
);

CREATE POLICY "Department editors can update departments"
ON public.department
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
          AND users.role IN ('superadmin', 'admin')
    )
    OR EXISTS (
        SELECT 1 FROM public.user_rights
        WHERE user_rights.user_id = auth.uid()
          AND user_rights.right_code = 'departments.edit'
    )
);

CREATE OR REPLACE VIEW public.department_active
WITH (security_invoker = true) AS
SELECT deptcode, deptname, description, is_deleted, stamp
FROM public.department
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_department_active_deptcode
ON public.department (deptcode)
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_department_active_deptname
ON public.department (deptname)
WHERE is_deleted = false;

CREATE OR REPLACE FUNCTION public.soft_delete_department(p_department_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_department public.department;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'An authenticated user is required.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.department
    SET is_deleted = true, stamp = NOW()
    WHERE deptcode = p_department_id
      AND is_deleted = false
    RETURNING * INTO v_department;

    IF v_department.deptcode IS NULL THEN
        RETURN jsonb_build_object('success', false, 'code', 'not_found');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'department',
        jsonb_build_object(
            'id', v_department.deptcode,
            'code', v_department.deptcode,
            'name', v_department.deptname,
            'description', v_department.description,
            'is_deleted', v_department.is_deleted,
            'stamp', v_department.stamp
        )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_department(p_department_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_department public.department;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'An authenticated user is required.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.department
    SET is_deleted = false, stamp = NOW()
    WHERE deptcode = p_department_id
      AND is_deleted = true
    RETURNING * INTO v_department;

    IF v_department.deptcode IS NULL THEN
        RETURN jsonb_build_object('success', false, 'code', 'not_found');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'department',
        jsonb_build_object(
            'id', v_department.deptcode,
            'code', v_department.deptcode,
            'name', v_department.deptname,
            'description', v_department.description,
            'is_deleted', v_department.is_deleted,
            'stamp', v_department.stamp
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_department(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.restore_department(TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.soft_delete_department(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_department(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.audit_department_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_before JSONB;
    v_after JSONB;
    v_action TEXT := lower(TG_OP);
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'An authenticated user is required.'
            USING ERRCODE = '42501';
    END IF;

    IF TG_OP <> 'INSERT' THEN
        v_before := to_jsonb(OLD);
    END IF;
    IF TG_OP <> 'DELETE' THEN
        v_after := to_jsonb(NEW);
    END IF;

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
        'department',
        COALESCE(v_after ->> 'deptcode', v_before ->> 'deptcode'),
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

REVOKE ALL ON FUNCTION public.audit_department_change()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS department_audit_changes ON public.department;
CREATE TRIGGER department_audit_changes
AFTER INSERT OR UPDATE OR DELETE ON public.department
FOR EACH ROW
EXECUTE FUNCTION public.audit_department_change();
