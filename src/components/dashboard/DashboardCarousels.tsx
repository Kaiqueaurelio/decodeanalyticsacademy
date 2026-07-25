import { BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { ApostilaSummary } from '@/hooks/queries/useDashboardData';
import { ApostilaCoverCard } from '@/components/dashboard/ApostilaCoverCard';

interface Props {
  apostilas: ApostilaSummary[];
  exerciseCounts: Record<string, number>;
}

export function ApostilasReadingCarousel({ apostilas }: Props) {
  const navigate = useNavigate();
  const items = apostilas.slice(0, 15);

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

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Nenhuma apostila disponível.
        </p>
      ) : (
        (() => {
          const groups = new Map<string, ApostilaSummary[]>();
          for (const a of items) {
            const key = (a.category?.trim() || 'Geral');
            const arr = groups.get(key) ?? [];
            arr.push(a);
            groups.set(key, arr);
          }
          const sorted = Array.from(groups.entries()).sort(([a], [b]) =>
            a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
          );
          return (
            <div className="space-y-8">
              {sorted.map(([category, list]) => (
                <div key={category}>
                  <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-border/50">
                    <h4 className="font-semibold text-sm text-foreground/90">{category}</h4>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {list.length} {list.length === 1 ? 'apostila' : 'apostilas'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {list.map((a) => (
                      <ApostilaCoverCard key={a.id} apostila={a} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()
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
