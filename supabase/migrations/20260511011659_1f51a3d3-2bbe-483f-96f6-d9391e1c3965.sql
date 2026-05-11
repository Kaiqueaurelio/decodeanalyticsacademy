
CREATE TABLE IF NOT EXISTS public.apostila_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apostila_id UUID NOT NULL REFERENCES public.apostilas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(apostila_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.apostila_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apostila_id UUID NOT NULL REFERENCES public.apostilas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  likes_count INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.apostila_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apostila_id UUID NOT NULL REFERENCES public.apostilas(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.apostila_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apostila_id UUID NOT NULL REFERENCES public.apostilas(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  view_count INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_apostila_likes_apostila_id ON public.apostila_likes(apostila_id);
CREATE INDEX IF NOT EXISTS idx_apostila_likes_user_id ON public.apostila_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_apostila_comments_apostila_id ON public.apostila_comments(apostila_id);
CREATE INDEX IF NOT EXISTS idx_apostila_comments_user_id ON public.apostila_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_apostila_views_apostila_id ON public.apostila_views(apostila_id);
CREATE INDEX IF NOT EXISTS idx_apostila_shares_apostila_id ON public.apostila_shares(apostila_id);
CREATE INDEX IF NOT EXISTS idx_apostila_shares_token ON public.apostila_shares(share_token);

ALTER TABLE public.apostila_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostila_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostila_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostila_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view likes" ON public.apostila_likes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own likes" ON public.apostila_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.apostila_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view comments" ON public.apostila_comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own comments" ON public.apostila_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.apostila_comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.apostila_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view views" ON public.apostila_views
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert views" ON public.apostila_views
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view shares" ON public.apostila_shares
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create their own shares" ON public.apostila_shares
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can delete their own shares" ON public.apostila_shares
  FOR DELETE TO authenticated USING (auth.uid() = created_by);
