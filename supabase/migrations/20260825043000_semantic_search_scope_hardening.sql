-- Corrige o vazamento de escopo na busca semântica.
-- A função anterior era SECURITY DEFINER e retornava todas as apostilas publicadas,
-- ignorando o content_scope do usuário que chamou a Edge Function.

CREATE OR REPLACE FUNCTION public.match_semantic_content(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  apostila_id uuid,
  title text,
  content text,
  similarity float,
  type text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_scope text;
  v_is_admin boolean;
  v_limit int := LEAST(GREATEST(COALESCE(match_count, 0), 0), 50);
  v_threshold float := GREATEST(LEAST(COALESCE(match_threshold, 0.5), 1), -1);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_scope := public.get_content_scope(v_user_id);
  v_is_admin := public.has_role(v_user_id, 'admin'::app_role);

  RETURN QUERY
  SELECT
    a.id,
    a.id AS apostila_id,
    a.title,
    COALESCE(a.content, '') AS content,
    1 - (a.embedding <=> query_embedding) AS similarity,
    'apostila'::text AS type
  FROM public.apostilas AS a
  WHERE a.embedding IS NOT NULL
    AND 1 - (a.embedding <=> query_embedding) > v_threshold
    AND a.published = true
    AND (
      v_is_admin
      OR (
        v_scope = 'full'
        AND (a.category IS NULL OR a.category NOT IN ('ENEM', 'Simulados ENEM'))
      )
      OR (
        v_scope = 'enem_only'
        AND a.category IN ('ENEM', 'Simulados ENEM')
      )
    )

  UNION ALL

  SELECT
    p.id,
    p.apostila_id,
    p.title,
    p.content,
    1 - (p.embedding <=> query_embedding) AS similarity,
    'page'::text AS type
  FROM public.apostila_pages AS p
  INNER JOIN public.apostilas AS a ON a.id = p.apostila_id
  WHERE p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > v_threshold
    AND a.published = true
    AND (
      v_is_admin
      OR (
        v_scope = 'full'
        AND (a.category IS NULL OR a.category NOT IN ('ENEM', 'Simulados ENEM'))
      )
      OR (
        v_scope = 'enem_only'
        AND a.category IN ('ENEM', 'Simulados ENEM')
      )
    )

  ORDER BY similarity DESC
  LIMIT v_limit;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.match_semantic_content(vector, float, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_semantic_content(vector, float, int) TO authenticated;
