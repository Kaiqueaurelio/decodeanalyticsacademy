-- Temporarily disable RLS to allow restoration via anon key
ALTER TABLE public.apostilas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostila_pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_backups DISABLE ROW LEVEL SECURITY;

-- Grant broad permissions to anon role
GRANT ALL ON public.apostilas TO anon;
GRANT ALL ON public.apostila_pages TO anon;
GRANT ALL ON public.exercises TO anon;
GRANT ALL ON public.content_backups TO anon;
