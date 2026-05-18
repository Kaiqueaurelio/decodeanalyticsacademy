import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { ApostilaSummary } from '@/hooks/queries/useDashboardData';
import { getSubjectColor } from '@/lib/subject-colors';

interface Props {
  apostilas: ApostilaSummary[];
  exerciseCounts: Record<string, number>;
}

export function ApostilasReadingCarousel({ apostilas, exerciseCounts }: Props) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'l' | 'r') => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === 'l' ? -300 : 300, behavior: 'smooth' });
  };

  const list = apostilas.slice(0, 12);

  return (
    <section id="apostilas" className="rounded-2xl border border-border bg-card p-5 scroll-mt-24">
      <header className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base">Apostilas para leitura</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/biblioteca')}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Ver todas
          </button>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => scroll('l')}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => scroll('r')}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma apostila disponível.</p>
      ) : (
        <div
          ref={ref}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-thin"
          style={{ scrollbarWidth: 'thin' }}
        >
          {list.map((a) => {
            const tint = getSubjectColor(a.category || 'Geral');
            return (
              <div
                key={a.id}
                className="group min-w-[200px] max-w-[200px] snap-start rounded-xl border border-border/60 bg-muted/10 p-3 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer"
                onClick={() => navigate(`/apostila/${a.id}`)}
              >
                {/* PDF-style preview */}
                <div
                  className="relative h-24 rounded-lg mb-3 overflow-hidden flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${tint}22, ${tint}08)` }}
                >
                  <FileText className="h-10 w-10" style={{ color: tint }} strokeWidth={1.5} />
                  <span
                    className="absolute top-2 left-2 text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: tint, color: 'hsl(var(--background))' }}
                  >
                    PDF
                  </span>
                </div>
                <div className="font-bold text-sm leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors h-10">
                  {a.title}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {a.category || 'Geral'} · {exerciseCounts[a.id] || 0} exerc.
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-3 h-7 text-[11px] font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/apostila/${a.id}`);
                  }}
                >
                  Ler agora
                </Button>
              </div>
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
    { label: 'Atividades', a: atividades.concluidas, b: atividades.total, sub: 'concluídas', bar: 'bg-success' },
    { label: 'Exercícios', a: exercicios.resolvidos, b: exercicios.total, sub: 'resolvidos', bar: 'bg-warning' },
    { label: 'Apostilas', a: apostilas.lidas, b: apostilas.total, sub: 'lidas', bar: 'bg-accent' },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <header className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base">Resumo do seu progresso</h3>
        <span className="text-xs font-semibold text-primary">Ver relatório completo</span>
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
