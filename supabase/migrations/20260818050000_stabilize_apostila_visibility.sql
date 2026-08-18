-- Estabiliza a visibilidade das apostilas fixas e das páginas criadas pelo editor.
-- A migração é idempotente para poder ser aplicada com segurança em ambientes
-- que já possuem parte da estrutura criada.

CREATE TABLE IF NOT EXISTS public.fixed_apostilas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester integer NOT NULL,
  subject_key text NOT NULL,
  apostila_id uuid NOT NULL REFERENCES public.apostilas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS fixed_apostilas_semester_subject_key_idx
  ON public.fixed_apostilas (semester, subject_key);

CREATE INDEX IF NOT EXISTS fixed_apostilas_apostila_id_idx
  ON public.fixed_apostilas (apostila_id);

GRANT SELECT ON public.fixed_apostilas TO authenticated;
GRANT ALL ON public.fixed_apostilas TO service_role;

ALTER TABLE public.fixed_apostilas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read fixed apostilas" ON public.fixed_apostilas;
CREATE POLICY "Authenticated can read fixed apostilas"
  ON public.fixed_apostilas FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage fixed apostilas" ON public.fixed_apostilas;
CREATE POLICY "Admins manage fixed apostilas"
  ON public.fixed_apostilas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Uma apostila com conteúdo criado em páginas não pode continuar invisível
-- por causa de published=false herdado de um placeholder ou rascunho antigo.
UPDATE public.apostilas AS a
SET published = true,
    updated_at = now()
WHERE a.published = false
  AND EXISTS (
    SELECT 1
    FROM public.apostila_pages AS p
    WHERE p.apostila_id = a.id
      AND btrim(coalesce(p.content, '')) <> ''
  );

-- Proteção permanente para páginas salvas depois desta migração. O editor
-- também faz esta atualização explicitamente, mas o trigger evita que um
-- cliente administrativo diferente deixe a página invisível aos alunos.
CREATE OR REPLACE FUNCTION public.publish_apostila_when_page_has_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF btrim(coalesce(NEW.content, '')) <> '' THEN
    UPDATE public.apostilas
    SET published = true,
        updated_at = now()
    WHERE id = NEW.apostila_id
      AND published IS DISTINCT FROM true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_publish_apostila_when_page_has_content
  ON public.apostila_pages;

CREATE TRIGGER trg_publish_apostila_when_page_has_content
AFTER INSERT OR UPDATE OF content ON public.apostila_pages
FOR EACH ROW
EXECUTE FUNCTION public.publish_apostila_when_page_has_content();
