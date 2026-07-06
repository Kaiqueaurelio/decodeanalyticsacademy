CREATE TABLE public.rss_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rss_feeds TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rss_feeds TO authenticated;
GRANT ALL ON public.rss_feeds TO service_role;
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read enabled feeds" ON public.rss_feeds FOR SELECT USING (true);
CREATE POLICY "Admins can insert feeds" ON public.rss_feeds FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update feeds" ON public.rss_feeds FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete feeds" ON public.rss_feeds FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_rss_feeds_updated_at BEFORE UPDATE ON public.rss_feeds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.rss_feeds (url, source, sort_order) VALUES
  ('https://feeds.feedburner.com/canaltechbr', 'Canaltech', 10),
  ('https://tecnoblog.net/feed/', 'Tecnoblog', 20),
  ('https://openrss.org/https://olhardigital.com.br', 'Olhar Digital', 30),
  ('https://www.tudocelular.com/feed', 'TudoCelular', 40),
  ('https://diolinux.com.br/feed', 'Diolinux', 50),
  ('https://sempreupdate.com.br/feed/', 'SempreUpdate', 60),
  ('https://www.hardware.com.br/feed/', 'Hardware.com.br', 70),
  ('https://www.baguete.com.br/rss', 'Baguete', 80)
ON CONFLICT (url) DO NOTHING;