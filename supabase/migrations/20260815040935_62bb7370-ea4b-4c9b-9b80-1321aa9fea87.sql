ALTER TABLE public.apostilas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostila_pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.apostilas TO anon, authenticated, service_role;
GRANT ALL ON public.apostila_pages TO anon, authenticated, service_role;
GRANT ALL ON public.exercises TO anon, authenticated, service_role;
