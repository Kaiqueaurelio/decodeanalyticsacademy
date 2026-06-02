import { BarChart3, Brain, Code2, Database, GraduationCap, Network, ShieldCheck, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type FreeCourseStatus = 'available' | 'soon';

export interface FreeCourse {
  id: string;
  title: string;
  provider: string;
  area: string;
  description: string;
  workload: string;
  certificate: string;
  validityNote: string;
  linkUrl: string;
  status: FreeCourseStatus;
  featured?: boolean;
  tags: string[];
  icon: LucideIcon;
}

export const FREE_COURSES: FreeCourse[] = [
  {
    id: 'python-data-analysis',
    title: 'Python para Analise de Dados',
    provider: 'Curso gratuito validado pela faculdade',
    area: 'Dados',
    description: 'Fundamentos de Python, notebooks, manipulacao de dados e pequenos projetos para portfolio academico.',
    workload: '20h',
    certificate: 'Certificado aceito mediante regras da faculdade',
    validityNote: 'Conferir regulamento da disciplina antes de enviar as horas.',
    linkUrl: '#',
    status: 'soon',
    featured: true,
    tags: ['Python', 'Dados', 'Portfolio'],
    icon: BarChart3,
  },
  {
    id: 'sql-fundamentals',
    title: 'SQL e Banco de Dados Essencial',
    provider: 'Curso gratuito validado pela faculdade',
    area: 'Banco de Dados',
    description: 'Consultas SQL, modelagem basica, joins, filtros, agregacoes e boas praticas para atividades academicas.',
    workload: '15h',
    certificate: 'Certificado aceito mediante regras da faculdade',
    validityNote: 'Substituir o link pelo curso oficial aprovado quando disponivel.',
    linkUrl: '#',
    status: 'soon',
    tags: ['SQL', 'Modelagem', 'Banco de Dados'],
    icon: Database,
  },
  {
    id: 'ai-fundamentals',
    title: 'Fundamentos de Inteligencia Artificial',
    provider: 'Curso gratuito validado pela faculdade',
    area: 'IA',
    description: 'Conceitos de IA, aprendizado de maquina, prompts, etica e exemplos praticos para estudantes de computacao.',
    workload: '12h',
    certificate: 'Certificado aceito mediante regras da faculdade',
    validityNote: 'Usar como trilha complementar junto das apostilas de IA.',
    linkUrl: '#',
    status: 'soon',
    featured: true,
    tags: ['IA', 'Machine Learning', 'Etica'],
    icon: Brain,
  },
  {
    id: 'web-programming',
    title: 'Programacao Web com HTML, CSS e JavaScript',
    provider: 'Curso gratuito validado pela faculdade',
    area: 'Programacao',
    description: 'Base de front-end, DOM, responsividade e pequenos exercicios para fixar logica e construcao de interfaces.',
    workload: '18h',
    certificate: 'Certificado aceito mediante regras da faculdade',
    validityNote: 'Ideal para alunos que precisam reforcar a base antes de frameworks.',
    linkUrl: '#',
    status: 'soon',
    tags: ['HTML', 'CSS', 'JavaScript'],
    icon: Code2,
  },
  {
    id: 'networks-intro',
    title: 'Introducao a Redes de Computadores',
    provider: 'Curso gratuito validado pela faculdade',
    area: 'Redes',
    description: 'Protocolos, modelo OSI/TCP-IP, enderecamento, roteamento basico e conceitos para provas da faculdade.',
    workload: '10h',
    certificate: 'Certificado aceito mediante regras da faculdade',
    validityNote: 'Recomendado para complementar Arquitetura de Redes.',
    linkUrl: '#',
    status: 'soon',
    tags: ['Redes', 'TCP/IP', 'Protocolos'],
    icon: Network,
  },
  {
    id: 'cybersecurity-basics',
    title: 'Seguranca Digital para Iniciantes',
    provider: 'Curso gratuito validado pela faculdade',
    area: 'Seguranca',
    description: 'Boas praticas, senhas, golpes, fundamentos de seguranca e postura profissional em ambientes digitais.',
    workload: '8h',
    certificate: 'Certificado aceito mediante regras da faculdade',
    validityNote: 'Curso introdutorio para atividades complementares.',
    linkUrl: '#',
    status: 'soon',
    tags: ['Seguranca', 'Boas Praticas', 'Carreira'],
    icon: ShieldCheck,
  },
];

export const COURSE_AREAS = ['Todos', ...Array.from(new Set(FREE_COURSES.map((course) => course.area)))];

export const COURSES_PAGE_STATS = [
  { label: 'Cursos gratuitos', value: FREE_COURSES.length, icon: GraduationCap },
  { label: 'Trilhas em destaque', value: FREE_COURSES.filter((course) => course.featured).length, icon: Sparkles },
  { label: 'Areas cobertas', value: COURSE_AREAS.length - 1, icon: BarChart3 },
];
