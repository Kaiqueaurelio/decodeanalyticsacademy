-- Fix production apostila visibility without publishing incomplete drafts.
-- These are complete materials that were incorrectly hidden or missing their curriculum semester.

UPDATE public.apostilas
SET published = true,
    semester = 5,
    updated_at = now()
WHERE id = '620da9c1-e8de-4292-9edd-89e2a9ca0eaf'
  AND coalesce(length(trim(content)), 0) > 500;

UPDATE public.apostilas
SET semester = 6,
    updated_at = now()
WHERE category = 'Processamento de Imagem e Visao Computacional'
  AND semester IS NULL
  AND coalesce(length(trim(content)), 0) > 500;

-- Safety guard: this migration intentionally does NOT mass-publish drafts.
-- The admin UI remains the authoritative control for intentionally unpublished content.