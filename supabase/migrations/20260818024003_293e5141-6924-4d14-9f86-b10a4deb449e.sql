-- 1. Normalização de Categorias e Visibilidade para 6º Semestre
UPDATE public.apostilas 
SET category = CASE 
    WHEN title ILIKE '%Sistemas Operacionais e Mobile%' THEN 'Sistemas Operacionais e Mobile'
    WHEN title ILIKE '%Aspectos Teóricos da Computação%' OR title ILIKE '%Aspectos Teoricos da Computacao%' THEN 'Aspectos Teoricos da Computacao'
    WHEN title ILIKE '%Calculo Numerico Computacional%' THEN 'Calculo Numerico Computacional'
    WHEN title ILIKE '%Pesquisa Operacional%' THEN 'Pesquisa Operacional'
    WHEN title ILIKE '%Gestao de Projetos I%' THEN 'Gestao de Projetos I'
    WHEN title ILIKE '%Processamento de Imagem e Visao Computacional%' THEN 'Processamento de Imagem e Visao Computacional'
    WHEN title ILIKE '%Ciencia de Dados%' THEN 'Ciencia de Dados'
    WHEN title ILIKE '%Metodos de Pesquisa%' THEN 'Metodos de Pesquisa'
    WHEN title ILIKE '%Interdisciplinar de Ciencia da Computacao%' THEN 'Interdisciplinar de Ciencia da Computacao'
    ELSE category 
END,
semester = 6,
published = true,
status = 'liberada'
WHERE semester = 6 OR title ILIKE ANY (ARRAY[
    '%Sistemas Operacionais e Mobile%',
    '%Aspectos Teóricos da Computação%',
    '%Aspectos Teoricos da Computacao%',
    '%Calculo Numerico Computacional%',
    '%Pesquisa Operacional%',
    '%Gestao de Projetos I%',
    '%Processamento de Imagem e Visao Computacional%',
    '%Ciencia de Dados%',
    '%Metodos de Pesquisa%',
    '%Interdisciplinar de Ciencia da Computacao%'
]);

-- 2. Garantir que todas as apostilas do 6º semestre tenham pelo menos uma página
INSERT INTO public.apostila_pages (apostila_id, title, content, position)
SELECT a.id, 'Introdução e Guia de Estudo', '# Introdução\n\nMaterial em fase de estruturação para o 6º semestre.', 1
FROM public.apostilas a
LEFT JOIN public.apostila_pages p ON a.id = p.apostila_id
WHERE a.semester = 6 
GROUP BY a.id
HAVING COUNT(p.id) = 0;

-- 3. Estruturação automática de Módulos/Capítulos para evitar o erro de Reader vazio
-- Criar Módulo Default
INSERT INTO public.apostila_modules (apostila_id, title, order_index)
SELECT a.id, 'Módulo 1: Fundamentos', 1
FROM public.apostilas a
LEFT JOIN public.apostila_modules m ON a.id = m.apostila_id
WHERE a.semester = 6
GROUP BY a.id
HAVING COUNT(m.id) = 0;

-- Criar Capítulo Default vinculado ao Módulo
INSERT INTO public.apostila_chapters (module_id, title, order_index)
SELECT m.id, 'Capítulo 1: Introdução', 1
FROM public.apostila_modules m
JOIN public.apostilas a ON m.apostila_id = a.id
LEFT JOIN public.apostila_chapters c ON m.id = c.module_id
WHERE a.semester = 6
GROUP BY m.id
HAVING COUNT(c.id) = 0;

-- Sincronizar apostila_pages como apostila_lessons para o Reader funcionar
INSERT INTO public.apostila_lessons (chapter_id, title, content_md, order_index)
SELECT c.id, p.title, p.content, p.position
FROM public.apostila_pages p
JOIN public.apostilas a ON p.apostila_id = a.id
JOIN public.apostila_modules m ON a.id = m.apostila_id
JOIN public.apostila_chapters c ON m.id = c.module_id
LEFT JOIN public.apostila_lessons l ON c.id = l.chapter_id AND l.title = p.title
WHERE a.semester = 6 AND l.id IS NULL;
