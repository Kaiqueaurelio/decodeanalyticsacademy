import { useMemo, useEffect, useState, useRef } from 'react';
import { ChevronRight, PenTool, Plus, LayoutGrid, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSubjectColor } from '@/lib/subject-colors';
import type { ApostilaSummary } from '@/hooks/queries/useDashboardData';
import { ApostilaCoverCard } from './ApostilaCoverCard';
import { useAuth } from '@/hooks/useAuth';
import { useApostilaProgressMap } from '@/hooks/useApostilaProgressMap';

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
  const { progressMap } = useApostilaProgressMap();
  const [visibleGroups, setVisibleGroups] = useState(3); // Aumentado para preencher a tela inicial melhor
  const loaderRef = useRef<HTMLDivElement>(null);

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

  // Reinicia a paginação quando a busca muda
  useEffect(() => {
    setVisibleGroups(3);
  }, [query]);

  // Rolagem infinita: re-observa o sentinela a cada lote carregado
  useEffect(() => {
    if (visibleGroups >= groups.length) return;
    const el = loaderRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    let done = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (done) return;
        if (entries[0]?.isIntersecting) {
          done = true;
          // rAF evita travar o scroll durante o render do próximo lote
          requestAnimationFrame(() =>
            setVisibleGroups((prev) => Math.min(prev + 2, groups.length)),
          );
        }
      },
      { root: null, rootMargin: '600px 0px', threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleGroups, groups.length]);



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
                  <div className="flex items-center gap-2 mr-2 bg-accent/5 p-1 rounded-full border border-accent/10 shadow-sm">
                    <button 
                      onClick={() => navigate('/admin', { state: { tab: 'apostilas', filter: category, action: 'new' } })}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:bg-primary/10 transition-all px-3 py-1.5 rounded-full"
                      title="Adicionar novo material nesta disciplina"
                    >
                      <Plus className="h-3 w-3" />
                      Novo Material
                    </button>
                    <div className="h-3 w-px bg-accent/20" />
                    <button 
                      onClick={() => navigate('/admin', { state: { tab: 'apostilas', filter: category } })}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-accent hover:bg-accent/10 transition-all px-3 py-1.5 rounded-full"
                      title="Gerenciar disciplina no painel administrativo"
                    >
                      <PenTool className="h-3 w-3" />
                      Gerenciar Matéria
                    </button>
                  </div>
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
              <button
                onClick={() => openSubject(category)}
                className="group relative flex flex-col rounded-3xl border border-border/60 bg-card overflow-hidden transition-all duration-500 hover:border-primary/50 hover:shadow-[0_20px_50px_rgba(168,85,247,0.15)] hover:-translate-y-1.5 active:scale-[0.98] aspect-[3/4]"
              >
                <div className="relative h-full w-full overflow-hidden bg-muted">
                  <div 
                    className="absolute inset-0 opacity-20 mix-blend-overlay group-hover:opacity-40 transition-opacity duration-700"
                    style={{ backgroundColor: color }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <div 
                      className="p-4 rounded-2xl bg-background/80 backdrop-blur-xl border border-white/10 shadow-2xl group-hover:scale-110 transition-transform duration-500 mb-4"
                    >
                      <LayoutGrid className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="font-display font-black text-sm leading-tight group-hover:text-primary transition-colors uppercase tracking-tight">
                      Abrir {category}
                    </h4>
                    <span className="text-[10px] font-bold text-muted-foreground mt-2">
                      {items.length} {items.length === 1 ? 'Material' : 'Materiais'}
                    </span>
                  </div>
                  
                  <div className="absolute bottom-0 inset-x-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-background via-background/90 to-transparent">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Acessar Gaveta</span>
                      <ChevronRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>
              </button>
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
