-- Ferramentas administrativas para separar conteúdo importado por data de aula.
-- A operação é transacional, idempotente e preserva o conteúdo original em apostila_versions.

CREATE OR REPLACE FUNCTION public.separate_apostila_pages_by_date(
  _apostila_id uuid,
  _user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_apostila record;
  v_line text;
  v_lines text[];
  v_dates text[];
  v_date_match text[];
  v_titles text[] := ARRAY[]::text[];
  v_contents text[] := ARRAY[]::text[];
  v_section_dates date[] := ARRAY[]::date[];
  v_preamble text := '';
  v_current_title text := '';
  v_current_content text := '';
  v_current_date date;
  v_section_count integer := 0;
  v_created_ids uuid[] := ARRAY[]::uuid[];
  v_reused_ids uuid[] := ARRAY[]::uuid[];
  v_existing_id uuid;
  v_next_position integer;
  v_section_content text;
  v_page_title text;
  v_index integer;
  v_has_anchor boolean;
  v_actor_id uuid := auth.uid();
  v_operation_id uuid := gen_random_uuid();
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem separar aulas por data.' USING ERRCODE = '42501';
  END IF;
  IF _user_id IS NOT NULL AND _user_id <> v_actor_id THEN
    RAISE EXCEPTION 'O usuário informado não corresponde à sessão administrativa.' USING ERRCODE = '42501';
  END IF;

  SELECT id, title, content
    INTO v_apostila
    FROM public.apostilas
   WHERE id = _apostila_id
   FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.apostila_operation_logs (operation_id, apostila_id, operation_type, phase, status, error_code, error_message, metadata, user_id)
    VALUES (v_operation_id, _apostila_id, 'apostila_date_separation', 'request', 'failed', 'apostila_not_found', 'A apostila não foi encontrada.', jsonb_build_object('requested_by', v_actor_id), v_actor_id);
    RETURN jsonb_build_object('status', 'error', 'code', 'apostila_not_found');
  END IF;

  INSERT INTO public.apostila_operation_logs (operation_id, apostila_id, operation_type, phase, status, metadata, user_id)
  VALUES (v_operation_id, _apostila_id, 'apostila_date_separation', 'request', 'started', jsonb_build_object('requested_by', v_actor_id), v_actor_id);

  v_lines := string_to_array(replace(coalesce(v_apostila.content, ''), E'\r\n', E'\n'), E'\n');

  FOREACH v_line IN ARRAY v_lines LOOP
    v_date_match := regexp_match(v_line, '([0-3][0-9])[/.-]([01][0-9])[/.-]((19|20)[0-9]{2})');
    v_has_anchor := v_line ~* '^\s*(#{1,6}\s+|aula\b|encontro\b|data\b)';

    IF v_date_match IS NOT NULL AND v_has_anchor THEN
      IF v_current_title <> '' THEN
        v_titles := array_append(v_titles, v_current_title);
        v_contents := array_append(v_contents, btrim(v_current_content));
        v_section_dates := array_append(v_section_dates, v_current_date);
      END IF;

      v_current_title := btrim(regexp_replace(v_line, '^\s*#{1,6}\s*', ''));
      IF v_current_title = '' THEN
        v_current_title := 'Aula - ' || v_date_match[1] || '/' || v_date_match[2] || '/' || v_date_match[3];
      END IF;
      v_current_content := '';
      v_current_date := public.parse_apostila_date(v_date_match[1], v_date_match[2], v_date_match[3]);
    ELSIF v_current_title <> '' THEN
      v_current_content := v_current_content || v_line || E'\n';
    ELSE
      v_preamble := v_preamble || v_line || E'\n';
    END IF;
  END LOOP;

  IF v_current_title <> '' THEN
    v_titles := array_append(v_titles, v_current_title);
    v_contents := array_append(v_contents, btrim(v_current_content));
    v_section_dates := array_append(v_section_dates, v_current_date);
  END IF;

  v_section_count := coalesce(array_length(v_titles, 1), 0);
  v_dates := ARRAY(
    SELECT DISTINCT to_char(d, 'YYYY-MM-DD')
      FROM unnest(v_section_dates) AS d
     WHERE d IS NOT NULL
     ORDER BY 1
  );

  IF v_section_count < 2 THEN
    INSERT INTO public.apostila_operation_logs (operation_id, apostila_id, operation_type, phase, status, error_code, error_message, metadata, user_id)
    VALUES (
      v_operation_id,
      _apostila_id,
      'apostila_date_separation',
      'request',
      'blocked',
      'separation_requires_two_date_sections',
      'Não foram encontradas duas seções ancoradas por data; o conteúdo foi preservado.',
      jsonb_build_object('section_count', v_section_count, 'detected_dates', coalesce(v_dates, ARRAY[]::text[])),
      v_actor_id
    );
    RETURN jsonb_build_object(
      'status', 'blocked',
      'code', 'separation_requires_two_date_sections',
      'section_count', v_section_count,
      'detected_dates', coalesce(v_dates, ARRAY[]::text[]),
      'message', 'Não foram encontradas duas seções ancoradas por data; o conteúdo foi preservado.'
    );
  END IF;

  INSERT INTO public.apostila_versions (apostila_id, title, content, created_by)
  VALUES (_apostila_id, v_apostila.title, coalesce(v_apostila.content, ''), v_actor_id);

  SELECT coalesce(max(position), -1) + 1
    INTO v_next_position
    FROM public.apostila_pages
   WHERE apostila_id = _apostila_id;

  FOR v_index IN 1..v_section_count LOOP
    v_section_content := coalesce(v_contents[v_index], '');
    v_page_title := coalesce(nullif(v_titles[v_index], ''), 'Aula ' || coalesce(to_char(v_section_dates[v_index], 'DD/MM/YYYY'), 'sem data'));

    SELECT p.id
      INTO v_existing_id
      FROM public.apostila_pages p
     WHERE p.apostila_id = _apostila_id
       AND regexp_replace(lower(coalesce(p.content, '')), '\s+', ' ', 'g') =
           regexp_replace(lower(v_section_content), '\s+', ' ', 'g')
     ORDER BY p.position, p.created_at
     LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      v_reused_ids := array_append(v_reused_ids, v_existing_id);
    ELSE
      INSERT INTO public.apostila_pages (apostila_id, title, content, position, created_by)
      VALUES (_apostila_id, v_page_title, v_section_content, v_next_position, v_actor_id)
      RETURNING id INTO v_existing_id;
      v_created_ids := array_append(v_created_ids, v_existing_id);
      v_next_position := v_next_position + 1;
    END IF;

    v_existing_id := NULL;
  END LOOP;

  UPDATE public.apostilas
     SET content = nullif(btrim(v_preamble), ''),
         updated_at = now()
   WHERE id = _apostila_id;

  INSERT INTO public.apostila_operation_logs (operation_id, apostila_id, operation_type, phase, status, affected_record_ids, metadata, user_id)
  VALUES (
    v_operation_id,
    _apostila_id,
    'apostila_date_separation',
    'request',
    'succeeded',
    v_created_ids || v_reused_ids || ARRAY[_apostila_id]::uuid[],
    jsonb_build_object('section_count', v_section_count, 'detected_dates', coalesce(v_dates, ARRAY[]::text[]), 'remaining_content_length', length(nullif(btrim(v_preamble), ''))),
    v_actor_id
  );

  RETURN jsonb_build_object(
    'status', 'succeeded',
    'apostila_id', _apostila_id,
    'section_count', v_section_count,
    'detected_dates', coalesce(v_dates, ARRAY[]::text[]),
    'created_page_ids', to_jsonb(v_created_ids),
    'reused_page_ids', to_jsonb(v_reused_ids),
    'remaining_content_length', length(nullif(btrim(v_preamble), '')),
    'message', 'As seções datadas foram separadas em páginas e o conteúdo original foi versionado.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.separate_apostila_pages_by_date(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.separate_apostila_pages_by_date(uuid, uuid) TO authenticated;
