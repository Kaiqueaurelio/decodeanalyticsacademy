-- Corrige o histórico de gamificação e as políticas RLS das tabelas usadas pelo aluno.
-- Esta migration deve ser aplicada primeiro em um ambiente de staging e validada
-- antes de ser executada no projeto de produção.

CREATE OR REPLACE FUNCTION public.log_study_activity(
  _user_id uuid,
  _xp integer DEFAULT 0,
  _chapters integer DEFAULT 0,
  _exercises integer DEFAULT 0,
  _minutes integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  INSERT INTO public.study_history (
    user_id,
    date,
    xp_gained,
    chapters_completed,
    exercises_completed,
    time_spent_minutes
  )
  VALUES (
    _user_id,
    CURRENT_DATE,
    GREATEST(COALESCE(_xp, 0), 0),
    GREATEST(COALESCE(_chapters, 0), 0),
    GREATEST(COALESCE(_exercises, 0), 0),
    GREATEST(COALESCE(_minutes, 0), 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_study_activity(uuid, integer, integer, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_study_activity(uuid, integer, integer, integer, integer) TO authenticated;

DROP POLICY IF EXISTS "Users read own study history" ON public.study_history;
CREATE POLICY "Users read own study history"
  ON public.study_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own study goals" ON public.study_goals;
CREATE POLICY "Users manage own study goals"
  ON public.study_goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own study milestones" ON public.study_milestones;
CREATE POLICY "Users read own study milestones"
  ON public.study_milestones
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users read categories" ON public.categories;
CREATE POLICY "Authenticated users read categories"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (true);
