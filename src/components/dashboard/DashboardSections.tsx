import { ArrowRight, FileText, ClipboardList, Beaker, PenLine, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { ApostilaSummary } from '@/hooks/queries/useDashboardData';
import { getSubjectColor } from '@/lib/subject-colors';

interface Props {
  apostilas: ApostilaSummary[];
  exerciseCounts: Record<string, number>;
  examFocusSubject?: string | null;
}

// "Atividades para fazer" = apostilas com exercícios pendentes, priorizando matéria foco
export function ActivitiesToDoSection({ apostilas, exerciseCounts, examFocusSubject }: Props) {
  const navigate = useNavigate();
  const focus = examFocusSubject?.toLowerCase() || '';

  const list = [...apostilas]
    .filter((a) => (exerciseCounts[a.id] || 0) > 0)
    .sort((a, b) => {
      const af = focus && (a.category || '').toLowerCase().includes(focus) ? -1 : 0;
      const bf = focus && (b.category || '').toLowerCase().includes(focus) ? -1 : 0;
      return af - bf;
    })
    .slice(0, 3);

  const statusOf = (i: number): { label: string; tone: string } => {
    if (i === 0) return { label: 'Hoje', tone: 'text-destructive bg-destructive/10 border-destructive/30' };
    if (i === 1) return { label: 'Pendente', tone: 'text-warning bg-warning/10 border-warning/30' };
    return { label: 'Em andamento', tone: 'text-success bg-success/10 border-success/30' };
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <header className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base">Atividades para fazer</h3>
        <button
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          onClick={() => navigate('/exercicios')}
        >
          Ver todas <ChevronRight className="h-3 w-3" />
        </button>
      </header>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Nenhuma atividade pendente. Bom trabalho! 🎉
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((a, i) => {
            const tone = statusOf(i);
            const tint = getSubjectColor(a.category || 'Geral');
            return (
              <button
                key={a.id}
                onClick={() => navigate(`/apostila/${a.id}`)}
                className="w-full flex items-center gap-4 p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-all text-left group"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${tint}22`, color: tint }}
                >
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {a.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {a.category || 'Geral'} · {exerciseCounts[a.id] || 0} exercícios
                  </div>
                </div>
                <span className={`hidden sm:inline px-2.5 py-1 rounded-full text-[10px] font-bold border ${tone.tone}`}>
                  {tone.label}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface RecProps {
  apostilas: ApostilaSummary[];
  exerciseCounts: Record<string, number>;
}

export function RecommendedExercisesSection({ apostilas, exerciseCounts }: RecProps) {
  const navigate = useNavigate();

  const top3 = [...apostilas]
    .filter((a) => (exerciseCounts[a.id] || 0) > 0)
    .sort((a, b) => (exerciseCounts[b.id] || 0) - (exerciseCounts[a.id] || 0))
    .slice(0, 3);

  const icons = [FileText, Beaker, PenLine];
  const tones = ['primary', 'accent', 'warning'] as const;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <header className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base">Exercícios recomendados</h3>
        <button
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          onClick={() => navigate('/exercicios')}
        >
          Ver todos <ChevronRight className="h-3 w-3" />
        </button>
      </header>

      {top3.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Sem exercícios disponíveis ainda.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {top3.map((a, i) => {
            const Icon = icons[i];
            const cfg = [
              { ring: 'hover:border-primary/40', bg: 'bg-primary/15', text: 'text-primary', bar: 'bg-primary' },
              { ring: 'hover:border-accent/40', bg: 'bg-accent/15', text: 'text-accent', bar: 'bg-accent' },
              { ring: 'hover:border-warning/40', bg: 'bg-warning/15', text: 'text-warning', bar: 'bg-warning' },
            ][i];
            return (
              <div
                key={a.id}
                className={`group relative rounded-xl border border-border/60 bg-muted/10 p-4 transition-all ${cfg.ring}`}
              >
                <div className={`w-12 h-12 rounded-xl ${cfg.bg} ${cfg.text} flex items-center justify-center mb-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="font-bold text-sm leading-tight truncate" title={a.category || 'Geral'}>
                  {a.category || 'Geral'}
                </div>
                <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 h-8">
                  {a.title}
                </div>
                <div className="flex items-center gap-1 mt-2 mb-3">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className={`h-1.5 w-5 rounded-full ${d <= i ? cfg.bar : 'bg-muted'}`}
                    />
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-1.5">
                    {i === 0 ? 'Fácil' : i === 1 ? 'Médio' : 'Difícil'}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="w-full h-8 text-[11px] font-bold"
                  onClick={() => navigate(`/apostila/${a.id}#exercicios`)}
                >
                  Iniciar
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
