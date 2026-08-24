-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. EMBEDDINGS FOR PAGES
ALTER TABLE public.apostila_pages ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS apostila_pages_embedding_idx ON public.apostila_pages
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. SEMANTIC SEARCH FUNCTION
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
BEGIN
  RETURN QUERY
  -- Matches in apostilas (summary/title level)
  SELECT 
    a.id,
    a.id as apostila_id,
    a.title,
    COALESCE(a.content, '') as content,
    1 - (a.embedding <=> query_embedding) as similarity,
    'apostila' as type
  FROM public.apostilas a
  WHERE 1 - (a.embedding <=> query_embedding) > match_threshold
    AND a.published = true
  
  UNION ALL
  
  -- Matches in pages (detailed content level)
  SELECT 
    p.id,
    p.apostila_id,
    p.title,
    p.content,
    1 - (p.embedding <=> query_embedding) as similarity,
    'page' as type
  FROM public.apostila_pages p
  JOIN public.apostilas a ON a.id = p.apostila_id
  WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
    AND a.published = true
    
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_semantic_content(vector, float, int) TO authenticated;

-- 5. DATABASE PROTECTION (RLS HARDENING)
-- Ensure sensitive tables are fully locked down
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can see app settings
CREATE POLICY "Admins can manage app_settings"
ON public.app_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Tighten RLS on user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 6. SECURITY LOGGING FOR SQL/TERMINAL
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  details jsonb,
  severity text DEFAULT 'info',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security logs"
ON public.security_audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.security_audit_logs TO authenticated;
GRANT ALL ON public.security_audit_logs TO service_role;

-- 7. SECRET KEYS PROTECTION (Vault simulation)
-- We store secrets in app_settings but encrypted if needed (simple check here)
COMMENT ON TABLE public.app_settings IS 'Sensitive configuration. ONLY server-side or admin access.';
