-- Corrige apostilas antigas que possuem conteúdo, mas ficaram como rascunho.
-- Rascunhos vazios continuam privados para o administrador.
UPDATE public.apostilas
SET published = true,
    updated_at = now()
WHERE published = false
  AND (
    COALESCE(btrim(content), '') <> ''
    OR EXISTS (
      SELECT 1
      FROM public.apostila_materials am
      WHERE am.apostila_id = public.apostilas.id
    )
  );
