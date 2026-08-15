-- Temporarily disable RLS
ALTER TABLE public.apostilas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostila_pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises DISABLE ROW LEVEL SECURITY;

-- Grant broad permissions to anon
GRANT ALL ON public.apostilas TO anon;
GRANT ALL ON public.apostila_pages TO anon;
GRANT ALL ON public.exercises TO anon;
