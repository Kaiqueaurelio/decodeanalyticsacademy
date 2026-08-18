-- Corrige registros do 6º semestre que ficaram ocultos mesmo contendo conteúdo.
-- Apostilas sem conteúdo continuam como rascunho para não publicar material vazio.

UPDATE public.apostilas
SET
  published = true,
  status = 'liberada',
  semester = 6
WHERE semester = 6
  AND (
    length(btrim(COALESCE(content, ''))) > 0
    OR EXISTS (
      SELECT 1
      FROM public.apostila_pages p
      WHERE p.apostila_id = apostilas.id
        AND length(btrim(COALESCE(p.content, ''))) > 0
    )
  )
  AND (
    category ILIKE '%mobile%'
    OR category ILIKE '%sistemas operacionais%'
    OR title ILIKE '%Sistemas Operacionais e Mobile%'
    OR title ILIKE '%Aspectos Teóricos da Computação%'
    OR title ILIKE '%Aspectos Teoricos da Computacao%'
    OR title ILIKE '%Calculo Numerico Computacional%'
    OR title ILIKE '%Pesquisa Operacional%'
    OR title ILIKE '%Gestao de Projetos I%'
    OR title ILIKE '%Processamento de Imagem e Visao Computacional%'
    OR title ILIKE '%Ciencia de Dados%'
    OR title ILIKE '%Metodos de Pesquisa%'
    OR title ILIKE '%Interdisciplinar de Ciencia da Computacao%'
  );

-- Também corrige registros cujo título identifica a disciplina, mas cujo
-- semestre foi perdido antes da correção de dados.
UPDATE public.apostilas
SET
  published = true,
  status = 'liberada',
  semester = 6
WHERE (
    length(btrim(COALESCE(content, ''))) > 0
    OR EXISTS (
      SELECT 1
      FROM public.apostila_pages p
      WHERE p.apostila_id = apostilas.id
        AND length(btrim(COALESCE(p.content, ''))) > 0
    )
  )
  AND (
    title ILIKE '%Sistemas Operacionais e Mobile%'
    OR title ILIKE '%Aspectos Teóricos da Computação%'
    OR title ILIKE '%Aspectos Teoricos da Computacao%'
    OR title ILIKE '%Calculo Numerico Computacional%'
    OR title ILIKE '%Pesquisa Operacional%'
    OR title ILIKE '%Gestao de Projetos I%'
    OR title ILIKE '%Processamento de Imagem e Visao Computacional%'
    OR title ILIKE '%Ciencia de Dados%'
    OR title ILIKE '%Metodos de Pesquisa%'
    OR title ILIKE '%Interdisciplinar de Ciencia da Computacao%'
  );
