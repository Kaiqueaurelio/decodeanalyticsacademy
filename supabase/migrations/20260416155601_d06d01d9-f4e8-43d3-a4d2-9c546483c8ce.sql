-- Add essay question support to exercises
ALTER TABLE public.exercises
ADD COLUMN type text NOT NULL DEFAULT 'objective',
ADD COLUMN min_chars integer NOT NULL DEFAULT 100,
ADD COLUMN reference_answer text;

-- Create respostas_foto table
CREATE TABLE public.respostas_foto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exercise_id uuid REFERENCES public.exercises(id) ON DELETE CASCADE,
  imagem_url text NOT NULL,
  feedback_ia text,
  nota numeric(4,1),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.respostas_foto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own respostas_foto"
ON public.respostas_foto FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own respostas_foto"
ON public.respostas_foto FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own respostas_foto"
ON public.respostas_foto FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all respostas_foto"
ON public.respostas_foto FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for photo responses
INSERT INTO storage.buckets (id, name, public) VALUES ('respostas-foto', 'respostas-foto', true);

CREATE POLICY "Public read access for respostas-foto"
ON storage.objects FOR SELECT
USING (bucket_id = 'respostas-foto');

CREATE POLICY "Authenticated users can upload to respostas-foto"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'respostas-foto');
