CREATE TABLE IF NOT EXISTS public.job (
    jobcode TEXT PRIMARY KEY,
    jobtitle TEXT NOT NULL,
    description TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    stamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.job ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job TO authenticated;

CREATE POLICY "Job viewers can read jobs"
ON public.job
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
          AND user_rights.right_code = 'jobs.view'
    )
);

CREATE POLICY "Job adders can insert jobs"
ON public.job
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
          AND user_rights.right_code = 'jobs.add'
    )
);

CREATE POLICY "Job editors can update jobs"
ON public.job
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
          AND user_rights.right_code = 'jobs.edit'
    )
);

CREATE OR REPLACE VIEW public.job_active
WITH (security_invoker = true) AS
SELECT jobcode, jobtitle, description, is_deleted, stamp
FROM public.job
WHERE is_deleted = false;

GRANT SELECT ON public.job_active TO authenticated;

CREATE INDEX IF NOT EXISTS idx_job_active_jobcode
ON public.job (jobcode)
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_job_active_jobtitle
ON public.job (jobtitle)
WHERE is_deleted = false;

CREATE OR REPLACE FUNCTION public.soft_delete_job(p_job_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_job public.job;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'An authenticated user is required.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.job
    SET is_deleted = true, stamp = NOW()
    WHERE jobcode = p_job_id
      AND is_deleted = false
    RETURNING * INTO v_job;

    IF v_job.jobcode IS NULL THEN
        RETURN jsonb_build_object('success', false, 'code', 'not_found');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'job',
        jsonb_build_object(
            'id', v_job.jobcode,
            'code', v_job.jobcode,
            'title', v_job.jobtitle,
            'description', v_job.description,
            'is_deleted', v_job.is_deleted,
            'stamp', v_job.stamp
        )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_job(p_job_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_job public.job;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'An authenticated user is required.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.job
    SET is_deleted = false, stamp = NOW()
    WHERE jobcode = p_job_id
      AND is_deleted = true
    RETURNING * INTO v_job;

    IF v_job.jobcode IS NULL THEN
        RETURN jsonb_build_object('success', false, 'code', 'not_found');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'job',
        jsonb_build_object(
            'id', v_job.jobcode,
            'code', v_job.jobcode,
            'title', v_job.jobtitle,
            'description', v_job.description,
            'is_deleted', v_job.is_deleted,
            'stamp', v_job.stamp
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_job(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.restore_job(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_job(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_job(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.audit_job_change()
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
        'job',
        COALESCE(v_after ->> 'jobcode', v_before ->> 'jobcode'),
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

REVOKE ALL ON FUNCTION public.audit_job_change()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS job_audit_changes ON public.job;
CREATE TRIGGER job_audit_changes
AFTER INSERT OR UPDATE OR DELETE ON public.job
FOR EACH ROW
EXECUTE FUNCTION public.audit_job_change();
