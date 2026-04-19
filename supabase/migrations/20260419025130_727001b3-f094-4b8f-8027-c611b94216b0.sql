-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to apostilas (768 = Gemini text-embedding-004)
ALTER TABLE public.apostilas ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Index for fast similarity search
CREATE INDEX IF NOT EXISTS apostilas_embedding_idx ON public.apostilas
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Tira-duvida: bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('tira-duvida', 'tira-duvida', false)
ON CONFLICT (id) DO NOTHING;

-- RLS on storage objects: each user only their own folder
CREATE POLICY "Users upload own tira-duvida photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'tira-duvida' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own tira-duvida photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'tira-duvida' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own tira-duvida photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'tira-duvida' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Tira-duvidas table: question history
CREATE TABLE public.tira_duvidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  image_path text,
  concept text,
  hint text,
  full_answer text,
  related_apostila_id uuid REFERENCES public.apostilas(id) ON DELETE SET NULL,
  related_apostila_title text,
  similarity numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tira_duvidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tira-duvidas"
ON public.tira_duvidas FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users create own tira-duvidas"
ON public.tira_duvidas FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own tira-duvidas"
ON public.tira_duvidas FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all tira-duvidas"
ON public.tira_duvidas FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX tira_duvidas_user_id_created_idx ON public.tira_duvidas(user_id, created_at DESC);

-- Function: count today's questions for daily limit
CREATE OR REPLACE FUNCTION public.count_tira_duvidas_today(_user_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.tira_duvidas
  WHERE user_id = _user_id
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')
$$;

-- Function: semantic match apostila by embedding
CREATE OR REPLACE FUNCTION public.match_apostila(_embedding vector(768))
RETURNS TABLE (id uuid, title text, category text, similarity numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT a.id, a.title, a.category,
    (1 - (a.embedding <=> _embedding))::numeric AS similarity
  FROM public.apostilas a
  WHERE a.embedding IS NOT NULL AND a.published = true
  ORDER BY a.embedding <=> _embedding
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.count_tira_duvidas_today(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_apostila(vector) TO authenticated;