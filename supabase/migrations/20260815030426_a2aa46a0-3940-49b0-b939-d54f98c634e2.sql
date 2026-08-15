-- Re-enable RLS now that restoration script is done
ALTER TABLE public.apostilas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostila_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbook_content_integrity ENABLE ROW LEVEL SECURITY;

-- Revoke anon access from backups and integrity tables for security
REVOKE ALL ON public.content_backups FROM anon;
REVOKE ALL ON public.workbook_content_integrity FROM anon;
REVOKE ALL ON public.apostilas FROM anon;
REVOKE ALL ON public.apostila_pages FROM anon;
REVOKE ALL ON public.exercises FROM anon;

-- Restore standard anon read access if needed for public features
GRANT SELECT ON public.apostilas TO anon;
GRANT SELECT ON public.apostila_pages TO anon;
GRANT SELECT ON public.exercises TO anon;
