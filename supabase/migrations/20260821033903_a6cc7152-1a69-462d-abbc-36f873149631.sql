ALTER TABLE public.apostila_pages ADD COLUMN IF NOT EXISTS saved_date DATE;
COMMENT ON COLUMN public.apostila_pages.saved_date IS 'Data manual associada à aula/página (YYYY-MM-DD)';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apostila_pages TO authenticated;
GRANT ALL ON public.apostila_pages TO service_role;