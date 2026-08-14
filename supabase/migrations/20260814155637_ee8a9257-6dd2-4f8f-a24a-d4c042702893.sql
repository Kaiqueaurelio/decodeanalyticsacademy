
-- 1. Tabela de Quizzes (metadados)
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  time_limit INTEGER, -- em segundos (opcional)
  min_score_percent INTEGER DEFAULT 50,
  max_attempts INTEGER DEFAULT 3,
  show_immediate_feedback BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de Perguntas
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'multiple-choice', 'true-false', 'open', 'ordering', 'matching'
  question TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  points INTEGER DEFAULT 10,
  options JSONB DEFAULT '[]', -- Para múltiplas escolhas e ordenação
  correct_answer JSONB, -- Resposta esperada (depende do tipo)
  image_url TEXT,
  explanation TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela de Submissões
CREATE TABLE IF NOT EXISTS public.quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '{}', -- Respostas enviadas
  time_spent INTEGER, -- segundos
  passed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON public.quizzes TO authenticated;
GRANT SELECT ON public.quiz_questions TO authenticated;
GRANT SELECT, INSERT ON public.quiz_submissions TO authenticated;

GRANT ALL ON public.quizzes TO service_role;
GRANT ALL ON public.quiz_questions TO service_role;
GRANT ALL ON public.quiz_submissions TO service_role;

-- Policies
CREATE POLICY "Anyone authenticated can view quizzes" ON public.quizzes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone authenticated can view questions" ON public.quiz_questions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their own submissions" ON public.quiz_submissions
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage everything" ON public.quizzes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage questions" ON public.quiz_questions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
