-- Adiciona a RPC para separação automática por data
CREATE OR REPLACE FUNCTION public.split_apostila_by_date(_apostila_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_content text;
    v_title text;
    v_user_id uuid;
    v_parts text[];
    v_part text;
    v_date_title text;
    v_pos integer := 0;
    v_created_count integer := 0;
    v_dates_found text[] := '{}';
BEGIN
    -- Busca a apostila
    SELECT title, content, created_by INTO v_title, v_content, v_user_id
    FROM public.apostilas
    WHERE id = _apostila_id;

    IF v_content IS NULL OR v_content = '' THEN
        RETURN json_build_object('success', false, 'message', 'Conteúdo vazio');
    END IF;

    -- Divide o conteúdo usando marcadores comuns de data
    v_parts := regexp_split_to_array(v_content, '(?i)(?=###\s+\*\*Dia:|##\s+\*\*Aula:|###\s+Data:)');

    IF array_length(v_parts, 1) <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'Nenhum marcador de data encontrado para separação');
    END IF;

    -- Limpa páginas existentes para evitar duplicidade na re-separação
    DELETE FROM public.apostila_pages WHERE apostila_id = _apostila_id;

    FOREACH v_part IN ARRAY v_parts
    LOOP
        v_part := trim(v_part);
        IF v_part = '' THEN CONTINUE; END IF;

        -- Tenta extrair a data do início da parte
        v_date_title := substring(v_part from '(?i)(?:###\s+\*\*Dia:|##\s+\*\*Aula:|###\s+Data:)\s*\*?([0-3]\d[/.-][01]\d[/.-](?:19|20)\d{2})');
        
        IF v_date_title IS NULL THEN
            v_date_title := 'Introdução / Geral';
        ELSE
            v_date_title := 'Aula - ' || v_date_title;
            v_dates_found := array_append(v_dates_found, v_date_title);
        END IF;

        INSERT INTO public.apostila_pages (apostila_id, title, content, position, created_by)
        VALUES (_apostila_id, v_date_title, v_part, v_pos, COALESCE(v_user_id, auth.uid()));
        
        v_pos := v_pos + 1;
        v_created_count := v_created_count + 1;
    END LOOP;

    -- Log da operação
    INSERT INTO public.audit_logs (event_type, resource_id, metadata)
    VALUES ('apostila_content_split', _apostila_id, json_build_object('pages_created', v_created_count, 'dates', v_dates_found));

    -- Atualiza status da apostila
    UPDATE public.apostilas SET status = 'liberada' WHERE id = _apostila_id AND status = 'em_manutencao';

    RETURN json_build_object(
        'success', true, 
        'pages_created', v_created_count, 
        'dates', v_dates_found
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.split_apostila_by_date(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.split_apostila_by_date(uuid) TO service_role;
