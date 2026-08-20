-- Atualizar a RPC para suportar dry_run e conteúdo customizado
CREATE OR REPLACE FUNCTION public.split_apostila_by_date(
    _apostila_id uuid,
    _dry_run boolean DEFAULT false,
    _content_override text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_content text;
    v_pages_json jsonb := '[]'::jsonb;
    v_block text;
    v_date text;
    v_title text;
    v_pos int := 10;
    v_count int := 0;
    v_dates text[] := '{}';
BEGIN
    -- 1. Obter conteúdo
    IF _content_override IS NOT NULL THEN
        v_content := _content_override;
    ELSE
        SELECT content INTO v_content FROM public.apostilas WHERE id = _apostila_id;
    END IF;

    IF v_content IS NULL OR v_content = '' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Conteúdo vazio');
    END IF;

    -- 2. Separar blocos por marcadores de data
    -- Padrão esperado: ### **Dia: DD/MM/AAAA ou ## **Aula: DD/MM/AAAA
    FOR v_block IN SELECT unnest(regexp_split_to_array(v_content, '(?=###\s*\*\*Dia:)|(?=##\s*\*\*Aula:)')) LOOP
        IF v_block ~ '(\d{2}/\d{2}/\d{4})' THEN
            v_date := (regexp_matches(v_block, '(\d{2}/\d{2}/\d{4})'))[1];
            v_title := 'Aula - ' || v_date;
            
            IF NOT (v_date = ANY(v_dates)) THEN
                v_dates := v_dates || v_date;
            END IF;

            IF _dry_run THEN
                v_pages_json := v_pages_json || jsonb_build_object(
                    'title', v_title,
                    'content', trim(v_block),
                    'date', v_date
                );
            ELSE
                INSERT INTO public.apostila_pages (apostila_id, title, content, position)
                VALUES (_apostila_id, v_title, trim(v_block), v_pos);
                v_pos := v_pos + 10;
            END IF;
            
            v_count := v_count + 1;
        END IF;
    END LOOP;

    -- 3. Se não for dry_run e houve criação, limpar a apostila principal e logs
    IF NOT _dry_run AND v_count > 0 THEN
        UPDATE public.apostilas 
        SET content = 'Conteúdo segmentado em páginas.',
            status = 'liberada',
            updated_at = now()
        WHERE id = _apostila_id;

        INSERT INTO public.audit_logs (event_type, resource_id, metadata)
        VALUES ('apostila_content_split', _apostila_id, jsonb_build_object('pages_created', v_count, 'dates', v_dates));
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'pages_created', v_count,
        'dates', v_dates,
        'preview', CASE WHEN _dry_run THEN v_pages_json ELSE NULL END
    );
END;
$$;
