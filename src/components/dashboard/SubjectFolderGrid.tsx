import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, FileText, FolderOpen } from 'lucide-react';
import { getSubjectColor } from '@/lib/subject-colors';
import type { ApostilaSummary } from '@/hooks/queries/useDashboardData';

interface Props {
  apostilas: ApostilaSummary[];
  exerciseCounts: Record<string, number>;
  stats: { byApostila: Record<string, { title: string; hits: number; errors: number }> };
  query?: string;
}

const STORAGE_KEY = 'decode_subject_folders_open_v1';

/**
 * Grid hierárquico: cada matéria é uma PASTA que expande/recolhe para revelar
 * as apostilas dentro. Estado de abertura persistido em localStorage.
 * Padrão: todas fechadas ao carregar.
 */
export function SubjectFolderGrid({ apostilas, exerciseCounts, stats, query = '' }: Props) {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOpenMap(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const persist = (next: Record<string, boolean>) => {
    setOpenMap(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const toggle = (key: string) => {
    persist({ ...openMap, [key]: !openMap[key] });
  };

  const groups = useMemo(() => {
    const normalize = (s: string) =>
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const q = normalize(query.trim());
    const map = new Map<string, ApostilaSummary[]>();
    for (const a of apostilas) {
      const key = a.category?.trim() || 'Geral';
      if (q && !normalize(a.title || '').includes(q) && !normalize(key).includes(q)) continue;
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pt-BR'));
    }
    return Array.from(map.entries()).sort(([a], [b]) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
    );
  }, [apostilas, query]);

  // Quando há busca, força expansão dos resultados
  const isSearching = query.trim().length > 0;

  const allOpen = groups.length > 0 && groups.every(([c]) => openMap[c]);
  const toggleAll = () => {
    if (allOpen) {
      persist({});
    } else {
      const next: Record<string, boolean> = {};
      for (const [c] of groups) next[c] = true;
      persist(next);
    }
  };

  if (groups.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Nenhuma matéria encontrada.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggleAll}
          className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          {allOpen ? 'Recolher tudo' : 'Expandir tudo'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groups.map(([category, items]) => {
          const color = getSubjectColor(category);
          const totalExercises = items.reduce(
            (sum, a) => sum + (exerciseCounts[a.id] || 0),
            0,
          );
          const started = items.filter((a) => stats.byApostila[a.id]).length;
          const progress = items.length > 0 ? Math.round((started / items.length) * 100) : 0;
          const isOpen = isSearching || !!openMap[category];

          return (
            <article
              key={category}
              className="relative flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-lg"
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: color }}
                aria-hidden
              />

              <button
                type="button"
                onClick={() => toggle(category)}
                aria-expanded={isOpen}
                aria-controls={`folder-${category}`}
                className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/30"
              >
                <div
                  className="rounded-xl p-2.5 shrink-0"
                  style={{ backgroundColor: `${color}22`, color }}
                >
                  <FolderOpen className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm leading-snug line-clamp-2">
                    {category}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>
                      {items.length} {items.length === 1 ? 'apostila' : 'apostilas'}
                    </span>
                    {totalExercises > 0 && (
                      <>
                        <span aria-hidden>·</span>
                        <span>{totalExercises} exerc.</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="text-right">
                    <div
                      className="text-[11px] font-semibold tabular-nums"
                      style={{ color }}
                    >
                      {progress}%
                    </div>
                    <div className="text-[10px] text-muted-foreground tabular-nums">
                      {started}/{items.length}
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    strokeWidth={2}
                  />
                </div>
              </button>

              <div className="h-1 w-full bg-muted">
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: color }}
                />
              </div>

              <div
                id={`folder-${category}`}
                className={`grid transition-all duration-300 ease-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <ul className="flex flex-col divide-y divide-border/40 border-t border-border/40">
                    {items.map((apostila) => {
                      const exCount = exerciseCounts[apostila.id] || 0;
                      const st = stats.byApostila[apostila.id];
                      const inProgress = !!st;
                      return (
                        <li key={apostila.id}>
                          <a
                            href={`/apostila/${apostila.id}`}
                            className="group flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors"
                          >
                            <FileText
                              className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
                              strokeWidth={1.75}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-[13px] font-medium leading-tight group-hover:text-primary transition-colors">
                                {apostila.title}
                              </p>
                              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                                {exCount > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    <BookOpen className="h-2.5 w-2.5" strokeWidth={2} />
                                    {exCount} exerc.
                                  </span>
                                )}
                                {inProgress && (
                                  <span
                                    className="inline-flex items-center rounded-full px-1.5 py-px text-[9px] font-semibold"
                                    style={{ backgroundColor: `${color}22`, color }}
                                  >
                                    em progresso
                                  </span>
                                )}
                              </div>
                            </div>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
