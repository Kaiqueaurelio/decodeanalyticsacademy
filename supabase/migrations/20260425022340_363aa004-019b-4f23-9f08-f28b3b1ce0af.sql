-- Add ordering and rich question metadata to exercises
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS question_type text NOT NULL DEFAULT 'objective',
  ADD COLUMN IF NOT EXISTS expected_answer jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS allow_image_upload boolean NOT NULL DEFAULT false;

-- Backfill question_type from existing data
UPDATE public.exercises
SET question_type = CASE
  WHEN type = 'essay' OR correct_answer = 'dissertativa' OR jsonb_array_length(COALESCE(options, '[]'::jsonb)) = 0 THEN 'essay'
  ELSE 'objective'
END
WHERE question_type = 'objective';

-- Backfill sort_order using created_at order within each apostila
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY apostila_id ORDER BY created_at) AS rn
  FROM public.exercises
  WHERE sort_order = 0
)
UPDATE public.exercises e
SET sort_order = ordered.rn
FROM ordered
WHERE e.id = ordered.id;

CREATE INDEX IF NOT EXISTS idx_exercises_apostila_order
  ON public.exercises (apostila_id, sort_order);

-- Validation: question_type must be in known set
CREATE OR REPLACE FUNCTION public.validate_exercise_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.question_type NOT IN ('objective','essay','calculation','graph','algorithm') THEN
    RAISE EXCEPTION 'invalid question_type: %', NEW.question_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS exercises_validate_type ON public.exercises;
CREATE TRIGGER exercises_validate_type
  BEFORE INSERT OR UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.validate_exercise_type();

-- Extend respostas_foto for AI-graded handwritten answers
ALTER TABLE public.respostas_foto
  ADD COLUMN IF NOT EXISTS score numeric,
  ADD COLUMN IF NOT EXISTS correct text,
  ADD COLUMN IF NOT EXISTS detected_answer text,
  ADD COLUMN IF NOT EXISTS expected_answer_snapshot text;

-- correct: 'correct' | 'partial' | 'incorrect' (nullable while not graded)
CREATE OR REPLACE FUNCTION public.validate_resposta_foto_correct()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.correct IS NOT NULL AND NEW.correct NOT IN ('correct','partial','incorrect') THEN
    RAISE EXCEPTION 'invalid correct value: %', NEW.correct;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS respostas_foto_validate_correct ON public.respostas_foto;
CREATE TRIGGER respostas_foto_validate_correct
  BEFORE INSERT OR UPDATE ON public.respostas_foto
  FOR EACH ROW EXECUTE FUNCTION public.validate_resposta_foto_correct();

CREATE INDEX IF NOT EXISTS idx_respostas_foto_exercise
  ON public.respostas_foto (exercise_id, user_id);