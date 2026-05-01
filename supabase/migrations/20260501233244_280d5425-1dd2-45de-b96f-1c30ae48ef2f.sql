ALTER TABLE public.apostilas
  ADD COLUMN IF NOT EXISTS content_backup text,
  ADD COLUMN IF NOT EXISTS reformatted_at timestamptz;