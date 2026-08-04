-- Atualizar a função de maximização para valores mais realistas
CREATE OR REPLACE FUNCTION public.maximize_user_gamification(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Maximizar XP e Nível para valores altos mas realistas (Nível 48, 4850 XP)
  INSERT INTO public.user_xp (user_id, xp_points, level)
  VALUES (_user_id, 4850, 48)
  ON CONFLICT (user_id) DO UPDATE
  SET xp_points = 4850, level = 48;

  -- Maximizar Streak para um valor alto realista (127 dias)
  INSERT INTO public.study_streaks (user_id, current_streak, longest_streak, last_study_date)
  VALUES (_user_id, 127, 127, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE
  SET current_streak = 127, longest_streak = 127, last_study_date = CURRENT_DATE;

  -- Conceder a maioria das conquistas (badges), mas não todas (para parecer real)
  INSERT INTO public.user_badges (user_id, badge_id)
  SELECT _user_id, id FROM public.badges
  WHERE criteria NOT IN ('tutor_master', 'expert_contributor') -- Deixa algumas para conquistar
  ON CONFLICT DO NOTHING;

  -- Garantir que o perfil administrativo tenha acesso total
  UPDATE public.profiles
  SET semester = 6, 
      content_scope = 'full'
  WHERE user_id = _user_id;
END;
$$;