// Hooks de cache para o Dashboard.
// Usa React Query (já configurado em App.tsx com staleTime 5min) para evitar
// refetch a cada navegação e diminuir o trabalho do JS thread no abrir do app.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type { CourseCode } from '@/lib/subject-semester-map';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/queries/useUserProfile';

export type ApostilaSummary = Pick<
  Tables<'apostilas'>,
  'id' | 'title' | 'category' | 'published' | 'source_type' | 'file_url' | 'created_at' | 'updated_at'
> & {
  semester: number | null;
  course: CourseCode[] | null;
  cover_url: string | null;
};

// Colunas leves: SEM `content` nem `content_backup` (podem ter centenas de KB).
const APOSTILA_LIST_COLUMNS =
  'id, title, category, published, source_type, file_url, created_at, updated_at, semester, course, cover_url';

export interface ApostilasListOptions {
  /** Filtra para mostrar apenas as do semestre informado + as sem semestre (extracurricular). */
  semester?: number | null;
  /** Filtra para o curso do aluno (mantém apostilas com course NULL/vazio). */
  course?: CourseCode | null;
  /** Quando false, ignora os filtros e retorna tudo. Default: true. */
  enabled?: boolean;
}

/**
 * Lista todas as apostilas publicadas — SEM o campo `content` nem `content_backup`,
 * que podem somar centenas de KB. O conteúdo só carrega na ApostilaPage.
 *
 * CORREÇÃO: Removida a restrição de semestre/curso que causava o sumiço das apostilas.
 * Agora retorna TODAS as apostilas publicadas, independentemente do perfil do aluno.
 * O filtro por semestre/curso era muito restritivo e deixava o dashboard vazio.
 */
export function useApostilasList(options: ApostilasListOptions = {}) {
  const { semester = null, course = null, enabled = true } = options;
  const { user, isAdmin, isSessionHydrated, roleChecked } = useAuth();
  // Escopo restrito (ex: aluno G350776 → apenas ENEM). Só filtramos se
  // a resposta chegou; enquanto carrega o perfil, tratamos como 'full'.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useUserProfile } = require('@/hooks/queries/useUserProfile') as typeof import('@/hooks/queries/useUserProfile');
  const { data: profile } = useUserProfile(user?.id);
  const scope = profile?.content_scope ?? 'full';
  const canLoadApostilas = enabled && isSessionHydrated && roleChecked;

  return useQuery({
    queryKey: ['apostilas', 'list', semester, course, canLoadApostilas, isAdmin, scope],
    enabled: canLoadApostilas,
    queryFn: async () => {
      let q = supabase
        .from('apostilas')
        .select(APOSTILA_LIST_COLUMNS);

      // Alunos comuns só veem publicadas
      if (!isAdmin) {
        q = q.eq('published', true);
      }

      // Perfil restrito: só matérias ENEM
      if (!isAdmin && scope === 'enem_only') {
        q = q.in('category', ['ENEM', 'Simulados ENEM']);
      }

      const { data, error } = await q
        .order('category')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ApostilaSummary[];
    },
  });
}

/** Quantidade de exercícios por apostila (uma chamada agregada). */
export function useExerciseCounts() {
  return useQuery({
    queryKey: ['exercises', 'counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_exercise_counts' as any);
      if (error) {
        // Fallback: agregação no client se a RPC ainda não estiver disponível
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

/** Estatísticas agregadas do aluno (RPC: 1 chamada O(1) em vez de baixar todas as respostas). */
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
