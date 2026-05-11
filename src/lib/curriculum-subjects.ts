/**
 * Grade curricular canônica UNIP por curso e semestre.
 * Usado na Calculadora de Aprovação para mostrar TODAS as matérias do
 * semestre do aluno, mesmo que ainda não tenham apostila cadastrada.
 *
 * Cursos: CC (Ciência da Computação), SI (Sistemas de Informação),
 * EC (Engenharia de Computação).
 */

export type CourseCode = "CC" | "SI" | "EC";

// Núcleo comum a CC / SI / EC nos primeiros semestres + específicas
const CC: Record<number, string[]> = {
  1: [
    "Lógica de Programação",
    "Matemática Discreta",
    "Introdução à Computação",
    "Comunicação e Expressão",
    "Fundamentos de Sistemas de Informação",
    "Atividades Práticas Supervisionadas I",
  ],
  2: [
    "Programação Orientada a Objetos",
    "Cálculo Diferencial e Integral",
    "Álgebra Linear",
    "Arquitetura e Organização de Computadores",
    "Estatística",
    "Atividades Práticas Supervisionadas II",
  ],
  3: [
    "Estrutura de Dados",
    "Banco de Dados",
    "Probabilidade e Estatística",
    "Engenharia de Software",
    "Sistemas Operacionais",
    "Atividades Práticas Supervisionadas III",
  ],
  4: [
    "Programação Web",
    "Análise e Projeto de Sistemas",
    "Compiladores",
    "Computabilidade",
    "Banco de Dados II",
    "Atividades Práticas Supervisionadas IV",
  ],
  5: [
    "Inteligência Artificial",
    "Arquitetura de Redes",
    "Redes de Computadores",
    "Sistemas Operacionais",
    "Teoria dos Grafos",
    "Arquitetura de Computadores Modernos",
    "Linguagens Formais e Autômatos",
    "Computação Gráfica",
    "Análise Matemática",
    "Atividades Práticas Supervisionadas V",
  ],
  6: [
    "Sistemas Distribuídos",
    "Engenharia de Software II",
    "Dispositivos Móveis",
    "Mineração de Dados",
    "Ciência de Dados",
    "Análise de Algoritmos",
    "Atividades Práticas Supervisionadas VI",
  ],
  7: [
    "Segurança da Informação",
    "Computação em Nuvem",
    "Aprendizado de Máquina",
    "Tópicos Especiais em Computação",
    "Atividades Práticas Supervisionadas VII",
  ],
  8: [
    "Trabalho de Conclusão de Curso",
    "Empreendedorismo",
    "Gestão de Projetos",
    "Ética Profissional",
    "Atividades Práticas Supervisionadas VIII",
  ],
};

// SI compartilha grande parte com CC; mantemos a mesma base por enquanto.
const SI: Record<number, string[]> = CC;
// EC idem (engenharia tem cálculos extras, mas evitamos duplicar nomes)
const EC: Record<number, string[]> = CC;

const BY_COURSE: Record<CourseCode, Record<number, string[]>> = { CC, SI, EC };

/** Retorna as matérias canônicas do curso/semestre. */
export function getCurriculumSubjects(
  course: string | null | undefined,
  semester: number | null | undefined
): string[] {
  if (!semester) return [];
  const c = (course as CourseCode) || "CC";
  const list = BY_COURSE[c]?.[semester] ?? CC[semester] ?? [];
  return [...list];
}

const stripAccents = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** Chave normalizada para deduplicar nomes de matéria. */
export function subjectKey(s: string): string {
  return stripAccents(s).replace(/\s+/g, " ");
}
