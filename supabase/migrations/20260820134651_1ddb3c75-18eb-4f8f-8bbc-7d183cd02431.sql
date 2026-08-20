DO $$
DECLARE
    v_apostila_id UUID := 'b132f212-5ede-4522-92d3-b0ead2cd8ce2';
    v_content TEXT;
    v_blocks TEXT[];
    v_block TEXT;
    v_pos INTEGER;
    v_date_match TEXT[];
    v_new_title TEXT;
    v_page_exists BOOLEAN;
BEGIN
    -- 1. Obter o conteúdo da apostila
    SELECT content INTO v_content FROM public.apostilas WHERE id = v_apostila_id;
    
    -- 2. Dividir o conteúdo por marcadores de data
    v_blocks := regexp_split_to_array(v_content, '(?=### \*\*Dia:)|(?=## \*\*Aula:)|(?=\*\*\* \*\*Dia:)');
    
    IF cardinality(v_blocks) > 0 THEN
        -- Limpar páginas vazias ou placeholders (exceto a introdução na pos 1 se ela tiver conteúdo útil)
        DELETE FROM public.apostila_pages WHERE apostila_id = v_apostila_id AND (content IS NULL OR trim(content) = '');
        
        SELECT coalesce(max(position), 0) + 1 INTO v_pos FROM public.apostila_pages WHERE apostila_id = v_apostila_id;

        FOREACH v_block IN ARRAY v_blocks LOOP
            IF length(trim(v_block)) < 50 THEN CONTINUE; END IF;
            
            -- Extrair data para o título
            v_date_match := regexp_match(v_block, '([0-3][0-9])[/.-]([0-1][0-9])[/.-]((19|20)[0-9]{2})');
            
            IF v_date_match IS NOT NULL THEN
                v_new_title := 'Aula - ' || v_date_match[1] || '/' || v_date_match[2] || '/' || v_date_match[3];
            ELSE
                v_new_title := 'Fragmento de Aula (Data Pendente)';
            END IF;

            -- Verificar se esta página já foi inserida (evitar duplicados se rodar 2x)
            SELECT EXISTS (
                SELECT 1 FROM public.apostila_pages 
                WHERE apostila_id = v_apostila_id 
                AND title = v_new_title 
                AND content = trim(v_block)
            ) INTO v_page_exists;

            IF NOT v_page_exists THEN
                INSERT INTO public.apostila_pages (apostila_id, title, content, position)
                VALUES (v_apostila_id, v_new_title, trim(v_block), v_pos);
                v_pos := v_pos + 1;
            END IF;
        END LOOP;

        -- Marcar a apostila original como segmentada e em manutenção para revisão
        UPDATE public.apostilas 
        SET content = 'Conteúdo segmentado automaticamente por data. Por favor, revise as páginas individuais no Workbench.',
            status = 'em_manutencao'
        WHERE id = v_apostila_id;
        
        -- Log de Auditoria
        INSERT INTO public.audit_logs (event_type, resource_id, metadata)
        VALUES ('apostila_content_split', v_apostila_id::text, jsonb_build_object(
            'apostila_id', v_apostila_id,
            'method', 'regex_split_v2',
            'status', 'success'
        ));
    END IF;
END $$;