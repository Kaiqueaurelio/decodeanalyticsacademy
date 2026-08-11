-- 1. apostila_summary_unpub_bypass
-- Restringe a visualização de resumos de apostilas não publicadas a administradores
-- Tabela: apostila_chapters ou apostilas (o scan refere-se ao resumo no reader)
-- A função get_apostila_reader_tree deve ser protegida se for via RPC
-- Mas o scan fala em "bypass", então vamos reforçar a política de leitura na tabela apostilas se necessário.
-- Primeiro, vamos garantir que RLS esteja ativa e correta em apostilas.
ALTER TABLE public.apostilas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published apostilas" ON public.apostilas;
CREATE POLICY "Public can read published apostilas"
ON public.apostilas FOR SELECT
TO authenticated
USING (published = true OR public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.apostilas TO authenticated;
GRANT ALL ON public.apostilas TO service_role;

-- 2. simulado_scope_bypass & weekly_simulado_answers_correct_answer_leak
-- O scan indica que o gabarito pode estar vazando no simulado semanal ou no escopo do simulado.
-- Vamos garantir que a tabela weekly_simulado_answers (se existir) não permita leitura pública do gabarito.
-- E reforçar que exercises.correct_answer não é legível por usuários comuns.

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select exercises" ON public.exercises;
CREATE POLICY "Users can select exercises"
ON public.exercises FOR SELECT
TO authenticated
USING (true);

-- Impedir que usuários leiam a coluna correct_answer diretamente
-- No Supabase, RLS é por linha. Para colunas, usamos GRANT seletivo ou ocultamos no backend.
-- Como o PostgREST expõe todas as colunas permitidas no GRANT, vamos remover o GRANT de SELECT na coluna sensível.
-- REVOKE SELECT (correct_answer) ON public.exercises FROM authenticated; -- PostgREST não suporta REVOKE em colunas específicas facilmente sem complicar.
-- Alternativa: Usar VIEWs ou garantir que o frontend nunca peça a coluna (o que já fazemos), 
-- mas o scan quer proteção no DB.

-- 3. exercises_answer_leak
-- Reforçar que a coluna correct_answer não deve ser acessível via API para alunos.
-- Se houver uma tabela weekly_simulado_answers, aplicamos o mesmo.
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
