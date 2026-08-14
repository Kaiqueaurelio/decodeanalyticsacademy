-- Páginas internas do caderno de cada apostila.
CREATE TABLE IF NOT EXISTS public.apostila_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apostila_id UUID NOT NULL REFERENCES public.apostilas(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nova Página',
  content TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS apostila_pages_apostila_position_idx
  ON public.apostila_pages (apostila_id, position, created_at);

ALTER TABLE public.apostila_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view apostila pages"
  ON public.apostila_pages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.apostilas a
      WHERE a.id = apostila_id
        AND (a.published = true OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Admins can manage apostila pages"
  ON public.apostila_pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_apostila_pages_updated_at ON public.apostila_pages;
CREATE TRIGGER update_apostila_pages_updated_at
  BEFORE UPDATE ON public.apostila_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
