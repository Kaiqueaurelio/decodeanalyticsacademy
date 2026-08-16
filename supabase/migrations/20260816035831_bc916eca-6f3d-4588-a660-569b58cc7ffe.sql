-- Tabela para armazenar as apostilas fixadas por semestre e matéria
CREATE TABLE IF NOT EXISTS public.fixed_apostilas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apostila_id UUID NOT NULL REFERENCES public.apostilas(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    subject_key TEXT NOT NULL, -- canonicalSubjectKey da categoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(semester, subject_key) -- Apenas uma apostila fixada por matéria em cada semestre
);

-- Habilitar RLS
ALTER TABLE public.fixed_apostilas ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON public.fixed_apostilas TO authenticated;
GRANT ALL ON public.fixed_apostilas TO service_role;
GRANT SELECT ON public.fixed_apostilas TO anon;

-- Políticas
CREATE POLICY "Fixed apostilas are readable by everyone" 
ON public.fixed_apostilas FOR SELECT 
TO authenticated, anon 
USING (true);

CREATE POLICY "Admins can manage fixed apostilas" 
ON public.fixed_apostilas FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));