UPDATE public.apostilas 
SET category = 'Processamento de Imagem e Visão Computacional' 
WHERE id = 'd6a6e733-eabd-47a3-a3c6-2e8fffa11784';

UPDATE public.apostilas 
SET category = 'Ferramentas de Análise de Dados e Gestão de Projetos Operacionais' 
WHERE id = 'b132f212-5ede-4522-92d3-b0ead2cd8ce2';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.apostilas TO authenticated;
GRANT ALL ON public.apostilas TO service_role;
GRANT SELECT ON public.apostilas TO anon;