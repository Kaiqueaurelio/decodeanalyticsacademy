DO $$
DECLARE
    v_apostila_id UUID := 'b132f212-5ede-4522-92d3-b0ead2cd8ce2';
    v_content TEXT;
    v_blocks TEXT[];
    v_block TEXT;
    v_pos INTEGER;
    v_date_match TEXT[];
    v_new_title TEXT;
BEGIN
    -- 1. Obter o conteúdo da página 2 (que contém o material misturado de 20/08)
    SELECT content INTO v_content FROM public.apostila_pages WHERE id = 'ad3c4196-1a07-46ff-a415-3a5503fb7dac';
    
    -- 2. Dividir o conteúdo por marcadores de data (especificamente procurando a aula de 20/08)
    v_blocks := regexp_split_to_array(v_content, '(?=### \*\*Dia: 20/08/2026\*\*)');
    
    IF cardinality(v_blocks) > 1 THEN
        -- O primeiro bloco é o conteúdo antes de 20/08 (provavelmente a introdução geral e aula de 19/08)
        -- Atualizamos a página atual com a primeira parte
        UPDATE public.apostila_pages 
        SET content = trim(v_blocks[1]),
            title = 'Introdução & Fundamentos (19/08)'
        WHERE id = 'ad3c4196-1a07-46ff-a415-3a5503fb7dac';

        -- Obter a próxima posição livre
        SELECT coalesce(max(position), 0) + 1 INTO v_pos FROM public.apostila_pages WHERE apostila_id = v_apostila_id;

        -- Inserir os blocos subsequentes como novas páginas
        FOR i IN 2..cardinality(v_blocks) LOOP
            v_block := v_blocks[i];
            IF length(trim(v_block)) < 50 THEN CONTINUE; END IF;
            
            INSERT INTO public.apostila_pages (apostila_id, title, content, position)
            VALUES (v_apostila_id, 'Aula - 20/08/2026 (Modelagem e Gestão)', trim(v_block), v_pos);
            v_pos := v_pos + 1;
        END LOOP;
        
        -- Log de Auditoria
        INSERT INTO public.audit_logs (event_type, resource_id, metadata)
        VALUES ('apostila_content_split_subpage', v_apostila_id::text, jsonb_build_object(
            'source_page_id', 'ad3c4196-1a07-46ff-a415-3a5503fb7dac',
            'blocks_created', cardinality(v_blocks) - 1
        ));
    END IF;
END $$;