import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, FileText } from 'lucide-react';
import { getSubjectColor } from '@/lib/subject-colors';
import type { ApostilaSummary } from '@/hooks/queries/useDashboardData';

interface Props {
  apostilas: ApostilaSummary[];
  exerciseCounts: Record<string, number>;
  stats: { byApostila: Record<string, { title: string; hits: number; errors: number }> };
  query?: string;
}

const STORAGE_KEY = 'decode_subject_folders_open_v2';

/**
 * Notion-style subject cards (inspirado no "Caderno Unip - Central de páginas").
 * Cada matéria é um card com capa colorida + título + pills. Clique expande
 * uma lista de apostilas em estilo sub-página do Notion.
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {groups.map(([category, items]) => {
          const color = getSubjectColor(category);
          const started = items.filter((a) => stats.byApostila[a.id]).length;
          const inProgress = started > 0;
          const semester = items.find((a) => (a as any).semester)?.['semester' as keyof ApostilaSummary] as
            | number
            | null
            | undefined;
          const source = items.find((a) => (a as any).source_type)?.['source_type' as keyof ApostilaSummary] as
            | string
            | null
            | undefined;
          const cover = items.find((a) => a.cover_url)?.cover_url;
          const isOpen = isSearching || !!openMap[category];

          return (
            <article
              key={category}
              className="group relative flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-0.5"
            >
              {/* Cover / capa Notion-style */}
              <button
                type="button"
                onClick={() => toggle(category)}
                aria-expanded={isOpen}
                aria-controls={`folder-${category}`}
                className="relative block h-32 w-full overflow-hidden text-left"
                style={{
                  backgroundImage: cover
                    ? `linear-gradient(135deg, ${color}66 0%, #0b1220cc 100%), url("${cover}")`
                    : `linear-gradient(135deg, ${color}dd 0%, ${color}33 55%, #0b1220 100%)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <span
                  className="absolute left-4 right-4 bottom-3 font-display font-semibold text-white text-lg leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] line-clamp-2"
                >
                  {category}
                </span>
                {source && (
                  <span
                    className="absolute left-4 bottom-1 inline-block rounded-sm px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wider text-white"
                    style={{ backgroundColor: '#c96a2e' }}
                  >
                    {source === 'ava' ? 'Ava' : source === 'presencial' ? 'Presencial' : source}
                  </span>
                )}
              </button>

              {/* Body */}
              <button
                type="button"
                onClick={() => toggle(category)}
                className="flex w-full items-start gap-2.5 px-4 pt-3 pb-3 text-left"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[15px] leading-snug text-foreground line-clamp-2">
                    {category}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {inProgress ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-[3px] text-[10px] font-medium text-sky-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        Em progresso
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-[3px] text-[10px] font-medium text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                        Não iniciado
                      </span>
                    )}
                    {semester && (
                      <span
                        className="inline-flex items-center rounded-md px-2 py-[3px] text-[10px] font-medium text-white"
                        style={{ backgroundColor: '#a55a2b' }}
                      >
                        {semester}º Semestre
                      </span>
                    )}
                    <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                      {items.length} {items.length === 1 ? 'apostila' : 'apostilas'}
                    </span>
                  </div>
                </div>
              </button>

              {/* Expand list (Notion sub-pages) */}
              <div
                id={`folder-${category}`}
                className={`grid transition-all duration-300 ease-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <ul className="flex flex-col border-t border-border/50 px-2 py-1.5">
                    {items.map((apostila) => {
                      const exCount = exerciseCounts[apostila.id] || 0;
                      const st = stats.byApostila[apostila.id];
                      const started = !!st;
                      return (
                        <li key={apostila.id}>
                          <a
                            href={`/apostila/${apostila.id}`}
                            className="group/item flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                          >
                            <ChevronRight
                              className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70"
                              strokeWidth={2.2}
                            />
                            <FileText
                              className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover/item:text-primary transition-colors"
                              strokeWidth={1.75}
                            />
                            <span className="truncate text-[13px] text-foreground/90 group-hover/item:text-primary transition-colors">
                              {apostila.title}
                            </span>
                            {started && (
                              <span
                                className="ml-auto shrink-0 rounded-full px-1.5 py-px text-[9px] font-semibold"
                                style={{ backgroundColor: `${color}22`, color }}
                              >
                                em progresso
                              </span>
                            )}
                            {!started && exCount > 0 && (
                              <span className="ml-auto shrink-0 text-[10px] tabular-nums text-muted-foreground">
                                {exCount} ex.
                              </span>
                            )}
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
