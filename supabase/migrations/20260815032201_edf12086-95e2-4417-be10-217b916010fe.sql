-- Temporarily disable RLS for EVERYTHING involved in the restoration
ALTER TABLE public.apostilas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostila_pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_backups DISABLE ROW LEVEL SECURITY;

-- Grant ALL to anon to ensure the script has full access
GRANT ALL ON public.apostilas TO anon;
GRANT ALL ON public.apostila_pages TO anon;
GRANT ALL ON public.exercises TO anon;
GRANT ALL ON public.content_backups TO anon;

-- Explicitly allow inserts for the restoration user id
-- (Already disabled RLS, but just in case of any internal checks)
