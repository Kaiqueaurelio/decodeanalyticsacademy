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
    'logica de programacao', 'matematica discreta', 'introducao a computacao',
    'introducao à computacao', 'comunicacao e expressao',
    'fundamentos de sistemas de informacao',
  ],
  2: [
    'orientada a objeto', 'poo', 'calculo diferencial', 'calculo i', 'calculo',
    'algebra linear', 'arquitetura e organizacao de computadores',
  ],
  3: [
    'estrutura de dados', 'estruturas de dados', 'banco de dados',
    'probabilidade', 'estatistica', 'engenharia de software',
    'aps iii', 'atividades praticas supervisionadas iii',
  ],
  4: [
    'programacao web', 'desenvolvimento web', 'analise e projeto de sistemas',
    'compiladores', 'computabilidade', 'banco de dados ii',
    'aps iv', 'atividades praticas supervisionadas iv',
  ],
  5: [
    'inteligencia artificial', 'arquitetura de redes', 'redes de computadores',
    'sistemas operacionais', 'teoria dos grafos',
    'arquitetura de computadores modernos', 'linguagens formais', 'automatos',
    'computacao grafica', 'analise matematica',
    'aps v', 'atividades praticas supervisionadas v',
  ],
  6: [
    'sistemas distribuidos', 'engenharia de software ii',
    'dispositivos moveis', 'mineracao de dados', 'ciencia de dados',
    'analise de algoritmos',
    'aps vi', 'atividades praticas supervisionadas vi',
  ],
  7: [
    'seguranca da informacao', 'computacao em nuvem', 'cloud computing',
    'aprendizado de maquina', 'machine learning', 'topicos especiais',
    'aps vii', 'atividades praticas supervisionadas vii',
  ],
  8: [
    'trabalho de conclusao', 'tcc', 'empreendedorismo',
    'gestao de projetos', 'etica profissional',
    'aps viii', 'atividades praticas supervisionadas viii',
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
