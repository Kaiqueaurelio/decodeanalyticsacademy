ALTER TABLE public.apostilas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostila_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_backups ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.apostilas FROM anon;
REVOKE ALL ON public.apostila_pages FROM anon;
REVOKE ALL ON public.exercises FROM anon;
REVOKE ALL ON public.content_backups FROM anon;

GRANT SELECT ON public.apostilas TO anon;
GRANT SELECT ON public.apostila_pages TO anon;
GRANT SELECT ON public.exercises TO anon;
-- content_backups should remain admin only or as per existing policies
GRANT ALL ON public.apostilas TO authenticated;
GRANT ALL ON public.apostila_pages TO authenticated;
GRANT ALL ON public.exercises TO authenticated;
GRANT ALL ON public.apostilas TO service_role;
GRANT ALL ON public.apostila_pages TO service_role;
GRANT ALL ON public.exercises TO service_role;