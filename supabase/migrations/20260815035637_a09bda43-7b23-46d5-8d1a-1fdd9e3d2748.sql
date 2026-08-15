
-- 1. Identificar apostilas que perderam capítulos
SELECT a.id, a.title, count(p.id) as page_count
FROM apostilas a
LEFT JOIN apostila_pages p ON a.id = p.apostila_id
GROUP BY a.id, a.title
HAVING count(p.id) = 0;

-- 2. Restaurar permissões de escrita via migration (o único canal de escrita direta)
ALTER TABLE public.apostilas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostila_pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.apostilas TO authenticated, service_role, anon;
GRANT ALL ON public.apostila_pages TO authenticated, service_role, anon;
GRANT ALL ON public.exercises TO authenticated, service_role, anon;
