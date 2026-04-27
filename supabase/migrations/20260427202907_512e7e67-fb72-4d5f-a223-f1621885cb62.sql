
-- PlayBooks: highlights, notes, bookmarks
CREATE TABLE IF NOT EXISTS public.playbooks_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_id uuid NOT NULL,
  text text NOT NULL,
  color text NOT NULL DEFAULT 'yellow',
  start_location text,
  end_location text,
  page integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.playbooks_highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own pb highlights" ON public.playbooks_highlights
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_pb_highlights_user_book ON public.playbooks_highlights(user_id, book_id);

CREATE TABLE IF NOT EXISTS public.playbooks_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_id uuid NOT NULL,
  highlight_id uuid REFERENCES public.playbooks_highlights(id) ON DELETE CASCADE,
  content text NOT NULL,
  page integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.playbooks_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own pb notes" ON public.playbooks_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_pb_notes_user_book ON public.playbooks_notes(user_id, book_id);

CREATE TABLE IF NOT EXISTS public.playbooks_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_id uuid NOT NULL,
  location text,
  page integer,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.playbooks_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own pb bookmarks" ON public.playbooks_bookmarks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_pb_bookmarks_user_book ON public.playbooks_bookmarks(user_id, book_id);
