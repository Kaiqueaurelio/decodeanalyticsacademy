-- Tabela para histórico do chat com apostila
CREATE TABLE public.apostila_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  apostila_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_apostila_chats_user_apostila ON public.apostila_chats(user_id, apostila_id, created_at);

ALTER TABLE public.apostila_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own apostila chats"
  ON public.apostila_chats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own apostila chats"
  ON public.apostila_chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own apostila chats"
  ON public.apostila_chats FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);