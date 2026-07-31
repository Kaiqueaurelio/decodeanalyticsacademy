-- 1) RA -> e-mail: remove acesso anônimo (enumeração de RA + vazamento de e-mail).
REVOKE ALL ON FUNCTION public.get_email_for_ra(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_for_ra(text) TO service_role;

-- 2) Leaderboard: nomes de alunos não devem ser públicos.
REVOKE ALL ON FUNCTION public.get_public_leaderboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_leaderboard(integer) TO authenticated, service_role;

-- 3) Árvore do leitor: exige sessão (a função já valida auth.uid(), mas fechamos o grant).
REVOKE ALL ON FUNCTION public.get_apostila_reader_tree(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_apostila_reader_tree(uuid) TO authenticated, service_role;

-- 4) Contador de alertas: só autenticado (a função já filtra admin internamente).
REVOKE ALL ON FUNCTION public.count_open_security_notifications() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.count_open_security_notifications() TO authenticated, service_role;

-- 5) Função de trigger não deve ser invocável pela API.
REVOKE ALL ON FUNCTION public.protect_security_notification_fields() FROM PUBLIC, anon, authenticated;

-- 6) rss_feeds: leitura apenas para usuários autenticados.
DROP POLICY IF EXISTS "Anyone can read enabled feeds" ON public.rss_feeds;
CREATE POLICY "Authenticated can read feeds"
  ON public.rss_feeds FOR SELECT TO authenticated USING (true);
REVOKE ALL ON TABLE public.rss_feeds FROM anon;