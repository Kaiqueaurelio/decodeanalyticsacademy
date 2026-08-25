-- Security linter hardening for SECURITY DEFINER functions.
-- Public RA login dependencies remain intentionally executable by anon:
-- has_role(uuid, app_role) and get_email_for_ra(text).

REVOKE EXECUTE ON FUNCTION public.can_view_apostila(_apostila_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.complete_fifth_semester_apostilas(_user_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.complete_semesters_six_to_eight(_user_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.complete_semesters_upto_five(_user_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.force_complete_semesters_upto_five(_user_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_apostila_validation_dashboard(_limit integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_public_jobs() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_quiz_questions(_quiz_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.maximize_user_gamification(_user_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.publish_apostila_when_page_has_content() FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_apostila_operation(_operation_id uuid, _apostila_id uuid, _page_id uuid, _operation_type text, _phase text, _status text, _affected_record_ids uuid[], _error_code text, _error_message text, _metadata jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.run_apostila_chronology_validation(_apostila_id uuid, _trigger_source text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.run_apostila_chronology_validation_internal(_apostila_id uuid, _trigger_source text, _created_by uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.separate_apostila_pages_by_date(_apostila_id uuid, _user_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.snapshot_apostila_version(_apostila_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_quiz(_quiz_id uuid, _answers jsonb, _time_spent integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.trigger_apostila_chronology_validation() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_ad_counters() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_materials_order(payload jsonb) FROM anon;

REVOKE EXECUTE ON FUNCTION public.prevent_profile_admin_field_escalation() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.publish_apostila_when_page_has_content() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.run_apostila_chronology_validation_internal(uuid, text, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_apostila_chronology_validation() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_ad_counters() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;

ALTER FUNCTION public.get_leaderboard() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_ad_stats() SET search_path = public;
