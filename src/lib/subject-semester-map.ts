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

/** Chave normalizada para deduplicar nomes de matéria. */
export function subjectKey(s: string): string {
  return stripAccents(s).replace(/\s+/g, ' ');
}

// Lista canônica por semestre (subset de keywords). A ordem importa: testamos
// do 8º ao 1º para que termos mais específicos (ex: "II") batam antes.
export const BY_SEMESTER: Record<number, string[]> = {
  1: [
    'Logica de Programacao', 'Matematica Discreta', 'Introducao a Computacao',
    'Comunicacao e Expressao', 'Fundamentos de Sistemas de Informacao',
    'Sociedade e Tecnologia', 'Estudos Disciplinares I',
    'Matematica para Computacao', 'Introducao a Ciencia da Computacao',
  ],
  2: [
    'Linguagem de Programacao Orientada a Objeto', 'Calculo Diferencial e Integral I',
    'Algebra Linear', 'Arquitetura e Organizacao de Computadores',
    'Fisica para Computacao', 'Metodologia Cientifica', 'Estudos Disciplinares II',
    'Atividades Praticas Supervisionadas II (APS)',
  ],
  3: [
    'Estrutura de Dados', 'Banco de Dados I', 'Probabilidade e Estatistica',
    'Engenharia de Software', 'Atividades Praticas Supervisionadas III (APS)',
    'Organizacao de Computadores', 'Estudos Disciplinares III',
    'Algoritmos e Estruturas de Dados',
  ],
  4: [
    'Programacao Web', 'Analise e Projeto de Sistemas',
    'Compiladores', 'Computabilidade', 'Banco de Dados II',
    'Atividades Praticas Supervisionadas IV (APS)',
    'Redes de Computadores I', 'Estudos Disciplinares IV',
    'Teoria da Computacao',
  ],
  5: [
    'Inteligencia Artificial', 'Arquitetura de Redes', 'Redes de Computadores II',
    'Sistemas Operacionais I', 'Teoria dos Grafos',
    'Arquitetura de Computadores Modernos', 'Linguagens Formais e Automatos',
    'Computacao Grafica', 'Analise Matematica',
    'Atividades Praticas Supervisionadas V (APS)',
    'Estudos Disciplinares V',
  ],
  6: [
    'Pesquisa Operacional',
    'Sistemas Operacionais e Mobile',
    'Calculo Numerico Computacional',
    'Aspectos Teoricos da Computacao',
    'Gestao de Projetos I',
    'Processamento de Imagem e Visao Computacional',
    'Ciencia de Dados',
    'Metodos de Pesquisa',
    'Interdisciplinar de Ciencia da Computacao',
    'Atividades Praticas Supervisionadas VI (APS)',
    'Estudos Disciplinares VI',
  ],
  7: [
    'Seguranca da Informacao', 'Computacao em Nuvem',
    'Aprendizado de Maquina (Machine Learning)', 'Topicos Especiais de Computacao',
    'Sistemas Digitais', 'Trabalho de Conclusao de Curso I (TCC)',
    'Atividades Praticas Supervisionadas VII (APS)',
    'Estudos Disciplinares VII',
  ],
  8: [
    'Trabalho de Conclusao de Curso II (TCC)', 'Empreendedorismo',
    'Gestao de Projetos II', 'Etica Profissional',
    'Computacao de Alto Desempenho', 'Realidade Virtual e Aumentada',
    'Atividades Praticas Supervisionadas VIII (APS)',
    'Estudos Disciplinares VIII',
  ],
};

/**
 * Chave única para a mesma disciplina, inclusive quando um registro antigo
 * veio com acentos, sufixos entre parênteses ou pequenas descrições extras.
 */
export function canonicalSubjectKey(subject?: string | null): string {
  const raw = subjectKey(subject || '').replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';

  const aliases: Record<string, string> = {
    'sistemas operacionais abertos e mobile': 'sistemas operacionais e mobile',
    'sist operac abertos e mobile': 'sistemas operacionais e mobile',
    'processamento de imagem e visao comp': 'processamento de imagem e visao computacional',
    'procs de imagem e visao comp': 'processamento de imagem e visao computacional',
    'aspct teoricos da computacao': 'aspectos teoricos da computacao',
  };
  const aliased = aliases[raw] || raw;

  const known = Object.values(BY_SEMESTER)
    .flat()
    .map(subjectKey)
    .sort((a, b) => b.length - a.length);
  return known.find((candidate) => aliased === candidate || aliased.includes(candidate) || candidate.includes(aliased)) || aliased;
}

export function sameSubject(first?: string | null, second?: string | null): boolean {
  const a = canonicalSubjectKey(first);
  const b = canonicalSubjectKey(second);
  return !!a && a === b;
}

/** Retorna o semestre (1–8) que melhor casa com a disciplina, ou null. */
export function guessSemesterFromCategory(category?: string | null): number | null {
  if (!category) return null;
  const hay = stripAccents(category);
  
  // 1. Tenta match EXATO primeiro (mais preciso)
  for (let sem = 1; sem <= 8; sem++) {
    for (const kw of BY_SEMESTER[sem]) {
      if (stripAccents(kw) === hay) return sem;
    }
  }

  // 2. Fallback: match parcial (testa do 8º ao 1º para termos mais específicos primeiro)
  for (let sem = 8; sem >= 1; sem--) {
    for (const kw of BY_SEMESTER[sem]) {
      if (hay.includes(stripAccents(kw))) return sem;
    }
  }
  return null;
}

/** Label amigável do semestre. */
export function semesterLabel(sem: number | null | undefined): string {
  if (sem === 0) return 'Grade Comum / ENEM';
  if (!sem) return 'Grade Livre';
  return `Semestre ${sem}`;
}

/** Label curto. */
export function semesterShort(sem: number | null | undefined): string {
  if (!sem) return 'Livre';
  return `${sem}º sem`;
}

export const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export const COURSE_OPTIONS = ['CC', 'SI', 'EC'] as const;
export type CourseCode = (typeof COURSE_OPTIONS)[number];
