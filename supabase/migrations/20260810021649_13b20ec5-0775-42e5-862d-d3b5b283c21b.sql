-- Remove execution grants to public/anon for sensitive SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.check_exercise_answer(uuid, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
REVOKE ALL ON FUNCTION public.get_content_scope(uuid) FROM public, anon;

-- Ensure tira_duvidas hardening is recorded in the prompt's context
-- (tira_duvidas_no_update_policy)
DROP POLICY IF EXISTS "Admins can update tira-duvidas" ON public.tira_duvidas;
CREATE POLICY "Admins can update tira-duvidas"
ON public.tira_duvidas
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Simulado answer leak hardening (similar to exercises)
DROP FUNCTION IF EXISTS public.check_simulado_answer(uuid, text);

CREATE OR REPLACE FUNCTION public.check_simulado_answer(_simulado_id uuid, _exercise_id uuid, _selected_answer text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_correct_answer text;
    v_explanation text;
    v_is_correct boolean;
    v_published boolean;
    v_scope text;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if exercise belongs to simulado and visibility
    -- Note: This assumes a table structure for simulados/exercises
    -- Adjust if the schema is different (e.g., exercises linked to apostilas marked as category='Simulados')
    
    SELECT e.correct_answer, e.explanation, a.published
    INTO v_correct_answer, v_explanation, v_published
    FROM exercises e
    JOIN apostilas a ON e.apostila_id = a.id
    WHERE e.id = _exercise_id AND (a.category = 'Simulados ENEM' OR a.category = 'ENEM');

    IF v_correct_answer IS NULL THEN
        RAISE EXCEPTION 'Simulado exercise not found or access denied';
    END IF;

    v_scope := get_content_scope(auth.uid());
    
    IF NOT has_role(auth.uid(), 'admin') THEN
        IF NOT v_published THEN
            RAISE EXCEPTION 'Simulado not published';
        END IF;
        IF v_scope <> 'enem_only' THEN
            RAISE EXCEPTION 'Access denied: ENEM content only';
        END IF;
    END IF;

    v_is_correct := (lower(trim(_selected_answer)) = lower(trim(v_correct_answer)));

    RETURN json_build_object(
        'is_correct', v_is_correct,
        'correct_answer', v_correct_answer,
        'explanation', v_explanation
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_simulado_answer(uuid, uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.check_simulado_answer(uuid, uuid, text) FROM public, anon;
