DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_type') THEN
        CREATE TYPE public.job_type AS ENUM ('job', 'internship', 'freelance');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_logo_url TEXT,
    description TEXT NOT NULL,
    requirements TEXT,
    location TEXT,
    type public.job_type NOT NULL DEFAULT 'job',
    salary_range TEXT,
    application_link TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

GRANT SELECT ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.jobs TO authenticated;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage jobs"
ON public.jobs FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql' SET search_path = public;

DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
