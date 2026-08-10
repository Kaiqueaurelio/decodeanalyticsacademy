UPDATE public.apostilas 
SET content = '', published = false 
WHERE semester = 6 
AND category NOT IN ('Processamento de Imagem e Visao Computacional', 'Gestao de Projetos I', 'Ciencia de Dados');