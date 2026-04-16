
-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to delete a user completely (auth + all related data)
CREATE OR REPLACE FUNCTION public.delete_user_completely(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied: only admins can delete users';
  END IF;

  -- Delete from all user-related tables
  DELETE FROM public.answers WHERE user_id = _target_user_id;
  DELETE FROM public.annotations WHERE user_id = _target_user_id;
  DELETE FROM public.flashcards WHERE user_id = _target_user_id;
  DELETE FROM public.pomodoro_sessions WHERE user_id = _target_user_id;
  DELETE FROM public.comments WHERE user_id = _target_user_id;
  DELETE FROM public.activity_logs WHERE user_id = _target_user_id;
  DELETE FROM public.downloads WHERE user_id = _target_user_id;
  DELETE FROM public.respostas_foto WHERE user_id = _target_user_id;
  DELETE FROM public.security_alerts WHERE user_id = _target_user_id;
  DELETE FROM public.study_streaks WHERE user_id = _target_user_id;
  DELETE FROM public.user_badges WHERE user_id = _target_user_id;
  DELETE FROM public.user_xp WHERE user_id = _target_user_id;
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  DELETE FROM public.profiles WHERE user_id = _target_user_id;

  -- Delete from auth.users (SECURITY DEFINER allows this)
  DELETE FROM auth.users WHERE id = _target_user_id;
END;
$$;
