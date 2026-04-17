-- Tabela de favoritos de materiais por usuário
CREATE TABLE public.material_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, material_id)
);

CREATE INDEX idx_material_favorites_user ON public.material_favorites(user_id);
CREATE INDEX idx_material_favorites_material ON public.material_favorites(material_id);

ALTER TABLE public.material_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON public.material_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites"
  ON public.material_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.material_favorites FOR DELETE
  USING (auth.uid() = user_id);