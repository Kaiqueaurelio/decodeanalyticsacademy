DO $$
DECLARE
    v_apostila RECORD;
    v_content TEXT;
    v_blocks TEXT[];
    v_block TEXT;
    v_page_id UUID;
    v_pos INTEGER;
    v_date_match TEXT[];
    v_new_title TEXT;
BEGIN
    FOR v_apostila IN 
        SELECT id, title, content 
        FROM public.apostilas 
        WHERE id = 'b132f212-5ede-4522-92d3-b0ead2cd8ce2'
          AND content IS NOT NULL
          AND content ~ '([0-3][0-9])[/.-]([0-1][0-9])[/.-]((19|20)[0-9]{2})'
    LOOP
        v_content := v_apostila.content;
        v_blocks := regexp_split_to_array(v_content, '(?=### \*\*Dia:)|(?=## \*\*Aula:)|(?=\*\*\* \*\*Dia:)');
        
        IF cardinality(v_blocks) > 1 THEN
            -- Obter a maior posição atual para não sobrescrever
            SELECT coalesce(max(position), 0) + 1 INTO v_pos 
            FROM public.apostila_pages 
            WHERE apostila_id = v_apostila.id;

            FOREACH v_block IN ARRAY v_blocks LOOP
                IF length(trim(v_block)) < 50 THEN CONTINUE; END IF;

                v_date_match := regexp_match(v_block, '([0-3][0-9])[/.-]([0-1][0-9])[/.-]((19|20)[0-9]{2})');
                
                IF v_date_match IS NOT NULL THEN
                    v_new_title := 'Aula - ' || v_date_match[1] || '/' || v_date_match[2] || '/' || v_date_match[3];
                ELSE
                    v_new_title := 'Fragmento de Aula (Data Pendente)';
                END IF;

                INSERT INTO public.apostila_pages (apostila_id, title, content, position)
                VALUES (v_apostila.id, v_new_title, trim(v_block), v_pos);

                v_pos := v_pos + 1;
            END LOOP;

            -- Limpa o conteúdo misturado da principal e marca status
            UPDATE public.apostilas 
            SET content = 'Conteúdo segmentado automaticamente por data para evitar misturas. Por favor, revise as páginas geradas no Workbench.',
                status = 'em_manutencao'
            WHERE id = v_apostila.id;
        END IF;
    END LOOP;
END $$;