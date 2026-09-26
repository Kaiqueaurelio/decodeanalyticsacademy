import { useMemo } from 'react';
import { ChevronRight, PenTool, Plus, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSubjectColor } from '@/lib/subject-colors';
import { formatApostilaDate } from '@/lib/apostila-pages';
import type { ApostilaSummary } from '@/hooks/queries/useDashboardData';
import { useAuth } from '@/hooks/useAuth';
import { buildCoverDataUri } from '@/lib/cover-render';
import { useCoverTheme } from '@/lib/cover-theme';

interface Props {
  apostilas: ApostilaSummary[];
  exerciseCounts: Record<string, number>;
  stats: { byApostila: Record<string, { title: string; hits: number; errors: number }> };
  query?: string;
}

export function SubjectFolderGrid({ apostilas, exerciseCounts, stats, query = '' }: Props) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const theme = useCoverTheme();

  const groups = useMemo(() => {
    if (!Array.isArray(apostilas)) {
      console.error("SubjectFolderGrid: 'apostilas' is not an array", apostilas);
      return [];
    }

    const normalize = (s: string) =>
      (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
    const q = normalize(query.trim());
    const map = new Map<string, ApostilaSummary[]>();

    for (const a of apostilas) {
      if (!a) continue;
      // Placeholder curricular cards are not real materials and must not be shown.
      if ((a as ApostilaSummary & { isPlaceholder?: boolean }).isPlaceholder) continue;
      const category = a.category?.trim() || 'Geral';
      if (q && !normalize(a.title || '').includes(q) && !normalize(category).includes(q)) continue;
      const arr = map.get(category) ?? [];
      arr.push(a);
      map.set(category, arr);
    }

    for (const [, arr] of map) {
      arr.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pt-BR'));
    }

    return Array.from(map.entries()).sort(([a], [b]) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
    );
  }, [apostilas, query]);

  if (groups.length === 0) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Nenhuma matéria encontrada.</div>;
  }

  const openSubject = (category: string) => navigate(`/materia/${encodeURIComponent(category)}`);
  const coverFor = (apostila: ApostilaSummary) =>
    apostila.cover_url || buildCoverDataUri({ title: apostila.title, category: apostila.category, semester: apostila.semester, teacher: apostila.teacher }, theme);
  const fallbackCoverFor = (apostila: ApostilaSummary) =>
    buildCoverDataUri({ title: apostila.title, category: apostila.category, semester: apostila.semester, teacher: apostila.teacher }, theme);

  return (
    <div className="space-y-12">
      {/* Important: render EVERY returned subject. The previous lazy pagination only
          rendered 12 groups initially and could leave valid AVA subjects hidden. */}
      {groups.map(([category, items]) => {
        const color = getSubjectColor(category);
        const semester = items.find((a) => a.semester)?.semester;
        const mainCover = coverFor(items[0]);
        return (
          <div key={category} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-border/40 pb-3 mb-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="h-4 w-4 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)] ring-2 ring-background" style={{ backgroundColor: color }} />
                <div className="flex flex-col">
                  <h3 className="font-display font-black text-xl tracking-tight sm:text-2xl">{category}</h3>
                  {semester && <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mt-0.5">{semester}º Semestre · Grade Curricular</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <div className="flex items-center gap-2 mr-2 bg-accent/5 p-1 rounded-full border border-accent/10 shadow-sm">
                    <button onClick={() => navigate('/admin', { state: { tab: 'apostilas', filter: category, action: 'new' } })} className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:bg-primary/10 transition-all px-3 py-1.5 rounded-full" title="Adicionar novo material nesta disciplina">
                      <Plus className="h-3 w-3" />Novo Material
                    </button>
                    <div className="h-3 w-px bg-accent/20" />
                    <button onClick={() => navigate('/admin', { state: { tab: 'apostilas', filter: category } })} className="flex items-center gap-1.5 text-[10px] font-bold text-accent hover:bg-accent/10 transition-all px-3 py-1.5 rounded-full" title="Gerenciar disciplina no painel administrativo">
                      <PenTool className="h-3 w-3" />Gerenciar Matéria
                    </button>
                  </div>
                )}
                <button onClick={() => openSubject(category)} className="group flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-all bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
                  Ver tudo<ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button onClick={() => openSubject(category)} className="group relative flex flex-col rounded-3xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden transition-all duration-700 hover:border-primary/50 hover:shadow-[0_30px_60px_-15px_rgba(168,85,247,0.25)] hover:-translate-y-2 active:scale-[0.98] h-52 sm:h-56">
                <div className="absolute inset-0">
                  {mainCover ? <img src={mainCover} alt={category} onError={(event) => { event.currentTarget.src = fallbackCoverFor(items[0]); }} className="h-full w-full object-cover opacity-30 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700" /> : <div className="absolute inset-0 opacity-20 mix-blend-overlay group-hover:opacity-40 transition-opacity duration-700" style={{ backgroundColor: color }} />}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                </div>
                <div className="relative z-10 h-full w-full flex flex-col p-6">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-2xl bg-background/80 backdrop-blur-xl border border-white/10 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500"><LayoutGrid className="h-6 w-6 text-primary" strokeWidth={2.5} /></div>
                    <div className="flex -space-x-2 overflow-hidden">
                      {items.slice(0, 3).map((item) => <div key={item.id} className="h-8 w-8 rounded-lg border-2 border-background bg-muted overflow-hidden shadow-lg"><img src={coverFor(item)} alt="" onError={(event) => { event.currentTarget.src = fallbackCoverFor(item); }} className="h-full w-full object-cover" /></div>)}
                    </div>
                  </div>
                  <div className="mt-auto">
                    <h4 className="font-display font-black text-lg sm:text-xl leading-tight group-hover:text-primary transition-colors tracking-tight">{category}</h4>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest bg-muted/50 px-2 py-0.5 rounded-md border border-border/40">{items.length} {items.length === 1 ? 'Caderno' : 'Cadernos'}</span>
                      <div className="h-1 w-1 rounded-full bg-primary/40" />
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">Explorar Disciplina <ChevronRight className="h-3 w-3" /></span>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
              </button>

              <div className="hidden lg:grid grid-cols-2 gap-3">
                {items.slice(0, 2).map((a) => <button key={a.id} onClick={() => navigate(`/reader/${a.id}`)} className="group/mini relative flex flex-col rounded-2xl border border-border/40 bg-card/20 p-3 transition-all hover:bg-card/40 hover:border-primary/30"><div className="flex items-center gap-2 mb-2"><div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} /><div className="min-w-0 flex-1"><span className="block text-[9px] font-bold text-muted-foreground uppercase truncate">{a.title}</span>{a.saved_date && <span className="mt-0.5 block text-[8px] font-semibold text-primary/70 uppercase tracking-wide">Aula: {formatApostilaDate(a.saved_date)}</span>}</div></div><div className="mt-auto flex items-center justify-between"><span className="text-[8px] font-black text-primary/60 uppercase">Ler Material</span><ChevronRight className="h-2 w-2 text-primary/40 group-hover/mini:translate-x-0.5 transition-transform" /></div></button>)}
                {items.length > 2 && <button onClick={() => openSubject(category)} className="col-span-2 text-center py-2 rounded-xl border border-dashed border-border/40 text-[9px] font-black text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">+ {items.length - 2} OUTROS MATERIAIS</button>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
