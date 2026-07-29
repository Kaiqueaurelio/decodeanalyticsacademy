/**
 * Tipos e utilitários do módulo Plano de Estudos Inteligente.
 *
 * O plano gerado pela Ella é guardado como JSON na coluna `plan`, e o
 * cronograma também é materializado em tarefas marcáveis para acompanhar
 * a evolução do aluno.
 */

export type PlanBlock = {
  titulo: string;
  disciplina?: string;
  tipo?: 'estudo' | 'exercicios' | 'revisao' | 'simulado' | 'descanso';
  minutos?: number;
  descricao?: string;
};

export type PlanDay = { dia: string; blocos: PlanBlock[] };
export type PlanWeek = { semana: number; foco?: string; dias: PlanDay[] };

export type PlanContent = {
  titulo?: string;
  objetivo_principal?: string;
  resumo?: string;
  disciplinas?: { nome: string; prioridade?: string; ordem?: number; por_que?: string }[];
  ordem_recomendada?: string[];
  carga_horaria?: { por_dia_horas?: number; por_semana_horas?: number; total_estimado_horas?: number };
  cronograma?: PlanWeek[];
  metas?: { curto_prazo?: string[]; medio_prazo?: string[]; longo_prazo?: string[] };
  revisao?: string[];
  exercicios?: string[];
  pausas?: string[];
  previsao_conclusao?: string;
  recomendacoes_finais?: string[];
};

export type StudyPlan = {
  id: string;
  user_id: string;
  title: string;
  goal: string;
  area: string | null;
  level: string;
  subjects: string[];
  priorities: unknown;
  hours_per_day: number;
  days_per_week: number;
  deadline: string | null;
  plan: PlanContent;
  version: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type StudyPlanTask = {
  id: string;
  plan_id: string;
  week_index: number;
  day_label: string;
  subject: string | null;
  title: string;
  kind: string;
  duration_minutes: number;
  sort_order: number;
  done: boolean;
  done_at: string | null;
};

export type StudyPlanVersion = {
  id: string;
  plan_id: string;
  version: number;
  plan: PlanContent;
  note: string | null;
  created_at: string;
};

export const LEVEL_LABEL: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

export const KIND_LABEL: Record<string, string> = {
  estudo: 'Estudo',
  exercicios: 'Exercícios',
  revisao: 'Revisão',
  simulado: 'Simulado',
  descanso: 'Descanso',
};

export function planProgress(tasks: StudyPlanTask[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  return { total, done, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/** Disciplinas que ainda têm atividades em aberto. */
export function pendingSubjects(tasks: StudyPlanTask[]) {
  const map = new Map<string, number>();
  tasks.filter((t) => !t.done).forEach((t) => {
    const key = t.subject || 'Geral';
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

/** Maior sequência de atividades concluídas em ordem do cronograma. */
export function studyStreak(tasks: StudyPlanTask[]) {
  const ordered = [...tasks].sort((a, b) => a.sort_order - b.sort_order);
  let best = 0;
  let run = 0;
  for (const t of ordered) {
    if (t.done) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return best;
}
