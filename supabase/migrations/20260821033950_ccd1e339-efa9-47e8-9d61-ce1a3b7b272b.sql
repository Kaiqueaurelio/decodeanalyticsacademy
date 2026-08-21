ALTER TABLE public.apostilas ADD COLUMN IF NOT EXISTS saved_date DATE;
COMMENT ON COLUMN public.apostilas.saved_date IS 'Data manual associada à apostila principal (YYYY-MM-DD)';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apostilas TO authenticated;
GRANT ALL ON public.apostilas TO service_role;