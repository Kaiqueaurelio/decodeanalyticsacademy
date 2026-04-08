
-- 1. Fix privilege escalation: restrict INSERT on user_roles to admins only
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Fix XP manipulation: remove user UPDATE policy, create secure increment function
DROP POLICY IF EXISTS "Users can update own xp" ON public.user_xp;

CREATE OR REPLACE FUNCTION public.increment_xp(_user_id uuid, _amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_points integer;
  new_level integer;
BEGIN
  IF _amount <= 0 OR _amount > 100 THEN
    RAISE EXCEPTION 'Invalid XP amount: must be between 1 and 100';
  END IF;
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot modify other users XP';
  END IF;

  INSERT INTO public.user_xp (user_id, xp_points, level)
  VALUES (_user_id, _amount, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET xp_points = user_xp.xp_points + _amount,
      level = GREATEST(1, FLOOR((user_xp.xp_points + _amount) / 100)::integer + 1),
      updated_at = now();
END;
$$;

-- 3. Fix exercise answer exposure: create secure answer check function
CREATE OR REPLACE FUNCTION public.check_exercise_answer(_exercise_id uuid, _selected_answer text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  correct text;
  is_right boolean;
  expl text;
BEGIN
  SELECT correct_answer, explanation INTO correct, expl
  FROM public.exercises WHERE id = _exercise_id;

  IF correct IS NULL THEN
    RAISE EXCEPTION 'Exercise not found';
  END IF;

  is_right := (_selected_answer = correct);

  -- Record the answer
  INSERT INTO public.answers (user_id, exercise_id, selected_answer, is_correct)
  VALUES (auth.uid(), _exercise_id, _selected_answer, is_right);

  RETURN jsonb_build_object(
    'is_correct', is_right,
    'correct_answer', correct,
    'explanation', expl
  );
END;
$$;

-- 4. Fix storage: make materials bucket private
UPDATE storage.buckets SET public = false WHERE id = 'materials';

-- Remove public read policy
DROP POLICY IF EXISTS "Public read access for materials" ON storage.objects;

-- Ensure authenticated read policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated can view material files'
  ) THEN
    CREATE POLICY "Authenticated can view material files"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'materials');
  END IF;
END $$;

-- 5. Fix downloads: allow users to view their own downloads
CREATE POLICY "Users can view own downloads"
ON public.downloads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
