-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Public access to responses" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload response photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own response photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own response photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own response photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins have full access to response photos" ON storage.objects;

-- 1. Alunos só veem suas próprias fotos de respostas (pastas baseadas no auth.uid)
CREATE POLICY "Users can view own response photos" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'respostas-foto' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Alunos só deletam suas próprias fotos
CREATE POLICY "Users can delete own response photos" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'respostas-foto' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Alunos podem fazer upload para sua própria pasta
CREATE POLICY "Users can upload own response photos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'respostas-foto' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Admins podem tudo
CREATE POLICY "Admins have full access to response photos" 
ON storage.objects FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
