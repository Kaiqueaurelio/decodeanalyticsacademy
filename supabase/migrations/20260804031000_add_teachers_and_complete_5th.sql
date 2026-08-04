-- Add teacher column to apostilas
ALTER TABLE public.apostilas ADD COLUMN IF NOT EXISTS teacher TEXT;

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apostilas TO authenticated;
GRANT ALL ON public.apostilas TO service_role;

-- Update 5th semester apostilas as completed for existing users
-- Note: Completeness is usually per-user. 
-- For simplicity, let's create a function that marks all 5th semester apostilas as completed for the current user if they haven't been.
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
