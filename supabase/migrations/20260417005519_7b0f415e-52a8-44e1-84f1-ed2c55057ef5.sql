CREATE TABLE public.apostila_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  apostila_id UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, apostila_id)
);

ALTER TABLE public.apostila_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
ON public.apostila_completions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
ON public.apostila_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions"
ON public.apostila_completions FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_apostila_completions_user ON public.apostila_completions(user_id);