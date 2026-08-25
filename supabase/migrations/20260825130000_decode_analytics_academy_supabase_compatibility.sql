-- Compatibility migration for Decode Analytics Academy target project.
-- The main schema was applied from the repository history; these guards complete
-- objects that were referenced by later migrations but absent from the history.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT 'Aluno Decode',
  ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ra text,
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS content_scope text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS course text,
  ADD COLUMN IF NOT EXISTS semester integer,
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS login_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

ALTER TABLE public.apostilas ADD COLUMN IF NOT EXISTS content_scope text[];

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS question_type text NOT NULL DEFAULT 'multiple_choice',
  ADD COLUMN IF NOT EXISTS allow_image_upload boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_chars integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.award_badge(_criteria text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN jsonb_build_object('ok', false, 'criteria', _criteria, 'awarded', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_user_action(_action text, _material_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF to_regclass('public.activity_logs') IS NOT NULL THEN
    INSERT INTO public.activity_logs (action, material_id, user_id)
    VALUES (_action, _material_id, auth.uid());
  END IF;
END;
$$;
