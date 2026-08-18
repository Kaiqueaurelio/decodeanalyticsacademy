-- Permite que administradores criem e editem páginas de qualquer apostila,
-- inclusive rascunhos. A leitura de alunos continua protegida pela política
-- de visibilidade da apostila publicada.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.apostila_pages TO authenticated;

DROP POLICY IF EXISTS "Admins manage apostila pages" ON public.apostila_pages;
CREATE POLICY "Admins manage apostila pages"
  ON public.apostila_pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
