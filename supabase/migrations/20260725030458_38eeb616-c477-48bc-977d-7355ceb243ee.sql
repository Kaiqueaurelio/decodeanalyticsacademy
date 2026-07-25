
-- ============ FIX FORGEABLE INSERT POLICIES ============
DROP POLICY IF EXISTS "Anyone can insert ad clicks" ON public.ad_clicks;
CREATE POLICY "Users can insert own ad clicks" ON public.ad_clicks
  FOR INSERT TO authenticated, anon
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert ad views" ON public.ad_views;
CREATE POLICY "Users can insert own ad views" ON public.ad_views
  FOR INSERT TO authenticated, anon
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert views" ON public.apostila_views;
CREATE POLICY "Users can insert own apostila views" ON public.apostila_views
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- ============ REDUCE OVER-EXPOSED USER DATA ============
-- Leaderboard is served via SECURITY DEFINER RPC get_student_rankings,
-- so remove the broad table-level SELECT policies.
DROP POLICY IF EXISTS "Anyone can view all xp for ranking" ON public.user_xp;
DROP POLICY IF EXISTS "Anyone can view all user badges" ON public.user_badges;

-- ============ LOCK DOWN SECURITY DEFINER FUNCTIONS ============
-- Revoke blanket EXECUTE, then grant only to the roles that need each one.
REVOKE ALL ON FUNCTION public.award_badge(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_exercise_answer(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.count_tira_duvidas_today(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_user_completely(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_dashboard_stats(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_email_for_ra(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_exercise_counts() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_student_detail(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_student_rankings(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.increment_xp(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_user_action(text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.match_apostila(vector) FROM PUBLIC, anon;

-- Grants only where legitimately needed
GRANT EXECUTE ON FUNCTION public.check_exercise_answer(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_tira_duvidas_today(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_for_ra(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_exercise_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_rankings(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_apostila(vector) TO authenticated;
-- award_badge, delete_user_completely, get_student_detail, handle_new_user,
-- increment_xp, log_user_action are called only by edge functions (service_role
-- bypasses grants) or by triggers, so no role-level GRANT is needed.
