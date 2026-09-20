-- The live database previously re-granted table SELECT after the quiz hardening.
-- Keep answer keys inaccessible through the REST table surface; students use the safe RPC.
REVOKE SELECT ON public.quiz_questions FROM anon, authenticated;
