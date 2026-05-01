// Hooks de cache para o Dashboard.
// Usa React Query (já configurado em App.tsx com staleTime 5min) para evitar
// refetch a cada navegação e diminuir o trabalho do JS thread no abrir do app.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type ApostilaSummary = Pick<
  Tables<'apostilas'>,
  'id' | 'title' | 'category' | 'description' | 'cover_image_url' | 'published' | 'created_at' | 'updated_at'
>;

const APOSTILA_LIST_COLUMNS =
  'id, title, category, description, cover_image_url, published, created_at, updated_at';

/**
 * Lista todas as apostilas publicadas — SEM o campo `content` nem `content_backup`,
 * que podem somar centenas de KB. O conteúdo só carrega na ApostilaPage.
 */
export function useApostilasList() {
  return useQuery({
    queryKey: ['apostilas', 'list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apostilas')
        .select(APOSTILA_LIST_COLUMNS)
        .eq('published', true)
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
