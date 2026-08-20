-- Security hardening: exercise-answer audit trail, backend authorization context,
-- and persistent login rate limiting.

CREATE TABLE IF NOT EXISTS public.exercise_answer_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  apostila_id uuid REFERENCES public.apostilas(id) ON DELETE SET NULL,
  access_type text NOT NULL CHECK (access_type IN ('check_answer', 'reveal')),
  allowed boolean NOT NULL,
  returned_fields text[] NOT NULL DEFAULT ARRAY[]::text[],
  denial_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exercise_answer_access_log_user_idx
  ON public.exercise_answer_access_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS exercise_answer_access_log_exercise_idx
  ON public.exercise_answer_access_log(exercise_id, created_at DESC);

ALTER TABLE public.exercise_answer_access_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view exercise answer access log" ON public.exercise_answer_access_log;
CREATE POLICY "Admins view exercise answer access log"
  ON public.exercise_answer_access_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
REVOKE ALL ON public.exercise_answer_access_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.exercise_answer_access_log TO authenticated;
GRANT ALL ON public.exercise_answer_access_log TO service_role;

-- Single source of truth for publication and content-scope checks used by answer RPCs.
CREATE OR REPLACE FUNCTION public.exercise_answer_access_context(_exercise_id uuid)
RETURNS TABLE (
  apostila_id uuid,
  published boolean,
  category text,
  is_admin boolean,
  allowed boolean,
  denial_reason text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scope text;
  v_is_admin boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, false, NULL::text, false, false, 'Not authenticated'::text;
    RETURN;
  END IF;

  SELECT e.apostila_id, a.published, a.category
  INTO apostila_id, published, category
  FROM public.exercises e
  JOIN public.apostilas a ON a.id = e.apostila_id
  WHERE e.id = _exercise_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_is_admin := public.has_role(auth.uid(), 'admin');
  is_admin := v_is_admin;
  v_scope := public.get_content_scope(auth.uid());

  IF v_is_admin THEN
    allowed := true;
    denial_reason := NULL;
  ELSIF NOT published THEN
    allowed := false;
    denial_reason := 'Apostila not published';
  ELSIF v_scope = 'enem_only' AND (category IS NULL OR category NOT IN ('ENEM', 'Simulados ENEM')) THEN
    allowed := false;
    denial_reason := 'Access denied: ENEM only scope';
  ELSIF v_scope = 'full' AND category IN ('ENEM', 'Simulados ENEM') THEN
    allowed := false;
    denial_reason := 'Access denied: University scope';
  ELSE
    allowed := true;
    denial_reason := NULL;
  END IF;

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_exercise_answer_access(
  _exercise_id uuid,
  _access_type text,
  _allowed boolean,
  _returned_fields text[] DEFAULT ARRAY[]::text[],
  _denial_reason text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_apostila_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _access_type NOT IN ('check_answer', 'reveal') THEN
    RAISE EXCEPTION 'Invalid access type';
  END IF;

  SELECT e.apostila_id INTO v_apostila_id
  FROM public.exercises e
  WHERE e.id = _exercise_id;

  INSERT INTO public.exercise_answer_access_log (
    user_id, exercise_id, apostila_id, access_type, allowed,
    returned_fields, denial_reason, metadata
  ) VALUES (
    auth.uid(), _exercise_id, v_apostila_id, _access_type, _allowed,
    COALESCE(_returned_fields, ARRAY[]::text[]), _denial_reason,
    COALESCE(_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.exercise_answer_access_context(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_exercise_answer_access(uuid, text, boolean, text[], text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.exercise_answer_access_context(uuid) TO authenticated;

-- Rebuild both answer-returning RPCs so permission checks happen before any
-- sensitive field is read or returned, and every access is auditable.
-- The previous migration already defined this signature as jsonb; keep that
-- return type so CREATE OR REPLACE remains valid in PostgreSQL.
CREATE OR REPLACE FUNCTION public.check_exercise_answer(
  _exercise_id uuid,
  _selected_answer text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correct_answer text;
  v_explanation text;
  v_is_correct boolean;
  v_ctx record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_ctx
  FROM public.exercise_answer_access_context(_exercise_id);

  IF NOT FOUND OR v_ctx.apostila_id IS NULL THEN
    RAISE EXCEPTION 'Exercise not found';
  END IF;

  IF NOT COALESCE(v_ctx.allowed, false) THEN
    PERFORM public.record_exercise_answer_access(
      _exercise_id, 'check_answer', false, ARRAY[]::text[], v_ctx.denial_reason,
      jsonb_build_object('reason', 'authorization_denied')
    );
    RAISE EXCEPTION '%', COALESCE(v_ctx.denial_reason, 'Access denied');
  END IF;

  SELECT e.correct_answer, e.explanation
  INTO v_correct_answer, v_explanation
  FROM public.exercises e
  WHERE e.id = _exercise_id;

  IF NOT FOUND OR v_correct_answer IS NULL THEN
    RAISE EXCEPTION 'Exercise answer not found';
  END IF;

  v_is_correct := lower(trim(COALESCE(_selected_answer, ''))) = lower(trim(COALESCE(v_correct_answer, '')));

  INSERT INTO public.answers (user_id, exercise_id, selected_answer, is_correct)
  VALUES (auth.uid(), _exercise_id, COALESCE(_selected_answer, ''), v_is_correct)
  ON CONFLICT (user_id, exercise_id) DO UPDATE
  SET selected_answer = EXCLUDED.selected_answer,
      is_correct = EXCLUDED.is_correct;

  PERFORM public.record_exercise_answer_access(
    _exercise_id, 'check_answer', true,
    ARRAY['correct_answer', 'explanation'], NULL,
    jsonb_build_object('is_admin', COALESCE(v_ctx.is_admin, false))
  );

  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'correct_answer', v_correct_answer,
    'explanation', v_explanation
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_exercise_reveal(_exercise_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_answered boolean;
  v_type text;
  v_explanation text;
  v_reference_answer text;
  v_ctx record;
  v_returned_fields text[] := ARRAY[]::text[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_ctx
  FROM public.exercise_answer_access_context(_exercise_id);

  IF NOT FOUND OR v_ctx.apostila_id IS NULL THEN
    RAISE EXCEPTION 'exercise not found';
  END IF;

  IF NOT COALESCE(v_ctx.allowed, false) THEN
    PERFORM public.record_exercise_answer_access(
      _exercise_id, 'reveal', false, ARRAY[]::text[], v_ctx.denial_reason,
      jsonb_build_object('reason', 'authorization_denied')
    );
    RAISE EXCEPTION '%', COALESCE(v_ctx.denial_reason, 'Access denied');
  END IF;

  SELECT COALESCE(e.type, '')
  INTO v_type
  FROM public.exercises e
  WHERE e.id = _exercise_id;

  SELECT EXISTS (
    SELECT 1 FROM public.answers
    WHERE exercise_id = _exercise_id AND user_id = auth.uid()
  ) INTO v_answered;

  IF COALESCE(v_ctx.is_admin, false) OR v_answered OR v_type = 'essay' THEN
    SELECT e.explanation, e.reference_answer
    INTO v_explanation, v_reference_answer
    FROM public.exercises e
    WHERE e.id = _exercise_id;
    v_returned_fields := ARRAY['explanation', 'reference_answer'];
  END IF;

  PERFORM public.record_exercise_answer_access(
    _exercise_id, 'reveal', true, v_returned_fields, NULL,
    jsonb_build_object(
      'is_admin', COALESCE(v_ctx.is_admin, false),
      'answered', COALESCE(v_answered, false)
    )
  );

  RETURN jsonb_build_object(
    'explanation', CASE WHEN 'explanation' = ANY(v_returned_fields) THEN v_explanation ELSE NULL END,
    'reference_answer', CASE WHEN 'reference_answer' = ANY(v_returned_fields) THEN v_reference_answer ELSE NULL END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_exercise_answer(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_exercise_reveal(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_exercise_answer(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_exercise_reveal(uuid) TO authenticated;

-- Persistent login throttling. One row is kept per identifier and per IP so
-- an attacker cannot rotate one dimension without hitting the other.
CREATE TABLE IF NOT EXISTS public.auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_key text,
  key_type text,
  attempts integer NOT NULL DEFAULT 0,
  last_attempt timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_attempts ADD COLUMN IF NOT EXISTS identifier text;
ALTER TABLE public.auth_attempts ADD COLUMN IF NOT EXISTS ip_address text;
ALTER TABLE public.auth_attempts ADD COLUMN IF NOT EXISTS attempt_key text;
ALTER TABLE public.auth_attempts ADD COLUMN IF NOT EXISTS key_type text;
ALTER TABLE public.auth_attempts ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.auth_attempts ADD COLUMN IF NOT EXISTS last_attempt timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.auth_attempts ADD COLUMN IF NOT EXISTS locked_until timestamptz;
ALTER TABLE public.auth_attempts ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

UPDATE public.auth_attempts
SET attempt_key = COALESCE(attempt_key, NULLIF(identifier, ''), NULLIF(ip_address, ''), 'legacy-' || id::text),
    key_type = COALESCE(key_type, CASE WHEN NULLIF(identifier, '') IS NOT NULL THEN 'identifier' ELSE 'ip' END)
WHERE attempt_key IS NULL OR key_type IS NULL;

ALTER TABLE public.auth_attempts ALTER COLUMN attempt_key SET NOT NULL;
ALTER TABLE public.auth_attempts ALTER COLUMN key_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'auth_attempts_key_type_check'
  ) THEN
    ALTER TABLE public.auth_attempts
      ADD CONSTRAINT auth_attempts_key_type_check CHECK (key_type IN ('identifier', 'ip'));
  END IF;
END $$;

DELETE FROM public.auth_attempts a
USING public.auth_attempts b
WHERE a.id < b.id
  AND a.key_type = b.key_type
  AND a.attempt_key = b.attempt_key;

CREATE UNIQUE INDEX IF NOT EXISTS auth_attempts_key_idx
  ON public.auth_attempts(key_type, attempt_key);
CREATE INDEX IF NOT EXISTS auth_attempts_locked_idx
  ON public.auth_attempts(locked_until)
  WHERE locked_until IS NOT NULL;

ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auth_attempts FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.auth_attempts TO service_role;

CREATE OR REPLACE FUNCTION public.auth_rate_limit_check(
  _identifier text,
  _ip_address text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_locked_until timestamptz;
BEGIN
  SELECT MAX(locked_until)
  INTO v_locked_until
  FROM public.auth_attempts
  WHERE (key_type = 'identifier' AND attempt_key = COALESCE(_identifier, ''))
     OR (key_type = 'ip' AND attempt_key = COALESCE(_ip_address, 'unknown'));

  IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'retry_after_seconds', GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_locked_until - now())))::integer)
    );
  END IF;

  RETURN jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.auth_rate_limit_record(
  _identifier text,
  _ip_address text,
  _success boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text;
  v_key text;
  v_current public.auth_attempts%ROWTYPE;
  v_next integer;
  v_lock timestamptz;
  v_identifier text := COALESCE(NULLIF(trim(_identifier), ''), 'unknown');
  v_ip text := COALESCE(NULLIF(trim(_ip_address), ''), 'unknown');
BEGIN
  IF _success THEN
    DELETE FROM public.auth_attempts
    WHERE (key_type = 'identifier' AND attempt_key = v_identifier)
       OR (key_type = 'ip' AND attempt_key = v_ip);
    RETURN jsonb_build_object('success', true, 'locked', false);
  END IF;

  FOREACH v_kind IN ARRAY ARRAY['identifier', 'ip'] LOOP
    v_key := CASE WHEN v_kind = 'identifier' THEN v_identifier ELSE v_ip END;
    SELECT * INTO v_current
    FROM public.auth_attempts
    WHERE key_type = v_kind AND attempt_key = v_key
    FOR UPDATE;

    IF NOT FOUND THEN
      v_next := 1;
      v_lock := NULL;
      INSERT INTO public.auth_attempts (attempt_key, key_type, attempts, last_attempt, locked_until)
      VALUES (v_key, v_kind, v_next, now(), v_lock);
    ELSIF v_current.last_attempt < now() - interval '15 minutes' THEN
      v_next := 1;
      v_lock := NULL;
      UPDATE public.auth_attempts
      SET attempts = v_next, last_attempt = now(), locked_until = v_lock
      WHERE id = v_current.id;
    ELSE
      v_next := v_current.attempts + 1;
      v_lock := CASE
        WHEN v_next >= 5 THEN now() + make_interval(mins => LEAST(60, 5 * power(2, v_next - 5)::integer))
        ELSE NULL
      END;
      UPDATE public.auth_attempts
      SET attempts = v_next, last_attempt = now(), locked_until = v_lock
      WHERE id = v_current.id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', false,
    'locked', v_lock IS NOT NULL,
    'retry_after_seconds', CASE WHEN v_lock IS NULL THEN 0 ELSE GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_lock - now())))::integer) END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.auth_rate_limit_check(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auth_rate_limit_record(text, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_rate_limit_check(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.auth_rate_limit_record(text, text, boolean) TO service_role;

COMMENT ON TABLE public.exercise_answer_access_log IS 'Audit trail of backend answer and explanation access, including denied attempts.';
COMMENT ON TABLE public.auth_attempts IS 'Service-role-only persistent login attempt counters keyed by identifier and IP.';


-- Full admin-only performance dataset used by the PDF exporter. It contains
-- the student's own choices and outcomes, never the correct answer fields.
CREATE OR REPLACE FUNCTION public.get_student_performance_report(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin only';
  END IF;

  WITH agg AS (
    SELECT a.id, a.is_correct, a.created_at, a.selected_answer,
           e.question, e.apostila_id, ap.title AS apostila_title
    FROM public.answers a
    JOIN public.exercises e ON e.id = a.exercise_id
    LEFT JOIN public.apostilas ap ON ap.id = e.apostila_id
    WHERE a.user_id = _user_id
  ),
  totals AS (
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE is_correct)::int AS hits,
           COUNT(*) FILTER (WHERE NOT is_correct)::int AS errors
    FROM agg
  ),
  by_ap AS (
    SELECT apostila_id,
           MAX(apostila_title) AS title,
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE is_correct)::int AS hits,
           COUNT(*) FILTER (WHERE NOT is_correct)::int AS errors,
           MAX(created_at) AS last_at
    FROM agg
    WHERE apostila_id IS NOT NULL
    GROUP BY apostila_id
    ORDER BY last_at DESC
  ),
  profile AS (
    SELECT p.full_name, p.ra, p.email, p.course, p.semester
    FROM public.profiles p
    WHERE p.user_id = _user_id
  )
  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(profile) FROM profile),
    'total', (SELECT total FROM totals),
    'hits', (SELECT hits FROM totals),
    'errors', (SELECT errors FROM totals),
    'accuracy', CASE WHEN (SELECT total FROM totals) > 0
                     THEN ROUND(((SELECT hits FROM totals)::numeric / (SELECT total FROM totals)::numeric) * 100, 1)
                     ELSE 0 END,
    'by_apostila', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'apostila_id', apostila_id,
        'title', title,
        'total', total,
        'hits', hits,
        'errors', errors,
        'accuracy', CASE WHEN total > 0 THEN ROUND((hits::numeric / total::numeric) * 100, 1) ELSE 0 END,
        'last_at', last_at
      ) ORDER BY last_at DESC) FROM by_ap
    ), '[]'::jsonb),
    'history', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'is_correct', is_correct,
        'created_at', created_at,
        'apostila_title', apostila_title,
        'question', question,
        'selected_answer', selected_answer
      ) ORDER BY created_at DESC) FROM agg
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_student_performance_report(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_performance_report(uuid) TO authenticated;
