import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { getSubjectColor } from '@/lib/subject-colors';
import { getCurriculumSubjects } from '@/lib/curriculum-subjects';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import type { ApostilaSummary } from '@/hooks/queries/useDashboardData';

interface Props {
  apostilas: ApostilaSummary[];
  exerciseCounts: Record<string, number>;
  stats: { byApostila: Record<string, { title: string; hits: number; errors: number }> };
  query?: string;
}

/**
 * Grid de matérias no estilo Notion.
 * Inclui "Blank Cards" baseados na grade curricular para matérias sem conteúdo ainda.
 */
export function SubjectFolderGrid({ apostilas, exerciseCounts, stats, query = '' }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useUserProfile(user?.id);

  const groups = useMemo(() => {
    const normalize = (s: string) =>
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const q = normalize(query.trim());
    
    // 1. Get existing subjects from apostilas
    const map = new Map<string, ApostilaSummary[]>();
    for (const a of apostilas) {
      const key = a.category?.trim() || 'Geral';
      if (q && !normalize(a.title || '').includes(q) && !normalize(key).includes(q)) continue;
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }

    // 2. Add blank subjects from curriculum if not present
    if (profile?.course && profile?.semester && !q) {
      const curriculum = getCurriculumSubjects(profile.course, profile.semester);
      for (const subjectName of curriculum) {
        if (!map.has(subjectName)) {
          map.set(subjectName, []); // Empty array indicates a "blank" card
        }
      }
    }

    for (const [, arr] of map) {
      arr.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pt-BR'));
    }
    return Array.from(map.entries()).sort(([a], [b]) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
    );
  }, [apostilas, query, profile?.course, profile?.semester]);

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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-5">
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
        const totalEx = items.reduce((acc, a) => acc + (exerciseCounts[a.id] || 0), 0);

        return (
          <button
            key={category}
            type="button"
            onClick={() => openSubject(category)}
            className="group relative flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden text-left transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label={`Abrir matéria ${category}`}
          >
            {/* Cover */}
            <div
              className="relative block h-32 w-full overflow-hidden"
              style={{
                backgroundImage: cover
                  ? `linear-gradient(135deg, ${color}66 0%, #0b1220cc 100%), url("${cover}")`
                  : `linear-gradient(135deg, ${color}dd 0%, ${color}33 55%, #0b1220 100%)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              {source && (
                <span className="absolute right-3 top-3 inline-block rounded-md bg-black/55 backdrop-blur-sm px-2 py-[3px] text-[10px] font-semibold uppercase tracking-wider text-white/95 ring-1 ring-white/10">
                  {source === 'ava' ? 'Ava' : source === 'presencial' ? 'Presencial' : source}
                </span>
              )}
              <span className="absolute right-3 bottom-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.2} />
              </span>
              <span className="absolute left-4 right-12 bottom-3 font-display font-semibold text-white text-lg leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] line-clamp-2">
                {category}
              </span>
            </div>

            {/* Meta */}
            <div className="flex w-full items-center gap-2 px-4 py-2.5">
              <div className="flex flex-1 flex-wrap items-center gap-1.5 min-w-0">
                {items.length === 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-[3px] text-[10px] font-medium text-amber-500/80 border border-amber-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Aguardando conteúdo
                  </span>
                ) : inProgress ? (
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
                {(semester || profile?.semester) && (
                  <span
                    className="inline-flex items-center rounded-md px-2 py-[3px] text-[10px] font-medium text-white/90"
                    style={{ backgroundColor: `${color}55` }}
                  >
                    {semester || profile?.semester}º Sem.
                  </span>
                )}
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
                {items.length === 0 
                  ? 'Vazio' 
                  : `${items.length} ${items.length === 1 ? 'apostila' : 'apostilas'}`}
                {totalEx > 0 ? ` · ${totalEx} ex.` : ''}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
