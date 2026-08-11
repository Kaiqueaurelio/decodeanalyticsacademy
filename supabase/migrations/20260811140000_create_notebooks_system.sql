-- Create Notebooks and Pages system
CREATE TABLE public.notebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject_id TEXT NOT NULL, -- Logical link to the subject name/category
    title TEXT NOT NULL,
    cover_url TEXT,
    semester TEXT,
    status TEXT DEFAULT 'A cursar',
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, subject_id)
);

CREATE TABLE public.notebook_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notebook_id UUID REFERENCES public.notebooks(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.notebook_page_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES public.notebook_pages(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'text', 'image', 'file', 'code', 'video', 'link', 'note', 'checklist', 'exercise'
    content JSONB NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS & Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notebooks TO authenticated;
GRANT ALL ON public.notebooks TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notebook_pages TO authenticated;
GRANT ALL ON public.notebook_pages TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notebook_page_contents TO authenticated;
GRANT ALL ON public.notebook_page_contents TO service_role;

ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_page_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notebooks"
ON public.notebooks FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage pages of their own notebooks"
ON public.notebook_pages FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.notebooks
        WHERE notebooks.id = notebook_pages.notebook_id
        AND notebooks.user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage contents of their own pages"
ON public.notebook_page_contents FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.notebook_pages
        JOIN public.notebooks ON notebooks.id = notebook_pages.notebook_id
        WHERE notebook_pages.id = notebook_page_contents.page_id
        AND notebooks.user_id = auth.uid()
    )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notebooks_updated_at BEFORE UPDATE ON public.notebooks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_notebook_pages_updated_at BEFORE UPDATE ON public.notebook_pages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_notebook_page_contents_updated_at BEFORE UPDATE ON public.notebook_page_contents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
