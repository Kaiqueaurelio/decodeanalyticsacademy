
-- MODULES
CREATE TABLE public.apostila_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apostila_id uuid NOT NULL REFERENCES public.apostilas(id) ON DELETE CASCADE,
  order_index int NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text,
  estimated_minutes int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX apostila_modules_apostila_idx ON public.apostila_modules(apostila_id, order_index);
GRANT SELECT ON public.apostila_modules TO authenticated;
GRANT ALL ON public.apostila_modules TO service_role;
ALTER TABLE public.apostila_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read modules of published apostilas"
  ON public.apostila_modules FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.apostilas a WHERE a.id = apostila_id AND (a.published = true OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Admins manage modules" ON public.apostila_modules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- CHAPTERS
CREATE TABLE public.apostila_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.apostila_modules(id) ON DELETE CASCADE,
  order_index int NOT NULL DEFAULT 0,
  title text NOT NULL,
  summary text,
  estimated_minutes int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX apostila_chapters_module_idx ON public.apostila_chapters(module_id, order_index);
GRANT SELECT ON public.apostila_chapters TO authenticated;
GRANT ALL ON public.apostila_chapters TO service_role;
ALTER TABLE public.apostila_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read chapters" ON public.apostila_chapters FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.apostila_modules m JOIN public.apostilas a ON a.id=m.apostila_id
    WHERE m.id = module_id AND (a.published = true OR public.has_role(auth.uid(),'admin'))
  ));
CREATE POLICY "Admins manage chapters" ON public.apostila_chapters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- LESSONS
CREATE TABLE public.apostila_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.apostila_chapters(id) ON DELETE CASCADE,
  order_index int NOT NULL DEFAULT 0,
  title text NOT NULL,
  objectives text[],
  difficulty text DEFAULT 'iniciante',
  estimated_minutes int DEFAULT 12,
  content_md text NOT NULL DEFAULT '',
  content_status text NOT NULL DEFAULT 'ready',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX apostila_lessons_chapter_idx ON public.apostila_lessons(chapter_id, order_index);
GRANT SELECT ON public.apostila_lessons TO authenticated;
GRANT ALL ON public.apostila_lessons TO service_role;
ALTER TABLE public.apostila_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read lessons" ON public.apostila_lessons FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.apostila_chapters c
    JOIN public.apostila_modules m ON m.id = c.module_id
    JOIN public.apostilas a ON a.id = m.apostila_id
    WHERE c.id = chapter_id AND (a.published = true OR public.has_role(auth.uid(),'admin'))
  ));
CREATE POLICY "Admins manage lessons" ON public.apostila_lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PROGRESS
CREATE TABLE public.apostila_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.apostila_lessons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress',
  last_position int DEFAULT 0,
  seconds_spent int DEFAULT 0,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
CREATE INDEX apostila_lesson_progress_user_idx ON public.apostila_lesson_progress(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apostila_lesson_progress TO authenticated;
GRANT ALL ON public.apostila_lesson_progress TO service_role;
ALTER TABLE public.apostila_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lesson progress" ON public.apostila_lesson_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- BOOKMARKS
CREATE TABLE public.apostila_lesson_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.apostila_lessons(id) ON DELETE CASCADE,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apostila_lesson_bookmarks TO authenticated;
GRANT ALL ON public.apostila_lesson_bookmarks TO service_role;
ALTER TABLE public.apostila_lesson_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks" ON public.apostila_lesson_bookmarks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NOTES
CREATE TABLE public.apostila_lesson_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.apostila_lessons(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX apostila_lesson_notes_user_lesson_idx ON public.apostila_lesson_notes(user_id, lesson_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apostila_lesson_notes TO authenticated;
GRANT ALL ON public.apostila_lesson_notes TO service_role;
ALTER TABLE public.apostila_lesson_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes" ON public.apostila_lesson_notes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER trg_modules_updated BEFORE UPDATE ON public.apostila_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_chapters_updated BEFORE UPDATE ON public.apostila_chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_lessons_updated BEFORE UPDATE ON public.apostila_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON public.apostila_lesson_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: agregado de progresso por apostila (usado no leitor)
CREATE OR REPLACE FUNCTION public.get_apostila_reader_tree(_apostila_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT jsonb_build_object(
    'apostila_id', _apostila_id,
    'modules', COALESCE(jsonb_agg(module_json ORDER BY (module_json->>'order_index')::int) FILTER (WHERE module_json IS NOT NULL), '[]'::jsonb)
  )
  INTO result
  FROM (
    SELECT jsonb_build_object(
      'id', m.id,
      'title', m.title,
      'description', m.description,
      'order_index', m.order_index,
      'estimated_minutes', m.estimated_minutes,
      'chapters', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', c.id,
          'title', c.title,
          'summary', c.summary,
          'order_index', c.order_index,
          'estimated_minutes', c.estimated_minutes,
          'lessons', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'id', l.id,
              'title', l.title,
              'order_index', l.order_index,
              'estimated_minutes', l.estimated_minutes,
              'difficulty', l.difficulty,
              'content_status', l.content_status,
              'progress_status', (
                SELECT p.status FROM public.apostila_lesson_progress p
                WHERE p.user_id = auth.uid() AND p.lesson_id = l.id LIMIT 1
              ),
              'bookmarked', EXISTS (
                SELECT 1 FROM public.apostila_lesson_bookmarks b
                WHERE b.user_id = auth.uid() AND b.lesson_id = l.id
              )
            ) ORDER BY l.order_index)
            FROM public.apostila_lessons l WHERE l.chapter_id = c.id
          ), '[]'::jsonb)
        ) ORDER BY c.order_index)
        FROM public.apostila_chapters c WHERE c.module_id = m.id
      ), '[]'::jsonb)
    ) AS module_json
    FROM public.apostila_modules m
    WHERE m.apostila_id = _apostila_id
  ) t;

  RETURN COALESCE(result, jsonb_build_object('apostila_id', _apostila_id, 'modules', '[]'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION public.get_apostila_reader_tree(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_apostila_reader_tree(uuid) TO authenticated;
