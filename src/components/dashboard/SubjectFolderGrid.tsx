import { useMemo, useEffect, useState, useRef } from 'react';
import { ChevronRight, PenTool, Plus, LayoutGrid, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSubjectColor } from '@/lib/subject-colors';
import type { ApostilaSummary } from '@/hooks/queries/useDashboardData';
import { ApostilaCoverCard } from './ApostilaCoverCard';
import { useAuth } from '@/hooks/useAuth';

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
  const { isAdmin } = useAuth();
  const [visibleGroups, setVisibleGroups] = useState(3); // Aumentado para preencher a tela inicial melhor
  const loaderRef = useRef<HTMLDivElement>(null);

  // Intersection Observer para Rolagem Infinita Real e Fluida
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '400px', // Carrega antes do usuário chegar no fim
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting) {
        setVisibleGroups(prev => prev + 2); // Carrega blocos de 2 matérias
      }
    }, options);

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, []);

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
    <div className="space-y-12">
      {groups.slice(0, visibleGroups).map(([category, items]) => {
        const color = getSubjectColor(category);
        const semester = items.find((a) => (a as any).semester)?.semester;

        return (
          <div key={category} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-border/40 pb-3 mb-6 gap-4">
              <div className="flex items-center gap-4">
                <div 
                  className="h-4 w-4 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)] ring-2 ring-background" 
                  style={{ backgroundColor: color }}
                />
                <div className="flex flex-col">
                  <h3 className="font-display font-black text-xl tracking-tight sm:text-2xl">{category}</h3>
                  {semester && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mt-0.5">
                      {semester}º Semestre · Grade Curricular
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button 
                    onClick={() => navigate('/admin', { state: { tab: 'apostilas', filter: category } })}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-accent hover:text-accent/80 transition-all bg-accent/5 px-3 py-1.5 rounded-full border border-accent/10 mr-2"
                  >
                    <PenTool className="h-3 w-3" />
                    Gerenciar Matéria
                  </button>
                )}
                <button 
                  onClick={() => navigate(`/materia/${encodeURIComponent(category)}`)}
                  className="group flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-all bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10"
                >
                  Ver tudo
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {items.map((apostila) => {
                const isCompleted = stats.byApostila[apostila.id]?.hits > 0;
                const progress = isCompleted ? 100 : (stats.byApostila[apostila.id] ? 50 : 0);
                
                return (
                  <div key={apostila.id} className="relative group/card h-full">
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

      {/* Sentinel e Indicador de Carregamento para Rolagem Infinita */}
      <div 
        ref={loaderRef} 
        className="py-16 flex flex-col items-center justify-center gap-4 transition-all"
      >
        {visibleGroups < groups.length ? (
          <>
            <div className="flex items-center gap-2 text-primary animate-pulse">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs font-black uppercase tracking-widest">Carregando mais disciplinas...</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full opacity-20 pointer-events-none">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-40">
            <LayoutGrid className="h-6 w-6 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Fim da grade curricular</span>
          </div>
        )}
      </div>
    </div>
  );
}
