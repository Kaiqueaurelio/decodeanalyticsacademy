// Hooks de cache para o Dashboard.
// Usa React Query (ja configurado em App.tsx com staleTime 5min) para evitar
// refetch a cada navegacao e diminuir o trabalho do JS thread no abrir do app.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json, Tables } from '@/integrations/supabase/types';
import { guessSemesterFromCategory, type CourseCode } from '@/lib/subject-semester-map';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { getApostilaPageSavedDate, isMissingApostilaPageSavedDateColumn } from '@/lib/apostila-pages';

export type ApostilaSummary = Pick<
  Tables<'apostilas'>,
  'id' | 'title' | 'category' | 'published' | 'source_type' | 'file_url' | 'created_at' | 'updated_at'
> & {
  semester: number | null;
  course: string[] | null;
  cover_url: string | null;
  teacher: string | null;
  saved_date: string | null;
};

// Colunas leves: SEM `content` nem `content_backup` (podem ter centenas de KB).
const APOSTILA_LIST_COLUMNS =
  'id, title, category, published, source_type, file_url, created_at, updated_at, semester, course, cover_url, teacher';

function isJsonObject(value: Json | null | undefined): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toFiniteNumber(value: Json | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function toNumberRecord(value: Json | null | undefined): Record<string, number> {
  if (!isJsonObject(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, raw]) => [key, toFiniteNumber(raw)]),
  );
}

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
    // A lista não deve oscilar a cada 15s enquanto o mapeamento de semestre é carregado.
    // A atualização continua ocorrendo ao voltar o foco para a aplicação.
    refetchInterval: false,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      let q = supabase
        .from('apostilas')
        .select(APOSTILA_LIST_COLUMNS);

      if (!isAdmin) {
        // Alunos veem apenas publicadas
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

      const rows = data || [];
      const latestDateByApostila = new Map<string, string>();
      const apostilaIds = rows.map((apostila) => apostila.id);

      if (apostilaIds.length > 0) {
        // We select all potentially useful columns for date resolution.
        // The type mismatch reported by the build system occurs because the catch-block 
        // fallback query omitted 'saved_date' while the rest of the logic expected it.
        const { data: pageData, error: pageError } = await supabase
          .from('apostila_pages')
          .select('apostila_id, saved_date, updated_at, created_at')
          .in('apostila_id', apostilaIds)
          .order('updated_at', { ascending: false });

        if (!pageError && pageData) {
          for (const page of pageData) {
            if (latestDateByApostila.has(page.apostila_id)) continue;
            const date = getApostilaPageSavedDate(page);
            if (date) latestDateByApostila.set(page.apostila_id, date);
          }
        }
      }

      return rows.map((apostila) => ({
        ...apostila,
        saved_date: latestDateByApostila.get(apostila.id) ?? null,
      })).map((apostila): ApostilaSummary => {
        let semester = apostila.semester ?? guessSemesterFromCategory(apostila.category) ?? null;
        
        // Correção explícita para Sistemas Operacionais e Mobile (S6)
        const cat = (apostila.category || '').toLowerCase();
        if (cat.includes('sistemas operacionais') || cat.includes('mobile')) {
          semester = 6;
        }

        // Se for Bônus ou Canivete Suíço, forçamos a visibilidade em todos os semestres (semester: 0)
        const isBonus = (cat.includes('bônus') || cat.includes('canivete') || cat.includes('bonus'));
        return {
          ...apostila,
          semester: isBonus ? 0 : semester,
        };
      });
    },
  });
}

/** Quantidade de exercicios por apostila (uma chamada agregada). */
export function useExerciseCounts() {
  return useQuery({
    queryKey: ['exercises', 'counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_exercise_counts');
      if (error) {
        const { data: rows } = await supabase.from('exercises').select('apostila_id');
        const counts: Record<string, number> = {};
        rows?.forEach((r) => {
          if (r.apostila_id) counts[r.apostila_id] = (counts[r.apostila_id] || 0) + 1;
        });
        return counts;
      }
      return toNumberRecord(data);
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
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        _user_id: userId,
      });
      if (error) {
        return { total: 0, hits: 0, errors: 0, byApostila: {} };
      }
      if (!isJsonObject(data)) return { total: 0, hits: 0, errors: 0, byApostila: {} };

      const byApostila: DashboardStats['byApostila'] = {};
      if (isJsonObject(data.byApostila)) {
        Object.entries(data.byApostila).forEach(([id, raw]) => {
          if (!isJsonObject(raw)) return;
          byApostila[id] = {
            title: typeof raw.title === 'string' ? raw.title : 'Apostila',
            hits: toFiniteNumber(raw.hits),
            errors: toFiniteNumber(raw.errors),
          };
        });
      }

      return {
        total: toFiniteNumber(data.total),
        hits: toFiniteNumber(data.hits),
        errors: toFiniteNumber(data.errors),
        byApostila,
      };
    },
  });
}
