/**
 * Mapa disciplina → semestre da grade UNIP Ciência da Computação.
 * Usado no admin para auto-preencher o campo "Semestre" quando o admin
 * escolhe uma disciplina.
 *
 * Match case-insensitive sem acento. Retorna 1–8 ou null se não bater
 * (apostila extracurricular / livre).
 */

const stripAccents = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Lista canônica por semestre (subset de keywords). A ordem importa: testamos
// do 8º ao 1º para que termos mais específicos (ex: "II") batam antes.
export const BY_SEMESTER: Record<number, string[]> = {
  1: [
    'Logica de Programacao', 'Matematica Discreta', 'Introducao a Computacao',
    'Comunicacao e Expressao', 'Fundamentos de Sistemas de Informacao',
    'Sociedade e Tecnologia', 'Estudos Disciplinares I',
  ],
  2: [
    'Orientada a Objeto (POO)', 'Calculo Diferencial e Integral I',
    'Algebra Linear', 'Arquitetura e Organizacao de Computadores',
    'Fisica para Computacao', 'Metodologia Cientifica', 'Estudos Disciplinares II',
  ],
  3: [
    'Estrutura de Dados', 'Banco de Dados', 'Probabilidade e Estatistica',
    'Engenharia de Software', 'Atividades Praticas Supervisionadas III (APS)',
    'Organizacao de Computadores', 'Estudos Disciplinares III',
  ],
  4: [
    'Programacao Web', 'Analise e Projeto de Sistemas',
    'Compiladores', 'Computabilidade', 'Banco de Dados II',
    'Atividades Praticas Supervisionadas IV (APS)',
    'Redes de Computadores I', 'Estudos Disciplinares IV',
  ],
  5: [
    'Inteligencia Artificial', 'Arquitetura de Redes', 'Redes de Computadores',
    'Sistemas Operacionais', 'Teoria dos Grafos',
    'Arquitetura de Computadores Modernos', 'Linguagens Formais e Automatos',
    'Computacao Grafica', 'Analise Matematica',
    'Atividades Praticas Supervisionadas V (APS)',
  ],
  6: [
    'Sistemas Operacionais e Mobile', 'Calculo Numerico Computacional',
    'Pesquisa Operacional', 'Aspectos Teoricos da Computacao',
    'Gestao de Projetos', 'Processamento de Imagem e Visao Computacional',
    'Ciencia de Dados', 'Metodos de Pesquisa',
    'Interdisciplinar de Ciencia da Computacao',
    'Atividades Praticas Supervisionadas VI (APS)',
  ],
  7: [
    'Seguranca da Informacao', 'Computacao em Nuvem',
    'Aprendizado de Maquina (Machine Learning)', 'Topicos Especiais de Computacao',
    'Sistemas Digitais',
    'Atividades Praticas Supervisionadas VII (APS)',
  ],
  8: [
    'Trabalho de Conclusao de Curso (TCC)', 'Empreendedorismo',
    'Gestao de Projetos', 'Etica Profissional',
    'Computacao de Alto Desempenho',
    'Atividades Praticas Supervisionadas VIII (APS)',
  ],
};

/** Retorna o semestre (1–8) que melhor casa com a disciplina, ou null. */
export function guessSemesterFromCategory(category?: string | null): number | null {
  if (!category) return null;
  const hay = stripAccents(category);
  // Testa do 8º ao 1º (termos mais específicos primeiro)
  for (let sem = 8; sem >= 1; sem--) {
    for (const kw of BY_SEMESTER[sem]) {
      if (hay.includes(kw)) return sem;
    }
  }
  return null;
}

/** Label amigável do semestre. */
export function semesterLabel(sem: number | null | undefined): string {
  if (!sem) return 'Todos os semestres';
  return `${sem}º semestre`;
}

/** Label curto. */
export function semesterShort(sem: number | null | undefined): string {
  if (!sem) return 'Livre';
  return `${sem}º sem`;
}

export const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export const COURSE_OPTIONS = ['CC', 'SI', 'EC'] as const;
export type CourseCode = (typeof COURSE_OPTIONS)[number];
