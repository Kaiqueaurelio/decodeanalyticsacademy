
-- Junction table: link materials to apostilas
CREATE TABLE public.apostila_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apostila_id uuid NOT NULL REFERENCES public.apostilas(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(apostila_id, material_id)
);

ALTER TABLE public.apostila_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage apostila_materials"
  ON public.apostila_materials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view apostila_materials for published apostilas"
  ON public.apostila_materials FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.apostilas
    WHERE apostilas.id = apostila_materials.apostila_id
      AND (apostilas.published = true OR public.has_role(auth.uid(), 'admin'))
  ));

-- Announcements / bulletin board
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'geral',
  image_url text,
  link_url text,
  created_by uuid NOT NULL,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view published announcements"
  ON public.announcements FOR SELECT TO authenticated
  USING (published = true OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
