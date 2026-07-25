-- 1) Remove old duplicates in category 'ENEM' (pre-refactor stubs)
DELETE FROM public.apostilas WHERE category = 'ENEM';

-- 2) Merge 'Simulados ENEM' into 'ENEM'
UPDATE public.apostilas SET category = 'ENEM' WHERE category = 'Simulados ENEM';

-- 3) Refresh RLS to reference only 'ENEM'
DROP POLICY IF EXISTS "Authenticated can view published apostilas (scoped)" ON public.apostilas;
CREATE POLICY "Authenticated can view published apostilas (scoped)"
ON public.apostilas
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    published = true
    AND (
      (get_content_scope(auth.uid()) = 'full'  AND (category IS NULL OR category <> 'ENEM'))
      OR (get_content_scope(auth.uid()) = 'enem_only' AND category = 'ENEM')
    )
  )
);