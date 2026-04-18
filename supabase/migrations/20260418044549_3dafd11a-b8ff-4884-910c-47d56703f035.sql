
-- Tabela principal: 1 simulado por usuário por semana (ou sob demanda)
CREATE TABLE public.weekly_simulados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  status text NOT NULL DEFAULT 'in_progress', -- in_progress | finished
  total_questions integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  score numeric(5,2) NOT NULL DEFAULT 0, -- 0..100
  diagnosis jsonb NOT NULL DEFAULT '{}'::jsonb, -- { "Disciplina": { total, correct, accuracy } }
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_weekly_simulados_user_week ON public.weekly_simulados(user_id, week_start DESC);

ALTER TABLE public.weekly_simulados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own simulados"
ON public.weekly_simulados FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all simulados"
ON public.weekly_simulados FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Respostas individuais
CREATE TABLE public.weekly_simulado_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulado_id uuid NOT NULL REFERENCES public.weekly_simulados(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  question_index integer NOT NULL, -- 0..19
  exercise_id uuid, -- referência opcional ao exercises.id (pode ser nulo se vier sintetizado)
  apostila_id uuid,
  subject text, -- disciplina (categoria)
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer text NOT NULL,
  selected_answer text,
  is_correct boolean,
  explanation text,
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (simulado_id, question_index)
);

CREATE INDEX idx_weekly_sim_answers_simulado ON public.weekly_simulado_answers(simulado_id);

ALTER TABLE public.weekly_simulado_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own simulado answers"
ON public.weekly_simulado_answers FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all simulado answers"
ON public.weekly_simulado_answers FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
