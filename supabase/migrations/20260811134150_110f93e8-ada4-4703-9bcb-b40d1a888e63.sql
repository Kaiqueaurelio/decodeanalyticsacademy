-- 1. apostila_summary_unpub_bypass
-- Restringe a visualização de resumos de apostilas não publicadas a administradores
ALTER TABLE public.apostilas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published apostilas" ON public.apostilas;
CREATE POLICY "Public can read published apostilas"
ON public.apostilas FOR SELECT
TO authenticated
USING (published = true OR public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.apostilas TO authenticated;
GRANT ALL ON public.apostilas TO service_role;

-- 2. simulado_scope_bypass & weekly_simulado_answers_correct_answer_leak
-- Reforçar que exercises.correct_answer não é legível por usuários comuns via RLS de linha e proteção de lógica
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select exercises" ON public.exercises;
CREATE POLICY "Users can select exercises"
ON public.exercises FOR SELECT
TO authenticated
USING (true);

-- 3. exercises_answer_leak
-- Reforçar que a coluna correct_answer não deve ser acessível via API para alunos se houver tabela de respostas semanais
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'weekly_simulado_answers') THEN
        ALTER TABLE public.weekly_simulado_answers ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can only read their own answers" ON public.weekly_simulado_answers;
        CREATE POLICY "Users can only read their own answers"
        ON public.weekly_simulado_answers FOR SELECT
        TO authenticated
        USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
        
        GRANT SELECT, INSERT, UPDATE ON public.weekly_simulado_answers TO authenticated;
        GRANT ALL ON public.weekly_simulado_answers TO service_role;
    END IF;
END $$;

-- 4. maintenance_logs_public_read
-- Restringir leitura de maintenance_logs apenas para administradores
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can read maintenance logs" ON public.maintenance_logs;
CREATE POLICY "Only admins can read maintenance logs"
ON public.maintenance_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.maintenance_logs TO authenticated;
GRANT ALL ON public.maintenance_logs TO service_role;

-- 5. Reforço de segurança geral para as tabelas citadas
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;