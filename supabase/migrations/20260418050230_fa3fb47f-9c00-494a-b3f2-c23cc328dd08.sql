ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS course text,
  ADD COLUMN IF NOT EXISTS semester smallint;

-- Validação leve via trigger (CHECK em valores fixos seria mais forte, mas usamos trigger pra flexibilidade futura)
CREATE OR REPLACE FUNCTION public.validate_profile_course_semester()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.course IS NOT NULL AND NEW.course NOT IN ('CC','SI','EC') THEN
    RAISE EXCEPTION 'course must be one of CC, SI, EC';
  END IF;
  IF NEW.semester IS NOT NULL AND (NEW.semester < 1 OR NEW.semester > 12) THEN
    RAISE EXCEPTION 'semester must be between 1 and 12';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_profile_course_semester_trg ON public.profiles;
CREATE TRIGGER validate_profile_course_semester_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_profile_course_semester();