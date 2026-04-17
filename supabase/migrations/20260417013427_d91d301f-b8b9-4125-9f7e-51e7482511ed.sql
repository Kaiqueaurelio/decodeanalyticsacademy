
ALTER TABLE public.flashcards
  ADD COLUMN IF NOT EXISTS ease_factor numeric NOT NULL DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS interval_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repetitions integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reviewed timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_flashcards_user_next_review
  ON public.flashcards (user_id, next_review);
