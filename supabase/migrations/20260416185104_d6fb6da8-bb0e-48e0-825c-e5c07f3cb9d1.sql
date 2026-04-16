-- ============ COMUNIDADE ============
CREATE TABLE public.community_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text DEFAULT '💬',
  is_general boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view channels"
  ON public.community_channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage channels"
  ON public.community_channels FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Posts
CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.community_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_community_posts_channel ON public.community_posts(channel_id, created_at DESC);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view posts"
  ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own posts"
  ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts"
  ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts"
  ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all posts"
  ON public.community_posts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Replies
CREATE TABLE public.community_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_community_replies_post ON public.community_replies(post_id, created_at);

ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view replies"
  ON public.community_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own replies"
  ON public.community_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own replies"
  ON public.community_replies FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any reply"
  ON public.community_replies FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Likes
CREATE TABLE public.community_post_likes (
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view likes"
  ON public.community_post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like"
  ON public.community_post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike"
  ON public.community_post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ DEPOIMENTOS ============
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 20 AND 500),
  rating int NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  approved boolean NOT NULL DEFAULT false,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_testimonials_approved ON public.testimonials(approved, created_at DESC);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved testimonials"
  ON public.testimonials FOR SELECT TO anon, authenticated USING (approved = true);
CREATE POLICY "Users can view own testimonials"
  ON public.testimonials FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all testimonials"
  ON public.testimonials FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can submit own testimonial"
  ON public.testimonials FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own testimonial"
  ON public.testimonials FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage testimonials"
  ON public.testimonials FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_replies;

-- Seed: mural geral + canais por disciplina-chave
INSERT INTO public.community_channels (name, slug, description, icon, is_general, sort_order) VALUES
  ('Mural Geral', 'geral', 'Converse com toda a turma', '🌐', true, 0),
  ('Dúvidas Gerais', 'duvidas', 'Tire dúvidas sobre qualquer matéria', '❓', false, 1),
  ('Provas & Trabalhos', 'provas', 'Cronograma, dicas e estudo em grupo', '📝', false, 2),
  ('Programação', 'programacao', 'Código, projetos e linguagens', '💻', false, 3),
  ('Inteligência Artificial', 'ia', 'Discussões sobre IA e Machine Learning', '🤖', false, 4),
  ('Redes & Sistemas', 'redes', 'Redes, SO e Arquitetura', '🌐', false, 5),
  ('Off-topic', 'off-topic', 'Papo livre, memes e descontração', '🎮', false, 6);
