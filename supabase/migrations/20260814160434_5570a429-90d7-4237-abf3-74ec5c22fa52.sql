
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS match_options JSONB;
