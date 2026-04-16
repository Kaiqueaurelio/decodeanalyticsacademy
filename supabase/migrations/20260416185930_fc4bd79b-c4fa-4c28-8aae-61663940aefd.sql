ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS course text,
  ADD COLUMN IF NOT EXISTS semester integer;