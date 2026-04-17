-- Tabela do Plano de Estudos Inteligente
CREATE TABLE public.study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_date date NOT NULL,
  apostila_id uuid NOT NULL,
  apostila_title text NOT NULL,
  subject text,
  reason text NOT NULL,
  pomodoros integer NOT NULL DEFAULT 1,
  related_event_id uuid,
  related_event_title text,
  related_event_date date,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_date, apostila_id)
);

CREATE INDEX idx_study_plans_user_date ON public.study_plans(user_id, plan_date);

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own study plans"
ON public.study_plans FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Cache de Resumos Express e Mapas Mentais por apostila (compartilhado entre alunos)
CREATE TABLE public.apostila_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apostila_id uuid NOT NULL UNIQUE,
  summary_md text,
  mindmap_mermaid text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid
);

ALTER TABLE public.apostila_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view summaries for published apostilas"
ON public.apostila_summaries FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.apostilas a
  WHERE a.id = apostila_summaries.apostila_id
    AND (a.published = true OR public.has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Authenticated can insert summaries"
ON public.apostila_summaries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = generated_by);

CREATE POLICY "Authenticated can update summaries"
ON public.apostila_summaries FOR UPDATE
TO authenticated
USING (true);