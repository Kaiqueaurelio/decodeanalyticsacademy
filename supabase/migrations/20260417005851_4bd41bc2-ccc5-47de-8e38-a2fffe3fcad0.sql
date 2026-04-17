CREATE TABLE public.apostila_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  apostila_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, apostila_id)
);

ALTER TABLE public.apostila_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own apostila favorites"
ON public.apostila_favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add own apostila favorites"
ON public.apostila_favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own apostila favorites"
ON public.apostila_favorites FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_apostila_favorites_user ON public.apostila_favorites(user_id);