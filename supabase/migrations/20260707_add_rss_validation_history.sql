-- Tabela para rastrear histórico de validações RSS
CREATE TABLE public.rss_validation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_id UUID NOT NULL REFERENCES public.rss_feeds(id) ON DELETE CASCADE,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_valid BOOLEAN NOT NULL,
  error_reason TEXT,
  item_count INTEGER,
  response_time_ms INTEGER,
  status_code INTEGER
);

-- Índices para performance
CREATE INDEX idx_rss_validation_history_feed_id ON public.rss_validation_history(feed_id);
CREATE INDEX idx_rss_validation_history_validated_at ON public.rss_validation_history(validated_at DESC);

-- RLS
GRANT SELECT ON public.rss_validation_history TO anon, authenticated;
GRANT SELECT, INSERT ON public.rss_validation_history TO authenticated;
GRANT ALL ON public.rss_validation_history TO service_role;
ALTER TABLE public.rss_validation_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read validation history" ON public.rss_validation_history FOR SELECT USING (true);
CREATE POLICY "Service role can insert validation history" ON public.rss_validation_history FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
