-- Forçar todas as apostilas do 6º semestre para publicado e semestre correto
UPDATE public.apostilas 
SET published = true, 
    semester = 6, 
    status = 'liberada'
WHERE title ILIKE '%Sistemas Operacionais e Mobile%'
   OR title ILIKE '%Aspectos Teoricos da Computacao%'
   OR title ILIKE '%Aspectos Teóricos da Computação%'
   OR title ILIKE '%Calculo Numerico Computacional%'
   OR title ILIKE '%Pesquisa Operacional%'
   OR title ILIKE '%Gestao de Projetos I%'
   OR title ILIKE '%Processamento de Imagem e Visao Computacional%'
   OR title ILIKE '%Ciencia de Dados%'
   OR title ILIKE '%Metodos de Pesquisa%'
   OR title ILIKE '%Interdisciplinar de Ciencia da Computacao%';

-- Criar páginas iniciais para quem não tem (evita tela de erro de estruturação)
INSERT INTO public.apostila_pages (apostila_id, title, content, position)
SELECT a.id, 'Introdução e Guia de Estudo', '# Introdução\n\nBem-vindo ao material de ' || a.title || '.\n\nEste conteúdo está sendo estruturado para o semestre letivo.', 1
FROM public.apostilas a
LEFT JOIN public.apostila_pages p ON a.id = p.apostila_id
WHERE a.semester = 6 
  AND a.published = true
GROUP BY a.id, a.title
HAVING count(p.id) = 0;

-- Corrigir possíveis registros de 'placeholder' que ficaram órfãos ou mal tipados
UPDATE public.apostilas SET source_type = 'grade' WHERE source_type IS NULL AND semester > 0;
