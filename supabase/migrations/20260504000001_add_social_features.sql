-- Tabela de Curtidas (Likes)
CREATE TABLE IF NOT EXISTS apostila_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apostila_id UUID NOT NULL REFERENCES apostilas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(apostila_id, user_id)
);

-- Tabela de Comentários
CREATE TABLE IF NOT EXISTS apostila_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apostila_id UUID NOT NULL REFERENCES apostilas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes_count INT DEFAULT 0
);

-- Tabela de Visualizações
CREATE TABLE IF NOT EXISTS apostila_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apostila_id UUID NOT NULL REFERENCES apostilas(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Tabela de Compartilhamentos
CREATE TABLE IF NOT EXISTS apostila_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apostila_id UUID NOT NULL REFERENCES apostilas(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INT DEFAULT 0
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_apostila_likes_apostila_id ON apostila_likes(apostila_id);
CREATE INDEX IF NOT EXISTS idx_apostila_likes_user_id ON apostila_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_apostila_comments_apostila_id ON apostila_comments(apostila_id);
CREATE INDEX IF NOT EXISTS idx_apostila_comments_user_id ON apostila_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_apostila_views_apostila_id ON apostila_views(apostila_id);
CREATE INDEX IF NOT EXISTS idx_apostila_shares_apostila_id ON apostila_shares(apostila_id);
CREATE INDEX IF NOT EXISTS idx_apostila_shares_token ON apostila_shares(share_token);

-- RLS (Row Level Security)
ALTER TABLE apostila_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE apostila_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE apostila_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE apostila_shares ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view likes" ON apostila_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes" ON apostila_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON apostila_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view comments" ON apostila_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON apostila_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON apostila_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON apostila_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view views" ON apostila_views FOR SELECT USING (true);
CREATE POLICY "Anyone can insert views" ON apostila_views FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view shares" ON apostila_shares FOR SELECT USING (true);
CREATE POLICY "Users can create shares" ON apostila_shares FOR INSERT WITH CHECK (auth.uid() = created_by);
