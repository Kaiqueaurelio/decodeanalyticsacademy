-- Tighten learner activity privacy policies flagged by Supabase/Lovable.
-- These changes keep each student limited to their own progress data while
-- preserving full visibility for administrators.

DO $$
BEGIN
  IF to_regclass('public.apostila_views') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.apostila_views ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view views" ON public.apostila_views';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view views" ON public.apostila_views';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view apostila views" ON public.apostila_views';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view apostila views" ON public.apostila_views';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view all apostila views" ON public.apostila_views';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own apostila views" ON public.apostila_views';

    EXECUTE 'CREATE POLICY "Users can view own apostila views"
      ON public.apostila_views
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id OR public.has_role(auth.uid(), ''admin''::public.app_role))';
  END IF;

  IF to_regclass('public.user_badges') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view all user badges" ON public.user_badges';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone authenticated can view user badges" ON public.user_badges';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges';

    EXECUTE 'CREATE POLICY "Users can view own badges"
      ON public.user_badges
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id OR public.has_role(auth.uid(), ''admin''::public.app_role))';
  END IF;

  IF to_regclass('public.user_xp') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view all xp for ranking" ON public.user_xp';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone authenticated can view xp for ranking" ON public.user_xp';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own xp" ON public.user_xp';

    EXECUTE 'CREATE POLICY "Users can view own xp"
      ON public.user_xp
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id OR public.has_role(auth.uid(), ''admin''::public.app_role))';
  END IF;

  IF to_regclass('public.activity_logs') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own activity logs" ON public.activity_logs';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON public.activity_logs';

    EXECUTE 'CREATE POLICY "Users can insert own activity logs"
      ON public.activity_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), ''admin''::public.app_role))';
  END IF;
END $$;
