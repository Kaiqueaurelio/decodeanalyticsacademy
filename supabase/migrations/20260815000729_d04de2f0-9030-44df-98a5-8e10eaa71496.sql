-- Create a table to track generation jobs (cloning and AI generation)
CREATE TABLE public.apostila_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apostila_id UUID REFERENCES public.apostilas(id) ON DELETE CASCADE,
    source_apostila_id UUID REFERENCES public.apostilas(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    type TEXT NOT NULL CHECK (type IN ('clone', 'ai_generate')),
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Table for detailed change history (beyond simple maintenance logs)
CREATE TABLE public.apostila_version_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apostila_id UUID REFERENCES public.apostilas(id) ON DELETE CASCADE,
    version_label TEXT,
    changes_summary TEXT,
    content_snapshot JSONB, -- Optional snapshot of content at this point
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.apostila_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostila_version_history ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apostila_generation_jobs TO authenticated;
GRANT ALL ON public.apostila_generation_jobs TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.apostila_version_history TO authenticated;
GRANT ALL ON public.apostila_version_history TO service_role;

-- Policies (Admin only for management, but authenticated for visibility if needed)
-- Using the existing public.has_role function
CREATE POLICY "Admins can manage generation jobs" 
ON public.apostila_generation_jobs 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage version history" 
ON public.apostila_version_history 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));
