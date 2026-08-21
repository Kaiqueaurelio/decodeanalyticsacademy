-- Data da aula correspondente ao último salvamento da página.
-- Usa o fuso da plataforma para evitar que a virada UTC altere o dia exibido ao aluno.
ALTER TABLE public.apostila_pages
  ADD COLUMN IF NOT EXISTS saved_date DATE;

UPDATE public.apostila_pages
SET saved_date = (COALESCE(updated_at, created_at) AT TIME ZONE 'America/Sao_Paulo')::date
WHERE saved_date IS NULL;

ALTER TABLE public.apostila_pages
  ALTER COLUMN saved_date SET DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date),
  ALTER COLUMN saved_date SET NOT NULL;

CREATE INDEX IF NOT EXISTS apostila_pages_apostila_saved_date_idx
  ON public.apostila_pages (apostila_id, saved_date, position);

COMMENT ON COLUMN public.apostila_pages.saved_date IS
  'Data local da aula atribuída no último salvamento da página.';

GRANT SELECT, INSERT, UPDATE ON public.apostila_pages TO authenticated;
