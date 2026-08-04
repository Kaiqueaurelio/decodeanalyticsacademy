-- Atualizar a função de maximização para valores MÁXIMOS conforme pedido pelo admin
CREATE OR REPLACE FUNCTION public.maximize_user_gamification(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Maximizar XP e Nível (Nível 99, 9900 XP)
  INSERT INTO public.user_xp (user_id, xp_points, level)
  VALUES (_user_id, 9900, 99)
  ON CONFLICT (user_id) DO UPDATE
  SET xp_points = 9900, level = 99;

  -- Maximizar Streak (365 dias)
  INSERT INTO public.study_streaks (user_id, current_streak, longest_streak, last_study_date)
  VALUES (_user_id, 365, 365, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE
  SET current_streak = 365, longest_streak = 365, last_study_date = CURRENT_DATE;

  -- Conceder TODAS as conquistas
  INSERT INTO public.user_badges (user_id, badge_id)
  SELECT _user_id, id FROM public.badges
  ON CONFLICT DO NOTHING;

  -- Garantir acesso total
  UPDATE public.profiles
  SET content_scope = 'full'
  WHERE user_id = _user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.maximize_user_gamification(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.maximize_user_gamification(uuid) TO service_role;