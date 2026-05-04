-- Tabela de Anúncios (Ads)
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  image_path TEXT,
  link_url TEXT NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('banner', 'popup', 'inline')),
  position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  display_duration INT DEFAULT 5,
  target_audience TEXT,
  click_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Visualizações de Anúncios (Ad Views)
CREATE TABLE IF NOT EXISTS ad_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Tabela de Cliques em Anúncios (Ad Clicks)
CREATE TABLE IF NOT EXISTS ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ads_type ON ads(ad_type);
CREATE INDEX IF NOT EXISTS idx_ads_date_range ON ads(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ad_views_ad_id ON ad_views(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_views_user_id ON ad_views(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_ad_id ON ad_clicks(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_user_id ON ad_clicks(user_id);

-- RLS (Row Level Security)
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Anyone can view active ads" ON ads FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage ads" ON ads FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Anyone can view ad views" ON ad_views FOR SELECT USING (true);
CREATE POLICY "Anyone can insert ad views" ON ad_views FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view ad clicks" ON ad_clicks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert ad clicks" ON ad_clicks FOR INSERT WITH CHECK (true);

-- Função para atualizar view_count e click_count
CREATE OR REPLACE FUNCTION update_ad_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'ad_views' THEN
    UPDATE ads SET view_count = view_count + 1 WHERE id = NEW.ad_id;
  ELSIF TG_TABLE_NAME = 'ad_clicks' THEN
    UPDATE ads SET click_count = click_count + 1 WHERE id = NEW.ad_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar estatísticas
CREATE TRIGGER trigger_update_ad_views
AFTER INSERT ON ad_views
FOR EACH ROW
EXECUTE FUNCTION update_ad_stats();

CREATE TRIGGER trigger_update_ad_clicks
AFTER INSERT ON ad_clicks
FOR EACH ROW
EXECUTE FUNCTION update_ad_stats();
