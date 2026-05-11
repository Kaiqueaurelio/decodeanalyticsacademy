CREATE TABLE public.calculator_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  semester smallint,
  np1 numeric(4,2),
  np2 numeric(4,2),
  exam numeric(4,2),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject)
);

ALTER TABLE public.calculator_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own grades"
ON public.calculator_grades FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_calculator_grades_updated_at
BEFORE UPDATE ON public.calculator_grades
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();