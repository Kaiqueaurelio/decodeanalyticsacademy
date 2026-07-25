
-- ============================================================
-- Correção 3: Bloquear LIST anônimo em buckets públicos
-- Mantém GET via CDN (bypassa RLS em buckets public=true)
-- mas impede .list() / enumeração via API.
-- ============================================================
DROP POLICY IF EXISTS "Ads images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view announcement images" ON storage.objects;
DROP POLICY IF EXISTS "Apostila covers are readable by anyone" ON storage.objects;

-- ============================================================
-- Correção 4: REVOKE EXECUTE em funções internas (triggers e utilitários)
-- Least Privilege — não devem ser RPC-chamáveis pelo cliente.
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_security_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_profile_course_semester() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_apostila_semester_course() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_exercise_type() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_ad_type() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_resposta_foto_correct() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- Correção 2: Fechar get_email_for_ra — só service_role executa
-- A lógica migra para a edge function 'ra-login' com rate limit.
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.get_email_for_ra(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_for_ra(text) TO service_role;
