
-- 1. Criar o tipo enum para status da apostila
DO $$ BEGIN
    CREATE TYPE public.apostila_status AS ENUM ('liberada', 'bloqueada', 'em_manutencao');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar coluna status na tabela apostilas
ALTER TABLE public.apostilas ADD COLUMN IF NOT EXISTS status apostila_status DEFAULT 'liberada';

-- 3. Garantir que a tabela de histórico de versões tenha metadados de quem alterou
-- (Já existe apostila_versions, mas vamos garantir as colunas de auditoria)
ALTER TABLE public.apostila_versions ADD COLUMN IF NOT EXISTS created_by_name text;

-- 4. Criar tabela de logs de manutenção para o dashboard de histórico
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    apostila_id uuid REFERENCES public.apostilas(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    user_name text,
    action text NOT NULL,
    details text,
    created_at timestamp with time zone DEFAULT now()
);

GRANT SELECT, INSERT ON public.maintenance_logs TO authenticated;
GRANT ALL ON public.maintenance_logs TO service_role;

ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage maintenance logs" 
ON public.maintenance_logs 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view maintenance logs" 
ON public.maintenance_logs 
FOR SELECT 
TO authenticated 
USING (true);
