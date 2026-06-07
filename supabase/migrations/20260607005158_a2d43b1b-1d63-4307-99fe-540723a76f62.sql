
-- Coluna para guardar URL da capa gerada por IA
ALTER TABLE public.apostilas ADD COLUMN IF NOT EXISTS cover_url text;

-- Policies de storage para apostila-covers
-- Leitura pública (bucket é privado, então quem ler precisa de policy de SELECT)
CREATE POLICY "Apostila covers are readable by anyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'apostila-covers');

CREATE POLICY "Admins manage apostila covers"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'apostila-covers' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'apostila-covers' AND public.has_role(auth.uid(), 'admin'::public.app_role));
