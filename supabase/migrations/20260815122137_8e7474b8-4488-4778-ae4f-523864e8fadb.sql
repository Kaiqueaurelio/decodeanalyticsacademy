-- Security Hardening v5.9.4: Fixing RLS leaks for exercises, pages and quizzes

-- 1. Hardening exercises (prevent leak of answers and unpublished content)
DROP POLICY IF EXISTS "Authenticated users can read exercises" ON public.exercises;
DROP POLICY IF EXISTS "Authenticated can view exercises of visible apostilas" ON public.exercises;
DROP POLICY IF EXISTS "Users can select exercises" ON public.exercises;

CREATE POLICY "Users can view exercises of published apostilas"
ON public.exercises FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.apostilas a
    WHERE a.id = exercises.apostila_id
    AND a.published = true
    AND (
      public.get_content_scope(auth.uid()) = 'full'
      OR (public.get_content_scope(auth.uid()) = 'enem_only' AND a.category = 'ENEM')
    )
  )
);

-- 2. Hardening apostila_pages (prevent leak of unpublished content)
DROP POLICY IF EXISTS "Authenticated users can read pages" ON public.apostila_pages;
DROP POLICY IF EXISTS "Authenticated users can view apostila pages" ON public.apostila_pages;

CREATE POLICY "Users can view pages of published apostilas"
ON public.apostila_pages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.apostilas a
    WHERE a.id = apostila_pages.apostila_id
    AND a.published = true
    AND (
      public.get_content_scope(auth.uid()) = 'full'
      OR (public.get_content_scope(auth.uid()) = 'enem_only' AND a.category = 'ENEM')
    )
  )
);

-- 3. Hardening quiz_questions (prevent leak of correct answers)
DROP POLICY IF EXISTS "Anyone authenticated can view questions" ON public.quiz_questions;

CREATE POLICY "Users can view questions of accessible quizzes"
ON public.quiz_questions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id
  )
);

-- Final cleanup of grants
GRANT SELECT ON public.exercises TO authenticated;
GRANT SELECT ON public.apostila_pages TO authenticated;
GRANT SELECT ON public.quiz_questions TO authenticated;
