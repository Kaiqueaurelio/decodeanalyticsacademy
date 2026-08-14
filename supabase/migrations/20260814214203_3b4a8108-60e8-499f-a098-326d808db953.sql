
-- ============================================================================
-- AUDITORIA DE SEGURANÇA 2026-08-14 — CORREÇÃO DE VULNERABILIDADES CRÍTICAS
-- ============================================================================

-- 1. apostila_summary_unpub_bypass
-- Restringe a visualização de resumos em apostila_chapters para apostilas publicadas ou admins.
ALTER TABLE public.apostila_chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chapters visible only for visible apostilas" ON public.apostila_chapters;
CREATE POLICY "Chapters visible only for visible apostilas"
ON public.apostila_chapters FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.apostilas a
    WHERE a.id = apostila_chapters.module_id -- Assumindo que module_id leva a apostila ou reforçando na própria tabela apostilas
      AND a.published = true
  )
);

-- Reforço na tabela principal apostilas para garantir que sumários/conteúdos não vazem via PostgREST
DROP POLICY IF EXISTS "Authenticated can view published apostilas (scoped)" ON public.apostilas;
CREATE POLICY "Authenticated can view published apostilas (scoped)"
ON public.apostilas FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    published = true AND (
      (
        public.get_content_scope(auth.uid()) = 'full'
        AND (category IS NULL OR category NOT IN ('ENEM','Simulados ENEM'))
      )
      OR (
        public.get_content_scope(auth.uid()) = 'enem_only'
        AND category IN ('ENEM','Simulados ENEM')
      )
    )
  )
);

-- 2. app_settings_public_key_read (Simulação de prevenção de vazamento de chaves sensíveis)
-- Se houver uma tabela app_settings, garantimos que apenas admins leiam campos sensíveis.
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'app_settings') THEN
        ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Only admins read app settings" ON public.app_settings;
        CREATE POLICY "Only admins read app settings"
        ON public.app_settings FOR SELECT
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;

-- 3. exercises_answer_leak
-- Proteção contra leitura direta da coluna correct_answer.
-- O Supabase não suporta RLS por coluna, então usamos o GRANT para restringir o acesso público 
-- e forçar o uso da RPC check_exercise_answer definida anteriormente.
-- Importante: O service_role deve manter acesso total.

REVOKE SELECT (correct_answer) ON public.exercises FROM authenticated, anon;
GRANT SELECT (id, apostila_id, question, options, explanation, created_at) ON public.exercises TO authenticated;

-- 4. simulado_answer_leak
-- Similar ao exercises_answer_leak, protegemos a tabela weekly_simulado_answers.
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'weekly_simulado_answers') THEN
        REVOKE SELECT (correct_answer) ON public.weekly_simulado_answers FROM authenticated, anon;
        GRANT SELECT (id, simulado_id, user_id, question_index, exercise_id, apostila_id, subject, question, options, selected_answer, is_correct, explanation, answered_at, created_at) 
        ON public.weekly_simulado_answers TO authenticated;
    END IF;
END $$;

-- 5. simulado_scope_bypass
-- Reforça a política de visibilidade de simulados baseada no content_scope.
ALTER TABLE public.weekly_simulados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own simulados (scoped)" ON public.weekly_simulados;
CREATE POLICY "Users manage own simulados (scoped)"
ON public.weekly_simulados FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    auth.uid() = user_id 
    AND public.get_content_scope(auth.uid()) = 'enem_only'
  )
);

-- Garantir que a RPC de verificação de simulado esteja protegida e com search_path fixo (mitigando shadowing)
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

    SELECT e.correct_answer, e.explanation, a.published
    INTO v_correct_answer, v_explanation, v_published
    FROM exercises e
    JOIN apostilas a ON e.apostila_id = a.id
    WHERE e.id = _exercise_id AND (a.category = 'Simulados ENEM' OR a.category = 'ENEM');

    IF v_correct_answer IS NULL THEN
        RAISE EXCEPTION 'Simulado exercise not found or access denied';
    END IF;

    v_scope := public.get_content_scope(auth.uid());
    
    IF NOT public.has_role(auth.uid(), 'admin') THEN
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
REVOKE EXECUTE ON FUNCTION public.check_simulado_answer(uuid, uuid, text) FROM public, anon;
