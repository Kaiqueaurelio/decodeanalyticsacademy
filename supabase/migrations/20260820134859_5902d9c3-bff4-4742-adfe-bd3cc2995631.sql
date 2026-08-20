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
    -- 1. Obter o conteúdo da página 2 (ad3c4196-1a07-46ff-a415-3a5503fb7dac)
    SELECT content INTO v_content FROM public.apostila_pages WHERE id = 'ad3c4196-1a07-46ff-a415-3a5503fb7dac';
    
    -- 2. Tentar o split exato pelo marcador da aula de 20/08
    v_blocks := regexp_split_to_array(v_content, '(?=### \*\*Dia: 20/08/2026\*\*)');
    
    IF cardinality(v_blocks) > 1 THEN
        -- Manter a parte 1 na página 2 (Introdução)
        UPDATE public.apostila_pages 
        SET content = trim(v_blocks[1]),
            title = 'Introdução & Fundamentos'
        WHERE id = 'ad3c4196-1a07-46ff-a415-3a5503fb7dac';

        -- Encontrar a posição máxima atual
        SELECT coalesce(max(position), 0) + 1 INTO v_pos FROM public.apostila_pages WHERE apostila_id = v_apostila_id;

        -- Inserir as novas páginas (Aula de 20/08)
        FOR i IN 2..cardinality(v_blocks) LOOP
            INSERT INTO public.apostila_pages (apostila_id, title, content, position)
            VALUES (v_apostila_id, 'Aula - 20/08/2026 (Modelagem e Gestão)', trim(v_blocks[i]), v_pos);
            v_pos := v_pos + 1;
        END LOOP;
        
        -- Log
        INSERT INTO public.audit_logs (event_type, resource_id, metadata)
        VALUES ('manual_split_20_08', v_apostila_id::text, jsonb_build_object('status', 'success'));
    END IF;
END $$;