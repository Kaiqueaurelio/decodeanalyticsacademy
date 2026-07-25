import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, FolderOpen, GraduationCap } from 'lucide-react';
import { ApostilaCoverCard } from './ApostilaCoverCard';
import { getSubjectColor } from '@/lib/subject-colors';
import type { ApostilaSummary } from '@/hooks/queries/useDashboardData';

interface Props {
  apostilas: ApostilaSummary[];
  exerciseCounts: Record<string, number>;
  stats: { byApostila: Record<string, { title: string; hits: number; errors: number }> };
  query?: string;
}

/**
 * Grid de "pastas" por matéria (estilo bloco).
 * Cada matéria vira UM card. Clicar abre um painel com todas as apostilas
 * daquela matéria — nada mais fica misturado.
 */
export function SubjectFolderGrid({ apostilas, exerciseCounts, stats, query = '' }: Props) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const groups = useMemo(() => {
    const normalize = (s: string) =>
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const q = normalize(query.trim());
    const map = new Map<string, ApostilaSummary[]>();
    for (const a of apostilas) {
      const key = (a.category?.trim() || 'Geral');
      if (q && !normalize(a.title || '').includes(q) && !normalize(key).includes(q)) continue;
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
    );
  }, [apostilas, query]);

  if (groups.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Nenhuma matéria encontrada.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {groups.map(([category, items]) => {
          const color = getSubjectColor(category);
          const totalExercises = items.reduce(
            (sum, a) => sum + (exerciseCounts[a.id] || 0),
            0,
          );
          const started = items.filter((a) => stats.byApostila[a.id]).length;
          const progress = items.length > 0 ? Math.round((started / items.length) * 100) : 0;
          const isOpen = openKey === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => setOpenKey(isOpen ? null : category)}
              aria-expanded={isOpen}
              className={`group relative text-left rounded-2xl border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                isOpen
                  ? 'border-primary/60 shadow-lg ring-1 ring-primary/30'
                  : 'border-border/60 hover:border-primary/40'
              }`}
              style={{ boxShadow: isOpen ? `0 8px 32px -12px ${color}55` : undefined }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <div className="flex items-start justify-between mb-3">
                <div
                  className="rounded-xl p-2.5 shrink-0"
                  style={{ backgroundColor: `${color}22`, color }}
                >
                  <FolderOpen className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-primary' : ''
                  }`}
                />
              </div>
              <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2">
                {category}
              </h3>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3 w-3" strokeWidth={1.75} />
                  {items.length} {items.length === 1 ? 'apostila' : 'apostilas'}
                </span>
                {totalExercises > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" strokeWidth={1.75} />
                    {totalExercises} exerc.
                  </span>
                )}
              </div>
              <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: color }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground tabular-nums">
                {started}/{items.length} iniciadas · {progress}%
              </p>
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {openKey && (
          <motion.div
            key={openKey}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            {(() => {
              const items = groups.find(([c]) => c === openKey)?.[1] ?? [];
              const color = getSubjectColor(openKey);
              return (
                <div
                  className="rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5"
                  style={{ borderTopColor: color, borderTopWidth: 2 }}
                >
                  <div className="flex items-baseline justify-between mb-4">
                    <h4 className="font-semibold text-sm" style={{ color }}>
                      {openKey}
                    </h4>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {items.length} {items.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {items.map((apostila) => (
                      <ApostilaCoverCard key={apostila.id} apostila={apostila} />
                    ))}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
