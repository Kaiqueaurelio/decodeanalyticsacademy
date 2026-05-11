/**
 * Lógica oficial UNIP de aprovação:
 *  - Média = (NP1 + NP2) / 2
 *  - Aprovado direto se Média >= 7
 *  - Caso contrário, vai para Exame:
 *    Final = (Média + Exame) / 2  (ou seja, (NP1 + NP2 + 2*Exame) / 4)
 *    Aprovado no exame se Final >= 5 ... usamos a regra padrão:
 *    nota mínima exame = 10 - Média  (assim (Média + Exame)/2 = 5)
 *  - Frequência mínima 75% (não tratada aqui).
 */

export type GradeStatus = 'approved' | 'exam' | 'failed' | 'pending';

export interface GradeResult {
  np1: number | null;
  np2: number | null;
  exam: number | null;
  average: number | null; // (NP1+NP2)/2
  needNp2ForApproval: number | null; // dado NP1, mínimo na NP2 para média 7
  needNp2ForExam: number | null; // mínimo na NP2 p/ pelo menos ir ao exame com chance real (>=3 para mínimo de exame ser 7)
  needExam: number | null; // se já tem NP1+NP2<7
  finalGrade: number | null; // se tem exam
  status: GradeStatus;
  message: string;
}

const clamp = (n: number, min = 0, max = 10) => Math.max(min, Math.min(max, n));
const round = (n: number) => Math.round(n * 100) / 100;

export function computeGrade(input: { np1?: number | null; np2?: number | null; exam?: number | null }): GradeResult {
  const np1 = input.np1 ?? null;
  const np2 = input.np2 ?? null;
  const exam = input.exam ?? null;

  const average = np1 !== null && np2 !== null ? round((np1 + np2) / 2) : null;

  // Sugestões a partir só da NP1
  const needNp2ForApproval = np1 !== null ? round(clamp(14 - np1)) : null;
  // Para evitar reprovação direta (nota máxima de exame é 10): precisa ter Média >= 0,
  // mas para passar no exame precisa Média + Exame >= 10 ⇒ se Exame=10, Média>=0.
  // Aqui sugerimos NP2 mínima para que mínima de exame seja viável (<=8): NP2 >= 6 - NP1.
  const needNp2ForExam = np1 !== null ? round(clamp(6 - np1, 0, 10)) : null;

  if (np1 === null || np2 === null) {
    return {
      np1, np2, exam, average,
      needNp2ForApproval, needNp2ForExam, needExam: null, finalGrade: null,
      status: 'pending',
      message: np1 === null
        ? 'Informe ao menos a NP1 para começar a simulação.'
        : `Para passar direto na NP2 você precisa de ${needNp2ForApproval?.toFixed(1)}.`,
    };
  }

  if (average !== null && average >= 7) {
    return {
      np1, np2, exam, average,
      needNp2ForApproval, needNp2ForExam, needExam: 0, finalGrade: average,
      status: 'approved',
      message: `Aprovado direto com média ${average.toFixed(2)}. Sem exame.`,
    };
  }

  // Vai para exame: precisa (Média + Exame)/2 >= 5 ⇒ Exame >= 10 - Média
  const needExam = round(clamp(10 - (average ?? 0)));

  if (exam !== null) {
    const finalGrade = round((average! + exam) / 2);
    const passed = finalGrade >= 5;
    return {
      np1, np2, exam, average,
      needNp2ForApproval, needNp2ForExam, needExam, finalGrade,
      status: passed ? 'approved' : 'failed',
      message: passed
        ? `Aprovado no exame com final ${finalGrade.toFixed(2)}.`
        : `Reprovado. Final ${finalGrade.toFixed(2)} (precisava de ${needExam.toFixed(1)} no exame).`,
    };
  }

  if (needExam > 10) {
    return {
      np1, np2, exam, average,
      needNp2ForApproval, needNp2ForExam, needExam, finalGrade: null,
      status: 'failed',
      message: `Reprovado por nota: precisaria de ${needExam.toFixed(1)} no exame (máx. 10).`,
    };
  }

  return {
    np1, np2, exam, average,
    needNp2ForApproval, needNp2ForExam, needExam, finalGrade: null,
    status: 'exam',
    message: `Vai para exame. Precisa tirar ${needExam.toFixed(1)} para passar.`,
  };
}

export const STATUS_COLORS: Record<GradeStatus, { bg: string; text: string; label: string }> = {
  approved: { bg: 'bg-emerald-500/15 border-emerald-500/40', text: 'text-emerald-300', label: 'Aprovado' },
  exam: { bg: 'bg-amber-500/15 border-amber-500/40', text: 'text-amber-300', label: 'Exame' },
  failed: { bg: 'bg-rose-500/15 border-rose-500/40', text: 'text-rose-300', label: 'Reprovado' },
  pending: { bg: 'bg-muted/30 border-border', text: 'text-muted-foreground', label: 'Em aberto' },
};
