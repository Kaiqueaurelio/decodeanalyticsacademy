-- Mantém o leitor estruturado sincronizado com o editor de páginas.
-- Antes desta migração, apostila_pages era copiada para apostila_lessons apenas
-- em uma migração pontual; páginas criadas depois ficavam fora do /reader/:id.

ALTER TABLE public.apostila_lessons
  ADD COLUMN IF NOT EXISTS source_page_id uuid
  REFERENCES public.apostila_pages(id) ON DELETE CASCADE;

-- Migrações anteriores criaram lições a partir de páginas, mas sem guardar a
-- origem. Reaproveita essas linhas antes de criar novas, evitando duplicação.
UPDATE public.apostila_lessons l
SET source_page_id = p.id
FROM public.apostila_pages p
JOIN public.apostila_chapters c ON c.id = l.chapter_id
JOIN public.apostila_modules m ON m.id = c.module_id AND m.apostila_id = p.apostila_id
WHERE l.source_page_id IS NULL
  AND l.title = p.title
  AND NOT EXISTS (
    SELECT 1
    FROM public.apostila_lessons occupied
    WHERE occupied.source_page_id = p.id
  );

CREATE UNIQUE INDEX IF NOT EXISTS apostila_lessons_source_page_id_idx
  ON public.apostila_lessons(source_page_id)
  WHERE source_page_id IS NOT NULL;

-- Apostilas que possuem páginas, mas ainda não foram estruturadas, recebem uma
-- estrutura mínima para que o leitor possa exibir essas páginas.
INSERT INTO public.apostila_modules (apostila_id, title, order_index)
SELECT DISTINCT p.apostila_id, 'Módulo 1: Fundamentos', 0
FROM public.apostila_pages p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.apostila_modules m
  WHERE m.apostila_id = p.apostila_id
);

INSERT INTO public.apostila_chapters (module_id, title, order_index)
SELECT m.id, 'Capítulo 1: Introdução', 0
FROM public.apostila_modules m
WHERE NOT EXISTS (
  SELECT 1
  FROM public.apostila_chapters c
  WHERE c.module_id = m.id
)
AND EXISTS (
  SELECT 1
  FROM public.apostila_pages p
  WHERE p.apostila_id = m.apostila_id
);

-- Vincula páginas antigas que ainda não estavam representadas como lições.
INSERT INTO public.apostila_lessons (
  chapter_id,
  title,
  content_md,
  order_index,
  source_page_id
)
SELECT
  c.id,
  p.title,
  p.content,
  p.position,
  p.id
FROM public.apostila_pages p
JOIN LATERAL (
  SELECT m.id
  FROM public.apostila_modules m
  WHERE m.apostila_id = p.apostila_id
  ORDER BY m.order_index, m.created_at, m.id
  LIMIT 1
) m ON true
JOIN LATERAL (
  SELECT c.id
  FROM public.apostila_chapters c
  WHERE c.module_id = m.id
  ORDER BY c.order_index, c.created_at, c.id
  LIMIT 1
) c ON true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.apostila_lessons l
  WHERE l.source_page_id = p.id
)
AND NOT EXISTS (
  SELECT 1
  FROM public.apostila_lessons l
  JOIN public.apostila_chapters existing_c ON existing_c.id = l.chapter_id
  JOIN public.apostila_modules existing_m ON existing_m.id = existing_c.module_id
  WHERE existing_m.apostila_id = p.apostila_id
    AND l.title = p.title
);

CREATE OR REPLACE FUNCTION public.sync_apostila_page_to_reader_lesson()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_module_id uuid;
  target_chapter_id uuid;
  target_lesson_id uuid;
BEGIN
  -- Evita que duas páginas criadas simultaneamente gerem módulos duplicados.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.apostila_id::text, 0));

  SELECT m.id
  INTO target_module_id
  FROM public.apostila_modules m
  WHERE m.apostila_id = NEW.apostila_id
  ORDER BY m.order_index, m.created_at, m.id
  LIMIT 1;

  IF target_module_id IS NULL THEN
    INSERT INTO public.apostila_modules (apostila_id, title, order_index)
    VALUES (NEW.apostila_id, 'Módulo 1: Fundamentos', 0)
    RETURNING id INTO target_module_id;
  END IF;

  SELECT c.id
  INTO target_chapter_id
  FROM public.apostila_chapters c
  WHERE c.module_id = target_module_id
  ORDER BY c.order_index, c.created_at, c.id
  LIMIT 1;

  IF target_chapter_id IS NULL THEN
    INSERT INTO public.apostila_chapters (module_id, title, order_index)
    VALUES (target_module_id, 'Capítulo 1: Introdução', 0)
    RETURNING id INTO target_chapter_id;
  END IF;

  SELECT l.id
  INTO target_lesson_id
  FROM public.apostila_lessons l
  WHERE l.source_page_id = NEW.id
  LIMIT 1;

  IF target_lesson_id IS NULL THEN
    INSERT INTO public.apostila_lessons (
      chapter_id,
      title,
      content_md,
      order_index,
      source_page_id,
      content_status
    )
    VALUES (
      target_chapter_id,
      COALESCE(NULLIF(trim(NEW.title), ''), 'Nova Página'),
      COALESCE(NEW.content, ''),
      NEW.position,
      NEW.id,
      'ready'
    );
  ELSE
    UPDATE public.apostila_lessons
    SET
      chapter_id = target_chapter_id,
      title = COALESCE(NULLIF(trim(NEW.title), ''), 'Nova Página'),
      content_md = COALESCE(NEW.content, ''),
      order_index = NEW.position,
      updated_at = now()
    WHERE id = target_lesson_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apostila_pages_sync_reader_lesson ON public.apostila_pages;
CREATE TRIGGER apostila_pages_sync_reader_lesson
AFTER INSERT OR UPDATE OF title, content, position ON public.apostila_pages
FOR EACH ROW
EXECUTE FUNCTION public.sync_apostila_page_to_reader_lesson();

REVOKE ALL ON FUNCTION public.sync_apostila_page_to_reader_lesson() FROM PUBLIC;
