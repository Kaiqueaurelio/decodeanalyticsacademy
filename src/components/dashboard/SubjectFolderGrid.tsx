import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubjectColor } from '@/lib/subject-colors';
import type { ApostilaSummary } from '@/hooks/queries/useDashboardData';
import { ApostilaCoverCard } from './ApostilaCoverCard';

interface Props {
  apostilas: ApostilaSummary[];
  exerciseCounts: Record<string, number>;
  stats: { byApostila: Record<string, { title: string; hits: number; errors: number }> };
  query?: string;
}

/**
 * Grid de matérias no estilo Notion: cada card representa uma matéria e ao ser
 * clicado abre a página da matéria com a lista de apostilas. Sem expansão inline
 * — a navegação vai direto para /materia/:slug, onde o aluno abre as apostilas
 * uma a uma.
 */
export function SubjectFolderGrid({ apostilas, exerciseCounts, stats, query = '' }: Props) {
  const navigate = useNavigate();

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

  if (groups.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Nenhuma matéria encontrada.
      </div>
    );
  }

  const openSubject = (category: string) => {
    navigate(`/materia/${encodeURIComponent(category)}`);
  };

  return (
    <div className="space-y-8">
      {groups.map(([category, items]) => {
        const color = getSubjectColor(category);
        const semester = items.find((a) => (a as any).semester)?.semester;

        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-3">
                <div 
                  className="h-3 w-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]" 
                  style={{ backgroundColor: color }}
                />
                <h3 className="font-display font-bold text-lg tracking-tight">{category}</h3>
                {semester && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {semester}º Semestre
                  </span>
                )}
              </div>
              <button 
                onClick={() => navigate(`/materia/${encodeURIComponent(category)}`)}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Ver tudo
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {items.map((apostila) => {
                const isCompleted = stats.byApostila[apostila.id]?.hits > 0;
                const progress = isCompleted ? 100 : (stats.byApostila[apostila.id] ? 50 : 0);
                
                return (
                  <div key={apostila.id} className="relative group/card">
                    <ApostilaCoverCard 
                      apostila={apostila} 
                      status={isCompleted ? 'concluida' : (stats.byApostila[apostila.id] ? 'em-progresso' : 'novo')} 
                    />
                    {progress > 0 && (
                      <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-primary/20 shadow-lg z-10 scale-0 group-hover/card:scale-100 transition-transform">
                        <span className="text-[8px] font-black text-primary">{progress}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
