// Hooks de cache para o Dashboard.
// Usa React Query (ja configurado em App.tsx com staleTime 5min) para evitar
// refetch a cada navegacao e diminuir o trabalho do JS thread no abrir do app.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { guessSemesterFromCategory, type CourseCode } from '@/lib/subject-semester-map';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/queries/useUserProfile';

export type ApostilaSummary = Pick<
  Tables<'apostilas'>,
  'id' | 'title' | 'category' | 'published' | 'source_type' | 'file_url' | 'created_at' | 'updated_at'
> & {
  semester: number | null;
  course: CourseCode[] | null;
  cover_url: string | null;
  teacher: string | null;
};

// Colunas leves: SEM `content` nem `content_backup` (podem ter centenas de KB).
const APOSTILA_LIST_COLUMNS =
  'id, title, category, published, source_type, file_url, created_at, updated_at, semester, course, cover_url, teacher';

export interface ApostilasListOptions {
  /** Mantido na queryKey para atualizar a UI quando o aluno troca o semestre. O filtro final fica na tela. */
  semester?: number | null;
  /** Filtra para o curso do aluno (mantem apostilas com course NULL/vazio). */
  course?: CourseCode | null;
  /** Quando false, ignora os filtros e retorna tudo. Default: true. */
  enabled?: boolean;
}

/**
 * Lista todas as apostilas publicadas — SEM o campo `content` nem `content_backup`,
 * que podem somar centenas de KB. O conteudo so carrega na ApostilaPage.
 *
 * Importante: nao filtramos por semestre no banco. Muitas apostilas antigas foram
 * cadastradas sem `semester` ou com pequenas variacoes no nome da disciplina; se o
 * filtro rodar no Supabase elas desaparecem do aluno antes de podermos normalizar.
 */
export function useApostilasList(options: ApostilasListOptions = {}) {
  const { semester = null, course = null, enabled = true } = options;
  const { user, isAdmin, isSessionHydrated, roleChecked } = useAuth();
  const { data: profile } = useUserProfile(user?.id);
  const scope = profile?.content_scope ?? 'full';
  const canLoadApostilas = enabled && isSessionHydrated && roleChecked;

  return useQuery({
    queryKey: ['apostilas', 'list', semester, course, canLoadApostilas, isAdmin, scope],
    enabled: canLoadApostilas,
    refetchInterval: 15000,
    queryFn: async () => {
      let q = supabase
        .from('apostilas')
        .select(APOSTILA_LIST_COLUMNS);

      if (!isAdmin) {
        q = q.eq('published', true);
      }

      if (!isAdmin && scope === 'enem_only') {
        q = q.in('category', ['ENEM']);
      }

      if (!isAdmin && scope === 'no_enem') {
        q = q.neq('category', 'ENEM');
      }

      const { data, error } = await q
        .order('category')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return ((data || []) as ApostilaSummary[]).map((apostila) => ({
        ...apostila,
        semester: apostila.semester ?? guessSemesterFromCategory(apostila.category) ?? null,
      }));
    },
  });
}

/** Quantidade de exercicios por apostila (uma chamada agregada). */
export function useExerciseCounts() {
  return useQuery({
    queryKey: ['exercises', 'counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_exercise_counts' as any);
      if (error) {
        const { data: rows } = await supabase.from('exercises').select('apostila_id');
        const counts: Record<string, number> = {};
        rows?.forEach((r) => {
          if (r.apostila_id) counts[r.apostila_id] = (counts[r.apostila_id] || 0) + 1;
        });
        return counts;
      }
      return (data || {}) as Record<string, number>;
    },
  });
}

export interface DashboardStats {
  total: number;
  hits: number;
  errors: number;
  byApostila: Record<string, { title: string; hits: number; errors: number }>;
}

/** Estatisticas agregadas do aluno (RPC: 1 chamada O(1) em vez de baixar todas as respostas). */
export function useDashboardStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'stats', userId],
    enabled: !!userId,
    queryFn: async (): Promise<DashboardStats> => {
      const { data, error } = await supabase.rpc('get_dashboard_stats' as any, {
        _user_id: userId,
      });
      if (error) {
        return { total: 0, hits: 0, errors: 0, byApostila: {} };
      }
      const obj = (data || {}) as any;
      return {
        total: Number(obj.total || 0),
        hits: Number(obj.hits || 0),
        errors: Number(obj.errors || 0),
        byApostila: (obj.byApostila || {}) as DashboardStats['byApostila'],
      };
    },
  });
}
