
CREATE TABLE public.free_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  provider text NOT NULL DEFAULT 'Curso gratuito validado pela faculdade',
  area text NOT NULL DEFAULT 'Outros',
  description text NOT NULL DEFAULT '',
  workload text NOT NULL DEFAULT '',
  certificate text NOT NULL DEFAULT 'Certificado aceito mediante regras da faculdade',
  validity_note text NOT NULL DEFAULT '',
  link_url text NOT NULL DEFAULT '#',
  status text NOT NULL DEFAULT 'available',
  featured boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  icon_key text NOT NULL DEFAULT 'graduation',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.free_courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.free_courses TO authenticated;
GRANT ALL ON public.free_courses TO service_role;

ALTER TABLE public.free_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active free courses"
  ON public.free_courses FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert free courses"
  ON public.free_courses FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update free courses"
  ON public.free_courses FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete free courses"
  ON public.free_courses FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER free_courses_set_updated_at
BEFORE UPDATE ON public.free_courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER free_courses_validate_status
BEFORE INSERT OR UPDATE ON public.free_courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial (preserva o catálogo existente)
INSERT INTO public.free_courses (title, area, description, workload, validity_note, link_url, status, featured, tags, icon_key, sort_order) VALUES
('Python para Análise de Dados','Dados','Fundamentos de Python, notebooks, manipulação de dados e pequenos projetos para portfólio acadêmico.','20h','Conferir regulamento da disciplina antes de enviar as horas.','#','soon',true,ARRAY['Python','Dados','Portfolio']::text[],'chart',10),
('SQL e Banco de Dados Essencial','Banco de Dados','Consultas SQL, modelagem básica, joins, filtros, agregações e boas práticas.','15h','Substituir o link pelo curso oficial aprovado quando disponível.','#','soon',false,ARRAY['SQL','Modelagem','Banco de Dados']::text[],'database',20),
('Fundamentos de Inteligência Artificial','IA','Conceitos de IA, aprendizado de máquina, prompts, ética e exemplos práticos para estudantes de computação.','12h','Usar como trilha complementar junto das apostilas de IA.','#','soon',true,ARRAY['IA','Machine Learning','Etica']::text[],'brain',30),
('Programação Web com HTML, CSS e JavaScript','Programacao','Base de front-end, DOM, responsividade e exercícios para fixar lógica e construção de interfaces.','18h','Ideal para alunos que precisam reforçar a base antes de frameworks.','#','soon',false,ARRAY['HTML','CSS','JavaScript']::text[],'code',40),
('Introdução a Redes de Computadores','Redes','Protocolos, modelo OSI/TCP-IP, endereçamento, roteamento básico e conceitos para provas.','10h','Recomendado para complementar Arquitetura de Redes.','#','soon',false,ARRAY['Redes','TCP/IP','Protocolos']::text[],'network',50),
('Segurança Digital para Iniciantes','Seguranca','Boas práticas, senhas, golpes, fundamentos de segurança e postura profissional em ambientes digitais.','8h','Curso introdutório para atividades complementares.','#','soon',false,ARRAY['Seguranca','Boas Praticas','Carreira']::text[],'shield',60);
