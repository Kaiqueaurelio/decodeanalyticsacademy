ALTER TABLE public.apostilas ADD COLUMN IF NOT EXISTS teacher TEXT;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apostilas TO authenticated;
GRANT ALL ON public.apostilas TO service_role;

CREATE OR REPLACE FUNCTION public.complete_fifth_semester_apostilas(_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.apostila_completions (user_id, apostila_id)
  SELECT _user_id, id
  FROM public.apostilas
  WHERE semester = 5 AND published = true
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
