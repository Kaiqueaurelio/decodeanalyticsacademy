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
  const list = apostilas.slice(0, 8);

  return (
    <section id="apostilas" className="scroll-mt-24 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold leading-tight">Apostilas para leitura</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Escolha uma apostila e continue seus estudos sem rolagem lateral confusa.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 self-start text-xs sm:self-auto" onClick={() => navigate('/biblioteca')}>
          Ver biblioteca <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </header>

      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Nenhuma apostila disponivel.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {list.map((a) => {
            const tint = getSubjectColor(a.category || 'Geral');
            const exercises = exerciseCounts[a.id] || 0;
            return (
              <article
                key={a.id}
                className="group flex min-h-[190px] flex-col rounded-xl border border-border/70 bg-background/45 p-4 transition-colors hover:border-primary/35 hover:bg-muted/20"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                    style={{ borderColor: `${tint}55`, backgroundColor: `${tint}18`, color: tint }}
                  >
                    <FileText className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <Badge variant="outline" className="h-5 rounded-full px-2 text-[10px]">
                    {exercises} exerc.
                  </Badge>
                </div>

                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: tint }}>
                  {a.category || 'Geral'}
                </div>
                <h4 className="line-clamp-3 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {a.title}
                </h4>

                <div className="mt-auto pt-4">
                  <Button
                    size="sm"
                    className="h-8 w-full justify-between rounded-lg px-3 text-xs font-bold"
                    onClick={() => navigate(`/apostila/${a.id}`)}
                  >
                    Ler apostila <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </article>
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
  const items = [
    { label: 'Disciplinas', a: disciplinas.ativas, b: disciplinas.total, sub: 'disciplinas ativas', bar: 'bg-primary' },
    { label: 'Atividades', a: atividades.concluidas, b: atividades.total, sub: 'concluidas', bar: 'bg-success' },
    { label: 'Exercicios', a: exercicios.resolvidos, b: exercicios.total, sub: 'resolvidos', bar: 'bg-warning' },
    { label: 'Apostilas', a: apostilas.lidas, b: apostilas.total, sub: 'lidas', bar: 'bg-accent' },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <header className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base">Resumo do seu progresso</h3>
        <span className="text-xs font-semibold text-primary">Ver relatorio completo</span>
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
                <div
                  className={`h-full ${it.bar} rounded-full transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
