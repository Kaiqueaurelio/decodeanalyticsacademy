CREATE TABLE IF NOT EXISTS public.apostila_page_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  apostila_id uuid NOT NULL REFERENCES public.apostilas(id) ON DELETE CASCADE,
  page_key text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, apostila_id, page_key)
);

CREATE INDEX IF NOT EXISTS apostila_page_progress_user_apostila_idx
  ON public.apostila_page_progress (user_id, apostila_id);

ALTER TABLE public.apostila_page_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own apostila page progress" ON public.apostila_page_progress;
CREATE POLICY "Users manage own apostila page progress"
  ON public.apostila_page_progress FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.apostila_page_progress TO authenticated;
GRANT ALL ON public.apostila_page_progress TO service_role;
