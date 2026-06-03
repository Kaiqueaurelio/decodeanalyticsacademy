import { BookOpen, ChevronRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import type { ApostilaSummary } from '@/hooks/queries/useDashboardData';
import { getSubjectColor } from '@/lib/subject-colors';

interface Props {
  apostilas: ApostilaSummary[];
  exerciseCounts: Record<string, number>;
}

export function ApostilasReadingCarousel({ apostilas, exerciseCounts }: Props) {
  const navigate = useNavigate();
  const grouped = apostilas.slice(0, 12).reduce((acc, apostila) => {
    const category = apostila.category || 'Geral';
    if (!acc[category]) acc[category] = [];
    acc[category].push(apostila);
    return acc;
  }, {} as Record<string, ApostilaSummary[]>);
  const entries = Object.entries(grouped).slice(0, 5);

  return (
    <section id="apostilas" className="scroll-mt-24 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold leading-tight">Apostilas para leitura</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Organizadas por disciplina para encontrar o conteúdo com rapidez.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 self-start text-xs sm:self-auto" onClick={() => navigate('/biblioteca')}>
          Ver biblioteca <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </header>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Nenhuma apostila disponível.
        </p>
      ) : (
        <div className="space-y-4">
          {entries.map(([category, items]) => {
            const tint = getSubjectColor(category);
            return (
              <section key={category} className="rounded-xl border border-border/60 bg-background/35 overflow-hidden">
                <header className="flex items-center justify-between gap-3 border-b border-border/50 bg-muted/20 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tint }}>
                      Disciplina
                    </div>
                    <h4 className="truncate text-sm font-bold text-foreground">{category}</h4>
                  </div>
                  <Badge variant="outline" className="h-6 rounded-full px-2.5 text-[10px]">
                    {items.length} apostila{items.length > 1 ? 's' : ''}
                  </Badge>
                </header>

                <div className="divide-y divide-border/45">
                  {items.slice(0, 4).map((a) => {
                    const exercises = exerciseCounts[a.id] || 0;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => navigate(`/apostila/${a.id}`)}
                        className="group grid w-full grid-cols-[38px_1fr_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/25"
                      >
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-lg border"
                          style={{ borderColor: `${tint}55`, backgroundColor: `${tint}16`, color: tint }}
                        >
                          <FileText className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                            {a.title}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">
                            {exercises > 0 ? `${exercises} exercícios vinculados` : 'Leitura disponível'}
                          </span>
                        </span>
                        <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[11px] font-bold text-primary-foreground">
                          Ler <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}

interface SummaryProps {
  disciplinas: { ativas: number; total: number };
  atividades: { concluidas: number; total: number };
  exercicios: { resolvidos: number; total: number };
  apostilas: { lidas: number; total: number };
}

export function ProgressSummaryRow({ disciplinas, atividades, exercicios, apostilas }: SummaryProps) {
  const navigate = useNavigate();
  const items = [
    { label: 'Disciplinas', a: disciplinas.ativas, b: disciplinas.total, sub: 'disciplinas ativas', bar: 'bg-primary' },
    { label: 'Atividades', a: atividades.concluidas, b: atividades.total, sub: 'concluídas', bar: 'bg-success' },
    { label: 'Exercícios', a: exercicios.resolvidos, b: exercicios.total, sub: 'resolvidos', bar: 'bg-warning' },
    { label: 'Apostilas', a: apostilas.lidas, b: apostilas.total, sub: 'lidas', bar: 'bg-accent' },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <header className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-bold text-base">Resumo do seu progresso</h3>
        <button
          type="button"
          onClick={() => navigate('/desempenho')}
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          Ver desempenho <ChevronRight className="h-3 w-3" />
        </button>
      </header>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((it) => {
          const pct = it.b > 0 ? Math.round((it.a / it.b) * 100) : 0;
          return (
            <div key={it.label}>
              <div className="text-[11px] font-semibold text-muted-foreground mb-1">{it.label}</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-extrabold tracking-tight">{it.a}</span>
                <span className="text-sm text-muted-foreground">/ {it.b}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mb-2">{it.sub}</div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${it.bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
