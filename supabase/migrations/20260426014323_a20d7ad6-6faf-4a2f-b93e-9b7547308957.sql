
-- Books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  cover_url TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf','epub')),
  total_pages INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view books"
  ON public.books FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert books"
  ON public.books FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update books"
  ON public.books FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete books"
  ON public.books FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reading progress
CREATE TABLE public.reading_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,
  current_page INTEGER DEFAULT 1,
  location TEXT,
  progress_percentage NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reading progress"
  ON public.reading_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_reading_progress_updated_at
  BEFORE UPDATE ON public.reading_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_reading_progress_user ON public.reading_progress(user_id);

-- Storage bucket for books
INSERT INTO storage.buckets (id, name, public)
VALUES ('books', 'books', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Books are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'books');

CREATE POLICY "Admins can upload books"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'books' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update books storage"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'books' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete books storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'books' AND has_role(auth.uid(), 'admin'::app_role));
