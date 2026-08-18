UPDATE public.apostilas SET published = true WHERE published = false;
GRANT SELECT ON public.apostilas TO authenticated;
GRANT SELECT ON public.apostilas TO anon;