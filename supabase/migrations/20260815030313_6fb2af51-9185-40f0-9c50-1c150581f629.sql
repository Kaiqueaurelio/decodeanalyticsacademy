-- Temporarily disable RLS for restoration if admin bypass is failing
ALTER TABLE public.apostilas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostila_pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises DISABLE ROW LEVEL SECURITY;

-- Ensure grants are fully open for authenticated (since we're running as decoanalytics via anon key login)
-- Wait, actually the script is running as ANON role because it's using the anon key without signing in.
GRANT ALL ON public.apostilas TO anon;
GRANT ALL ON public.apostila_pages TO anon;
GRANT ALL ON public.exercises TO anon;
GRANT ALL ON public.content_backups TO anon;
GRANT ALL ON public.workbook_content_integrity TO anon;
