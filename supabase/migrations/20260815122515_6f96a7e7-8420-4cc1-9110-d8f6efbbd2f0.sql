-- Security Hardening v5.9.5: Resolving multi-point RLS vulnerabilities

-- 1. Tighten Apostila Pages visibility
DROP POLICY IF EXISTS "Strict visibility for apostila_pages" ON public.apostila_pages;
DROP POLICY IF EXISTS "Users can view pages of published apostilas" ON public.apostila_pages;
DROP POLICY IF EXISTS "Authenticated users can read pages" ON public.apostila_pages;

CREATE POLICY "Strict visibility for apostila_pages"
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

-- 2. Hardening Exercises
DROP POLICY IF EXISTS "Strict visibility for exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can view exercises of published apostilas" ON public.exercises;
DROP POLICY IF EXISTS "Authenticated users can read exercises" ON public.exercises;

CREATE POLICY "Strict visibility for exercises"
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

-- 3. Correct chapter visibility (Nested join through modules to apostilas)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'apostila_chapters') THEN
        DROP POLICY IF EXISTS "Strict visibility for apostila_chapters" ON public.apostila_chapters;
        DROP POLICY IF EXISTS "Authenticated can view chapters of visible apostilas" ON public.apostila_chapters;
        
        EXECUTE 'CREATE POLICY "Strict visibility for apostila_chapters" 
        ON public.apostila_chapters FOR SELECT 
        TO authenticated 
        USING (
          EXISTS (
            SELECT 1 FROM public.apostila_modules m
            JOIN public.apostilas a ON a.id = m.apostila_id
            WHERE m.id = apostila_chapters.module_id
            AND a.published = true
            AND (
              public.get_content_scope(auth.uid()) = ''full''
              OR (public.get_content_scope(auth.uid()) = ''enem_only'' AND a.category = ''ENEM'')
            )
          )
        )';
    END IF;
END $$;

-- 4. Secure Quiz Questions
DROP POLICY IF EXISTS "Strict visibility for quiz_questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Users can view questions of accessible quizzes" ON public.quiz_questions;

CREATE POLICY "Strict visibility for quiz_questions"
ON public.quiz_questions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id
  )
);

-- 5. Secure Quizzes
DROP POLICY IF EXISTS "Strict visibility for quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Anyone authenticated can view quizzes" ON public.quizzes;

CREATE POLICY "Strict visibility for quizzes"
ON public.quizzes FOR SELECT
TO authenticated
USING (true); 

-- Re-verify grants
GRANT SELECT ON public.exercises TO authenticated;
GRANT SELECT ON public.apostila_pages TO authenticated;
GRANT SELECT ON public.quiz_questions TO authenticated;
GRANT SELECT ON public.quizzes TO authenticated;
