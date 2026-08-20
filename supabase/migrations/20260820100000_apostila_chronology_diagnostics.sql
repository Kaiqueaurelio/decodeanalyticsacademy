-- Diagnóstico cronológico, observabilidade do Workbench e alertas preventivos.
-- A validação registra apenas metadados de datas/títulos; nunca persiste o conteúdo integral.

CREATE TABLE IF NOT EXISTS public.apostila_validation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apostila_id uuid NOT NULL REFERENCES public.apostilas(id) ON DELETE CASCADE,
  trigger_source text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'warning', 'error')),
  issue_count integer NOT NULL DEFAULT 0,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apostila_validation_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.apostila_validation_runs(id) ON DELETE CASCADE,
  apostila_id uuid NOT NULL REFERENCES public.apostilas(id) ON DELETE CASCADE,
  page_id uuid NULL,
  severity text NOT NULL CHECK (severity IN ('warning', 'error')),
  code text NOT NULL,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apostila_validation_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES public.apostila_validation_issues(id) ON DELETE CASCADE,
  apostila_id uuid NOT NULL REFERENCES public.apostilas(id) ON DELETE CASCADE,
  severity text NOT NULL CHECK (severity IN ('warning', 'error')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  acknowledged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apostila_operation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL,
  apostila_id uuid NULL REFERENCES public.apostilas(id) ON DELETE SET NULL,
  page_id uuid NULL,
  operation_type text NOT NULL,
  phase text NOT NULL,
  status text NOT NULL CHECK (status IN ('started', 'succeeded', 'failed', 'blocked')),
  affected_record_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  error_code text NULL,
  error_message text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apostila_validation_runs_apostila_created
  ON public.apostila_validation_runs (apostila_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apostila_validation_issues_apostila_status
  ON public.apostila_validation_issues (apostila_id, resolved_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apostila_validation_alerts_open
  ON public.apostila_validation_alerts (status, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apostila_operation_logs_apostila_created
  ON public.apostila_operation_logs (apostila_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apostila_operation_logs_operation
  ON public.apostila_operation_logs (operation_id, created_at);

ALTER TABLE public.apostila_validation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostila_validation_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostila_validation_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostila_operation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view apostila validation runs" ON public.apostila_validation_runs;
CREATE POLICY "Admins can view apostila validation runs"
  ON public.apostila_validation_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view apostila validation issues" ON public.apostila_validation_issues;
CREATE POLICY "Admins can view apostila validation issues"
  ON public.apostila_validation_issues FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update apostila validation issues" ON public.apostila_validation_issues;
CREATE POLICY "Admins can update apostila validation issues"
  ON public.apostila_validation_issues FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view apostila validation alerts" ON public.apostila_validation_alerts;
CREATE POLICY "Admins can view apostila validation alerts"
  ON public.apostila_validation_alerts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update apostila validation alerts" ON public.apostila_validation_alerts;
CREATE POLICY "Admins can update apostila validation alerts"
  ON public.apostila_validation_alerts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view apostila operation logs" ON public.apostila_operation_logs;
CREATE POLICY "Admins can view apostila operation logs"
  ON public.apostila_operation_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.parse_apostila_date(
  _day text,
  _month text,
  _year text
)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $$
BEGIN
  RETURN make_date(_year::integer, _month::integer, _day::integer);
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.run_apostila_chronology_validation_internal(
  _apostila_id uuid,
  _trigger_source text DEFAULT 'manual',
  _created_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_apostila record;
  v_page record;
  v_run_id uuid;
  v_status text := 'ok';
  v_issue_count integer := 0;
  v_error_count integer := 0;
  v_warning_count integer := 0;
  v_alert_count integer := 0;
  v_title_match text[];
  v_date_match text[];
  v_title_date date;
  v_previous_date date;
  v_page_title_date date;
  v_content_dates text[];
  v_page_date text;
  v_page_date_date date;
  v_main_dates text[];
  v_issues jsonb;
BEGIN
  SELECT id, title, content
    INTO v_apostila
    FROM public.apostilas
   WHERE id = _apostila_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'issue_count', 1,
      'issues', jsonb_build_array(jsonb_build_object(
        'code', 'apostila_not_found',
        'severity', 'error',
        'message', 'A apostila informada não existe.'
      ))
    );
  END IF;

  INSERT INTO public.apostila_validation_runs (apostila_id, trigger_source, status, created_by)
  VALUES (_apostila_id, coalesce(nullif(_trigger_source, ''), 'manual'), 'ok', _created_by)
  RETURNING id INTO v_run_id;

  v_title_match := regexp_match(coalesce(v_apostila.title, ''), '([0-3][0-9])[/.-]([0-1][0-9])[/.-]((19|20)[0-9]{2})');
  IF v_title_match IS NOT NULL THEN
    v_title_date := public.parse_apostila_date(v_title_match[1], v_title_match[2], v_title_match[3]);
  END IF;

  v_main_dates := ARRAY(
    SELECT DISTINCT to_char(public.parse_apostila_date(m[1], m[2], m[3]), 'YYYY-MM-DD')
      FROM regexp_matches(coalesce(v_apostila.content, ''), '([0-3][0-9])[/.-]([0-1][0-9])[/.-]((19|20)[0-9]{2})', 'g') AS m
     WHERE public.parse_apostila_date(m[1], m[2], m[3]) IS NOT NULL
  );

  IF cardinality(v_main_dates) > 1 THEN
    INSERT INTO public.apostila_validation_issues (run_id, apostila_id, severity, code, message, metadata)
    VALUES (
      v_run_id, _apostila_id, 'error', 'main_content_multiple_dates',
      'O conteúdo principal contém mais de uma data de aula e pode estar misturando encontros.',
      jsonb_build_object('detected_dates', v_main_dates, 'title', v_apostila.title)
    );
    v_issue_count := v_issue_count + 1;
    v_error_count := v_error_count + 1;
  END IF;

  IF v_title_date IS NOT NULL AND EXISTS (
    SELECT 1 FROM unnest(v_main_dates) AS d(value)
    WHERE to_date(value, 'YYYY-MM-DD') <> v_title_date
  ) THEN
    INSERT INTO public.apostila_validation_issues (run_id, apostila_id, severity, code, message, metadata)
    VALUES (
      v_run_id, _apostila_id, 'error', 'main_title_content_date_mismatch',
      'A data do título da apostila não corresponde a todas as datas encontradas no conteúdo principal.',
      jsonb_build_object('title_date', v_title_date, 'detected_dates', v_main_dates, 'title', v_apostila.title)
    );
    v_issue_count := v_issue_count + 1;
    v_error_count := v_error_count + 1;
  END IF;

  v_previous_date := NULL;
  FOR v_page IN
    SELECT id, title, content, position
      FROM public.apostila_pages
     WHERE apostila_id = _apostila_id
     ORDER BY position ASC, created_at ASC, id ASC
  LOOP
    v_page_title_date := NULL;
    v_title_match := regexp_match(coalesce(v_page.title, ''), '([0-3][0-9])[/.-]([0-1][0-9])[/.-]((19|20)[0-9]{2})');
    IF v_title_match IS NOT NULL THEN
      v_page_title_date := public.parse_apostila_date(v_title_match[1], v_title_match[2], v_title_match[3]);
    END IF;

    v_content_dates := ARRAY(
      SELECT DISTINCT to_char(public.parse_apostila_date(m[1], m[2], m[3]), 'YYYY-MM-DD')
        FROM regexp_matches(coalesce(v_page.content, ''), '([0-3][0-9])[/.-]([0-1][0-9])[/.-]((19|20)[0-9]{2})', 'g') AS m
       WHERE public.parse_apostila_date(m[1], m[2], m[3]) IS NOT NULL
    );

    IF v_page_title_date IS NULL AND cardinality(v_content_dates) > 0 THEN
      INSERT INTO public.apostila_validation_issues (run_id, apostila_id, page_id, severity, code, message, metadata)
      VALUES (
        v_run_id, _apostila_id, v_page.id, 'warning', 'page_title_missing_date',
        'A página contém uma data de aula no conteúdo, mas o título não informa a data.',
        jsonb_build_object('content_dates', v_content_dates, 'page_title', v_page.title, 'position', v_page.position)
      );
      v_issue_count := v_issue_count + 1;
      v_warning_count := v_warning_count + 1;
    END IF;

    IF cardinality(v_content_dates) > 1 THEN
      INSERT INTO public.apostila_validation_issues (run_id, apostila_id, page_id, severity, code, message, metadata)
      VALUES (
        v_run_id, _apostila_id, v_page.id, 'error', 'page_content_multiple_dates',
        'Uma única página contém múltiplas datas de aula; a separação por encontro deve ser revisada.',
        jsonb_build_object('content_dates', v_content_dates, 'page_title', v_page.title, 'position', v_page.position)
      );
      v_issue_count := v_issue_count + 1;
      v_error_count := v_error_count + 1;
    END IF;

    IF v_page_title_date IS NOT NULL AND EXISTS (
      SELECT 1 FROM unnest(v_content_dates) AS d(value)
      WHERE to_date(value, 'YYYY-MM-DD') <> v_page_title_date
    ) THEN
      INSERT INTO public.apostila_validation_issues (run_id, apostila_id, page_id, severity, code, message, metadata)
      VALUES (
        v_run_id, _apostila_id, v_page.id, 'error', 'page_title_content_date_mismatch',
        'A data do título da página não corresponde às datas encontradas no conteúdo.',
        jsonb_build_object('title_date', v_page_title_date, 'content_dates', v_content_dates, 'page_title', v_page.title, 'position', v_page.position)
      );
      v_issue_count := v_issue_count + 1;
      v_error_count := v_error_count + 1;
    END IF;

    IF v_page_title_date IS NOT NULL AND v_previous_date IS NOT NULL AND v_page_title_date < v_previous_date THEN
      INSERT INTO public.apostila_validation_issues (run_id, apostila_id, page_id, severity, code, message, metadata)
      VALUES (
        v_run_id, _apostila_id, v_page.id, 'error', 'page_dates_out_of_order',
        'As páginas estão fora da ordem cronológica de suas aulas.',
        jsonb_build_object('previous_date', v_previous_date, 'current_date', v_page_title_date, 'page_title', v_page.title, 'position', v_page.position)
      );
      v_issue_count := v_issue_count + 1;
      v_error_count := v_error_count + 1;
    END IF;

    IF v_page_title_date IS NOT NULL THEN
      v_previous_date := v_page_title_date;
    ELSIF cardinality(v_content_dates) = 1 THEN
      v_page_date := v_content_dates[1];
      v_page_date_date := public.parse_apostila_date(split_part(v_page_date, '-', 3), split_part(v_page_date, '-', 2), split_part(v_page_date, '-', 1));
      IF v_previous_date IS NOT NULL AND v_page_date_date < v_previous_date THEN
        INSERT INTO public.apostila_validation_issues (run_id, apostila_id, page_id, severity, code, message, metadata)
        VALUES (
          v_run_id, _apostila_id, v_page.id, 'error', 'page_content_dates_out_of_order',
          'A data detectada no conteúdo está fora da ordem cronológica das páginas.',
          jsonb_build_object('previous_date', v_previous_date, 'current_date', v_page_date_date, 'page_title', v_page.title, 'position', v_page.position)
        );
        v_issue_count := v_issue_count + 1;
        v_error_count := v_error_count + 1;
      END IF;
      v_previous_date := v_page_date_date;
    END IF;
  END LOOP;

  IF v_error_count > 0 THEN
    v_status := 'error';
  ELSIF v_warning_count > 0 THEN
    v_status := 'warning';
  END IF;

  INSERT INTO public.apostila_validation_alerts (issue_id, apostila_id, severity)
  SELECT i.id, i.apostila_id, i.severity
    FROM public.apostila_validation_issues i
   WHERE i.run_id = v_run_id
     AND NOT EXISTS (
       SELECT 1
         FROM public.apostila_validation_alerts a
         JOIN public.apostila_validation_issues previous_issue ON previous_issue.id = a.issue_id
        WHERE a.apostila_id = i.apostila_id
          AND a.status = 'open'
          AND previous_issue.code = i.code
          AND previous_issue.page_id IS NOT DISTINCT FROM i.page_id
     );
  GET DIAGNOSTICS v_alert_count = ROW_COUNT;

  UPDATE public.apostila_validation_runs
     SET status = v_status,
         issue_count = v_issue_count,
         evidence = jsonb_build_object(
           'error_count', v_error_count,
           'warning_count', v_warning_count,
           'alert_count', v_alert_count,
           'main_dates', coalesce(v_main_dates, ARRAY[]::text[])
         )
   WHERE id = v_run_id;

  SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.created_at), '[]'::jsonb)
    INTO v_issues
    FROM public.apostila_validation_issues i
   WHERE i.run_id = v_run_id;

  RETURN jsonb_build_object(
    'run_id', v_run_id,
    'apostila_id', _apostila_id,
    'status', v_status,
    'issue_count', v_issue_count,
    'error_count', v_error_count,
    'warning_count', v_warning_count,
    'alert_count', v_alert_count,
    'issues', v_issues
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.run_apostila_chronology_validation(
  _apostila_id uuid,
  _trigger_source text DEFAULT 'manual'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem validar a cronologia de apostilas.' USING ERRCODE = '42501';
  END IF;

  RETURN public.run_apostila_chronology_validation_internal(_apostila_id, _trigger_source, auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.record_apostila_operation(
  _operation_id uuid DEFAULT gen_random_uuid(),
  _apostila_id uuid DEFAULT NULL,
  _page_id uuid DEFAULT NULL,
  _operation_type text DEFAULT 'unknown',
  _phase text DEFAULT 'unknown',
  _status text DEFAULT 'started',
  _affected_record_ids uuid[] DEFAULT '{}'::uuid[],
  _error_code text DEFAULT NULL,
  _error_message text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem registrar operações do Workbench.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.apostila_operation_logs (
    operation_id, apostila_id, page_id, operation_type, phase, status,
    affected_record_ids, error_code, error_message, metadata, user_id
  ) VALUES (
    coalesce(_operation_id, gen_random_uuid()), _apostila_id, _page_id,
    coalesce(nullif(_operation_type, ''), 'unknown'),
    coalesce(nullif(_phase, ''), 'unknown'),
    coalesce(nullif(_status, ''), 'started'),
    coalesce(_affected_record_ids, '{}'::uuid[]), _error_code, _error_message,
    coalesce(_metadata, '{}'::jsonb), auth.uid()
  );

  RETURN _operation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_apostila_validation_dashboard(_limit integer DEFAULT 100)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limit integer := greatest(1, least(coalesce(_limit, 100), 500));
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem consultar o diagnóstico de apostilas.' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'summary', jsonb_build_object(
      'total_runs', (SELECT count(*) FROM public.apostila_validation_runs),
      'last_run_at', (SELECT max(created_at) FROM public.apostila_validation_runs),
      'open_alerts', (SELECT count(*) FROM public.apostila_validation_alerts WHERE status = 'open'),
      'open_errors', (SELECT count(*) FROM public.apostila_validation_alerts WHERE status = 'open' AND severity = 'error'),
      'apostilas_with_open_alerts', (SELECT count(DISTINCT apostila_id) FROM public.apostila_validation_alerts WHERE status = 'open')
    ),
    'recent_runs', coalesce((
      SELECT jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC)
        FROM (
          SELECT r.*, a.title AS apostila_title
            FROM public.apostila_validation_runs r
            JOIN public.apostilas a ON a.id = r.apostila_id
           ORDER BY r.created_at DESC
           LIMIT v_limit
        ) r
    ), '[]'::jsonb),
    'open_alerts', coalesce((
      SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC)
        FROM (
          SELECT al.*, a.title AS apostila_title, i.page_id, i.code, i.message, i.metadata
            FROM public.apostila_validation_alerts al
            JOIN public.apostilas a ON a.id = al.apostila_id
            JOIN public.apostila_validation_issues i ON i.id = al.issue_id
           WHERE al.status = 'open'
           ORDER BY al.created_at DESC
           LIMIT v_limit
        ) x
    ), '[]'::jsonb),
    'operation_logs', coalesce((
      SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC)
        FROM (
          SELECT l.*, a.title AS apostila_title
            FROM public.apostila_operation_logs l
            LEFT JOIN public.apostilas a ON a.id = l.apostila_id
           ORDER BY l.created_at DESC
           LIMIT v_limit
        ) x
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_apostila_chronology_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.run_apostila_chronology_validation_internal(NEW.apostila_id, 'db_trigger', NULL);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apostilas_chronology_validation ON public.apostilas;
CREATE TRIGGER apostilas_chronology_validation
  AFTER INSERT OR UPDATE OF title, content, category ON public.apostilas
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_apostila_chronology_validation();

DROP TRIGGER IF EXISTS apostila_pages_chronology_validation ON public.apostila_pages;
CREATE TRIGGER apostila_pages_chronology_validation
  AFTER INSERT OR UPDATE OF title, content, position, apostila_id ON public.apostila_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_apostila_chronology_validation();

GRANT EXECUTE ON FUNCTION public.run_apostila_chronology_validation(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_apostila_operation(uuid, uuid, uuid, text, text, text, uuid[], text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_apostila_validation_dashboard(integer) TO authenticated;
REVOKE ALL ON FUNCTION public.run_apostila_chronology_validation_internal(uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trigger_apostila_chronology_validation() FROM PUBLIC;
