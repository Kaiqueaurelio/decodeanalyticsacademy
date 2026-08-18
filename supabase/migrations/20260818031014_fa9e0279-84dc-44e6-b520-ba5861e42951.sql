UPDATE public.apostilas 
SET published = true, status = 'liberada' 
WHERE semester = 6;

UPDATE public.apostilas 
SET semester = 6 
WHERE (title ILIKE '%Pesquisa Operacional%' 
   OR title ILIKE '%Sistemas Operacionais e Mobile%'
   OR title ILIKE '%Calculo Numerico%'
   OR title ILIKE '%Aspectos Teoricos%'
   OR title ILIKE '%Gestao de Projetos I%'
   OR title ILIKE '%Processamento de Imagem%'
   OR title ILIKE '%Ciencia de Dados%')
   AND (semester IS NULL OR semester != 6);