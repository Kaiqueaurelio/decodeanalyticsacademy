-- Create versions table
CREATE TABLE IF NOT EXISTS public.apostila_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apostila_id UUID REFERENCES public.apostilas(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    semester INTEGER,
    course TEXT[],
    saved_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Grant permissions
GRANT SELECT, INSERT ON public.apostila_versions TO authenticated;
GRANT ALL ON public.apostila_versions TO service_role;

-- Enable RLS
ALTER TABLE public.apostila_versions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view versions of accessible apostilas"
ON public.apostila_versions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.apostilas
        WHERE id = apostila_versions.apostila_id
        AND (published = true OR public.has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Admins can create versions"
ON public.apostila_versions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Helper function for snapshots
CREATE OR REPLACE FUNCTION public.snapshot_apostila_version(_apostila_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
    v_title TEXT;
    v_content TEXT;
    v_category TEXT;
    v_semester INTEGER;
    v_course TEXT[];
    v_saved_date DATE;
    v_user_id UUID := auth.uid();
BEGIN
    SELECT title, content, category, semester, course, saved_date 
    INTO v_title, v_content, v_category, v_semester, v_course, v_saved_date
    FROM public.apostilas 
    WHERE id = _apostila_id;

    INSERT INTO public.apostila_versions (
        apostila_id, title, content, category, semester, course, saved_date, created_by
    ) VALUES (
        _apostila_id, v_title, v_content, v_category, v_semester, v_course, v_saved_date, v_user_id
    ) RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;
