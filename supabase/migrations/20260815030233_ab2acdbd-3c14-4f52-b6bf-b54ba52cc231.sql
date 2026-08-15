-- Drop existing policies if they are too restrictive for admin insertion
DROP POLICY IF EXISTS "Admins can do everything on apostilas" ON public.apostilas;
DROP POLICY IF EXISTS "Public can view published apostilas" ON public.apostilas;

-- Re-enable RLS just in case
ALTER TABLE public.apostilas ENABLE ROW LEVEL SECURITY;

-- Allow admins full access (decoanalytics@outlook.com.br / G802144)
-- We use the has_role function if it exists, or check the user_id/email directly for robustness
CREATE POLICY "Admins full access on apostilas"
ON public.apostilas
FOR ALL
TO authenticated
USING (
  auth.uid() = '1ea75282-cc92-49a2-92a2-4c54344a6d43' OR 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  auth.uid() = '1ea75282-cc92-49a2-92a2-4c54344a6d43' OR 
  public.has_role(auth.uid(), 'admin')
);

-- Allow all authenticated users to read published apostilas
CREATE POLICY "Authenticated users can read published apostilas"
ON public.apostilas
FOR SELECT
TO authenticated
USING (published = true);

-- Ensure grants are complete
GRANT ALL ON public.apostilas TO authenticated;
GRANT ALL ON public.apostilas TO service_role;

-- Repeat for pages and exercises to ensure the restoration script doesn't hit RLS there either
ALTER TABLE public.apostila_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access on apostila_pages" ON public.apostila_pages FOR ALL TO authenticated
USING (auth.uid() = '1ea75282-cc92-49a2-92a2-4c54344a6d43' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can read pages" ON public.apostila_pages FOR SELECT TO authenticated USING (true);
GRANT ALL ON public.apostila_pages TO authenticated;

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access on exercises" ON public.exercises FOR ALL TO authenticated
USING (auth.uid() = '1ea75282-cc92-49a2-92a2-4c54344a6d43' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can read exercises" ON public.exercises FOR SELECT TO authenticated USING (true);
GRANT ALL ON public.exercises TO authenticated;
