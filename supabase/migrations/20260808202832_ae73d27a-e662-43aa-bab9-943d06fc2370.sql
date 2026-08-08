-- 1. Tabela de rate limiting persistente
CREATE TABLE IF NOT EXISTS public.auth_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier text, -- RA ou E-mail
    ip_address text,
    attempts integer DEFAULT 1,
    last_attempt timestamp with time zone DEFAULT now(),
    locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Índices para busca rápida no rate limiter
CREATE INDEX IF NOT EXISTS idx_auth_attempts_identifier ON public.auth_attempts(identifier);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip ON public.auth_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_lockout ON public.auth_attempts(locked_until) WHERE locked_until IS NOT NULL;

-- Grants: apenas a service_role (usada na Edge Function) tem acesso total
GRANT ALL ON public.auth_attempts TO service_role;
REVOKE ALL ON public.auth_attempts FROM anon, authenticated;

ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

-- 2. Hardening de funções SECURITY DEFINER (Search Path e Privilégios)
-- Aplicando SET search_path = public e removendo execução pública onde indevido.

ALTER FUNCTION public.get_email_for_ra(text) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.get_email_for_ra(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_for_ra(text) TO service_role;

ALTER FUNCTION public.complete_semesters_upto_five(uuid) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.complete_semesters_upto_five(uuid) FROM anon;

ALTER FUNCTION public.complete_semesters_six_to_eight(uuid) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.complete_semesters_six_to_eight(uuid) FROM anon;

ALTER FUNCTION public.increment_xp(uuid, integer) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.increment_xp(uuid, integer) FROM anon;

ALTER FUNCTION public.get_student_detail(uuid) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.get_student_detail(uuid) FROM anon;

ALTER FUNCTION public.get_apostila_reader_tree(uuid) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.get_apostila_reader_tree(uuid) FROM anon;

ALTER FUNCTION public.check_exercise_answer(uuid, text) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.check_exercise_answer(uuid, text) FROM anon;

ALTER FUNCTION public.award_badge(text) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.award_badge(text) FROM anon;

ALTER FUNCTION public.get_public_leaderboard(integer) SET search_path = public;
ALTER FUNCTION public.get_student_rankings(integer) SET search_path = public;
ALTER FUNCTION public.count_open_security_notifications() SET search_path = public;
ALTER FUNCTION public.count_tira_duvidas_today(uuid) SET search_path = public;
ALTER FUNCTION public.get_content_scope(uuid) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION public.maximize_user_gamification(uuid) SET search_path = public;
ALTER FUNCTION public.match_apostila(vector) SET search_path = public;
ALTER FUNCTION public.ella_rate_check(uuid, integer, integer, integer) SET search_path = public;
ALTER FUNCTION public.ella_register_denial(uuid, integer, integer, integer) SET search_path = public;
