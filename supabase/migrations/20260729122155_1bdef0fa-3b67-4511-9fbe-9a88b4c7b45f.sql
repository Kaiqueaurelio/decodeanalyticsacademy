CREATE TABLE public.planos_estudo (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  goal text NOT NULL DEFAULT '',
  area text,
  level text NOT NULL DEFAULT 'iniciante',
  subjects text[] NOT NULL DEFAULT '{}',
  priorities jsonb NOT NULL DEFAULT '[]'::jsonb,
  hours_per_day numeric NOT NULL DEFAULT 2,
  days_per_week integer NOT NULL DEFAULT 5,
  deadline date,
  plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.planos_estudo_tarefas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES public.planos_estudo(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  week_index integer NOT NULL DEFAULT 1,
  day_label text NOT NULL DEFAULT '',
  subject text,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'estudo',
  duration_minutes integer NOT NULL DEFAULT 60,
  sort_order integer NOT NULL DEFAULT 0,
  done boolean NOT NULL DEFAULT false,
  done_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.planos_estudo_versoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES public.planos_estudo(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  version integer NOT NULL,
  plan jsonb NOT NULL,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.planos_estudo TO authenticated;
GRANT ALL ON public.planos_estudo TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planos_estudo_tarefas TO authenticated;
GRANT ALL ON public.planos_estudo_tarefas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planos_estudo_versoes TO authenticated;
GRANT ALL ON public.planos_estudo_versoes TO service_role;

ALTER TABLE public.planos_estudo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_estudo_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_estudo_versoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own study plans"
ON public.planos_estudo FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own study plan tasks"
ON public.planos_estudo_tarefas FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read their own study plan versions"
ON public.planos_estudo_versoes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users create their own study plan versions"
ON public.planos_estudo_versoes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own study plan versions"
ON public.planos_estudo_versoes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_planos_estudo_user ON public.planos_estudo (user_id, updated_at DESC);
CREATE INDEX idx_planos_estudo_tarefas_plan ON public.planos_estudo_tarefas (plan_id, week_index, sort_order);
CREATE INDEX idx_planos_estudo_versoes_plan ON public.planos_estudo_versoes (plan_id, version DESC);

CREATE TRIGGER update_planos_estudo_updated_at
BEFORE UPDATE ON public.planos_estudo
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();