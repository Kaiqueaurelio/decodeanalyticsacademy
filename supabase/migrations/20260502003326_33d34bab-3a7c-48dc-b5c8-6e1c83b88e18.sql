-- Adiciona suporte a semestre e cursos por apostila
ALTER TABLE public.apostilas
  ADD COLUMN IF NOT EXISTS semester smallint,
  ADD COLUMN IF NOT EXISTS course text[];

-- Trigger de validação (sem CHECK constraint)
CREATE OR REPLACE FUNCTION public.validate_apostila_semester_course()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.semester IS NOT NULL AND (NEW.semester < 1 OR NEW.semester > 12) THEN
    RAISE EXCEPTION 'semester must be between 1 and 12';
  END IF;
  IF NEW.course IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM unnest(NEW.course) AS c WHERE c NOT IN ('CC','SI','EC')
    ) THEN
      RAISE EXCEPTION 'course array must contain only CC, SI or EC';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apostilas_validate_semester_course ON public.apostilas;
CREATE TRIGGER apostilas_validate_semester_course
  BEFORE INSERT OR UPDATE ON public.apostilas
  FOR EACH ROW EXECUTE FUNCTION public.validate_apostila_semester_course();

-- Index para query do aluno
CREATE INDEX IF NOT EXISTS idx_apostilas_semester_published
  ON public.apostilas (semester, published);

-- Pré-classificação automática (grade UNIP CC) — só onde semester é NULL
UPDATE public.apostilas SET semester = 1 WHERE semester IS NULL AND category IN (
  'Lógica de Programação e Algoritmos','Lógica de Programação',
  'Matemática Discreta','Introdução à Computação','Introdução a Computação',
  'Comunicação e Expressão','Fundamentos de Sistemas de Informação'
);
UPDATE public.apostilas SET semester = 2 WHERE semester IS NULL AND category IN (
  'Linguagem de Programação Orientada a Objetos','Programação Orientada a Objetos',
  'Cálculo Diferencial e Integral','Cálculo','Álgebra Linear',
  'Arquitetura e Organização de Computadores'
);
UPDATE public.apostilas SET semester = 3 WHERE semester IS NULL AND category IN (
  'Estrutura de Dados','Estruturas de Dados','Banco de Dados',
  'Probabilidade e Estatística','Estatística','Engenharia de Software',
  'Atividades Práticas Supervisionadas III','APS III'
);
UPDATE public.apostilas SET semester = 4 WHERE semester IS NULL AND category IN (
  'Programação Web','Desenvolvimento Web','Análise e Projeto de Sistemas',
  'Compiladores e Computabilidade','Compiladores','Banco de Dados II',
  'Atividades Práticas Supervisionadas IV','APS IV'
);
UPDATE public.apostilas SET semester = 5 WHERE semester IS NULL AND category IN (
  'Inteligência Artificial','Arquitetura de Redes de Computadores','Redes de Computadores',
  'Sistemas Operacionais','Teoria dos Grafos','Arquitetura de Computadores Modernos',
  'Linguagens Formais e Autômatos','Computação Gráfica','Análise Matemática',
  'Atividades Práticas Supervisionadas V','APS V'
);
UPDATE public.apostilas SET semester = 6 WHERE semester IS NULL AND category IN (
  'Sistemas Distribuídos','Engenharia de Software II','Programação para Dispositivos Móveis',
  'Mineração de Dados','Ciência de Dados','Análise de Algoritmos',
  'Atividades Práticas Supervisionadas VI','APS VI'
);
UPDATE public.apostilas SET semester = 7 WHERE semester IS NULL AND category IN (
  'Segurança da Informação','Computação em Nuvem','Cloud Computing',
  'Aprendizado de Máquina','Machine Learning','Tópicos Especiais',
  'Atividades Práticas Supervisionadas VII','APS VII'
);
UPDATE public.apostilas SET semester = 8 WHERE semester IS NULL AND category IN (
  'Trabalho de Conclusão de Curso','TCC','Empreendedorismo',
  'Gestão de Projetos','Ética Profissional',
  'Atividades Práticas Supervisionadas VIII','APS VIII'
);