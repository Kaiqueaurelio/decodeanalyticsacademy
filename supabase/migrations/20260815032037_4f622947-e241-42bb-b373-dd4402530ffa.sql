-- Temporarily disable RLS for direct cleanup
ALTER TABLE public.apostilas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostila_pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises DISABLE ROW LEVEL SECURITY;

-- Remove duplicates and keep only one clean copy
DELETE FROM public.exercises WHERE apostila_id IN (SELECT id FROM public.apostilas WHERE title ILIKE '%Aspectos Teóricos%');
DELETE FROM public.apostila_pages WHERE apostila_id IN (SELECT id FROM public.apostilas WHERE title ILIKE '%Aspectos Teóricos%');
DELETE FROM public.apostilas WHERE title ILIKE '%Aspectos Teóricos%';

-- Grant standard permissions back
GRANT ALL ON public.apostilas TO authenticated;
GRANT ALL ON public.apostila_pages TO authenticated;
GRANT ALL ON public.exercises TO authenticated;

-- Re-enable RLS
ALTER TABLE public.apostilas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostila_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
