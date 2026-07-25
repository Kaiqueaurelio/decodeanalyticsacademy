import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, FileText, FolderOpen } from 'lucide-react';
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
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem('decode_reading_subject_blocks_v1');
      if (raw) setOpenMap(JSON.parse(raw));
    } catch {
      // mantém o padrão fechado quando o navegador bloquear storage
    }
  }, []);

  const persistOpenMap = (next: Record<string, boolean>) => {
    setOpenMap(next);
    try {
      localStorage.setItem('decode_reading_subject_blocks_v1', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const groups = useMemo(() => {
    const map = new Map<string, ApostilaSummary[]>();
    for (const a of apostilas) {
      const key = a.category?.trim() || 'Geral';
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }

    for (const [, list] of map) {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pt-BR'));
    }

    return Array.from(map.entries()).sort(([a], [b]) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
    );
  }, [apostilas]);

  const allOpen = groups.length > 0 && groups.every(([category]) => openMap[category]);
  const toggleAll = () => {
    if (allOpen) {
      persistOpenMap({});
      return;
    }

    const next: Record<string, boolean> = {};
    for (const [category] of groups) next[category] = true;
    persistOpenMap(next);
  };

  return (
    <section id="apostilas" className="scroll-mt-24 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold leading-tight">Apostilas por matéria</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Cada matéria fica em um bloco único; abra para ver as apostilas de dentro.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {groups.length > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={toggleAll}>
              {allOpen ? 'Recolher tudo' : 'Expandir tudo'}
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate('/biblioteca')}>
            Ver biblioteca <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Nenhuma apostila disponível.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {groups.map(([category, list]) => {
            const color = getSubjectColor(category);
            const isOpen = !!openMap[category];
            const totalExercises = list.reduce((sum, item) => sum + (exerciseCounts[item.id] || 0), 0);

            return (
              <article key={category} className="overflow-hidden rounded-2xl border border-border/70 bg-background/40">
                <button
                  type="button"
                  onClick={() => persistOpenMap({ ...openMap, [category]: !isOpen })}
                  aria-expanded={isOpen}
                  aria-controls={`reading-subject-${category}`}
                  className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/30"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${color}22`, color }}
                    aria-hidden="true"
                  >
                    <FolderOpen className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold leading-tight">{category}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {list.length} {list.length === 1 ? 'apostila' : 'apostilas'}
                      {totalExercises > 0 ? ` · ${totalExercises} exercícios` : ''}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    strokeWidth={2}
                  />
                </button>

                <div
                  id={`reading-subject-${category}`}
                  className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-border/50 px-3 pb-3 pt-2">
                      <div className="space-y-2">
                        {list.map((apostila) => (
                          <button
                            key={apostila.id}
                            type="button"
                            onClick={() => navigate(`/apostila/${apostila.id}`)}
                            className="group flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card/70 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
                          >
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" strokeWidth={1.8} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-medium leading-tight group-hover:text-primary">
                                {apostila.title}
                              </span>
                              <span className="mt-0.5 block text-[10px] text-muted-foreground">
                                {apostila.semester ? `${apostila.semester}º semestre` : 'Extracurricular'}
                              </span>
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
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
