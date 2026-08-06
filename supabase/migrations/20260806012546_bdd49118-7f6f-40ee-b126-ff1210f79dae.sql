CREATE TABLE public.apostila_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    apostila_id uuid REFERENCES public.apostilas(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    title text,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, DELETE ON public.apostila_versions TO authenticated;
GRANT ALL ON public.apostila_versions TO service_role;

ALTER TABLE public.apostila_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage versions"
ON public.apostila_versions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
