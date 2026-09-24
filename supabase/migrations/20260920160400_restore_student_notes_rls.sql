-- Restore private student note access while keeping ownership enforced by RLS.
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own student notes" ON public.student_notes;
DROP POLICY IF EXISTS "Users can create own student notes" ON public.student_notes;
DROP POLICY IF EXISTS "Users can update own student notes" ON public.student_notes;
DROP POLICY IF EXISTS "Users can delete own student notes" ON public.student_notes;

CREATE POLICY "Users can view own student notes"
ON public.student_notes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own student notes"
ON public.student_notes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own student notes"
ON public.student_notes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own student notes"
ON public.student_notes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

REVOKE ALL ON public.student_notes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_notes TO authenticated;
GRANT ALL ON public.student_notes TO service_role;
