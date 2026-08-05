/**
 * useApostilaProgressMap — calcula o progresso real de leitura de cada apostila
 * do aluno (lições concluídas / total de lições) para exibir a marcação
 * "Em andamento" ou "Concluída" nos cards do dashboard.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ApostilaProgress = {
  completed: number;
  total: number;
  percent: number;
  status: 'nao-iniciada' | 'em-andamento' | 'concluida';
};

export type ApostilaProgressMap = Record<string, ApostilaProgress>;

export function useApostilaProgressMap() {
  const { user } = useAuth();
  const [map, setMap] = useState<ApostilaProgressMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMap({});
      setLoading(false);
      return;
    }

    let active = true;

    (async () => {
      setLoading(true);
      try {
        const [lessonsRes, progressRes] = await Promise.all([
          supabase
            .from('apostila_lessons')
            .select('id, apostila_chapters(apostila_modules(apostila_id))')
            .limit(5000),
          supabase
            .from('apostila_lesson_progress')
            .select('lesson_id, status')
            .eq('user_id', user.id)
            .limit(5000),
        ]);

        if (!active) return;

        const lessonToApostila = new Map<string, string>();
        const totals: Record<string, number> = {};

        for (const row of (lessonsRes.data as any[]) || []) {
          const apostilaId =
            row?.apostila_chapters?.apostila_modules?.apostila_id ?? null;
          if (!apostilaId) continue;
          lessonToApostila.set(row.id, apostilaId);
          totals[apostilaId] = (totals[apostilaId] || 0) + 1;
        }

        const completed: Record<string, number> = {};
        for (const row of (progressRes.data as any[]) || []) {
          if (row?.status !== 'completed' && row?.status !== 'concluida') continue;
          const apostilaId = lessonToApostila.get(row.lesson_id);
          if (!apostilaId) continue;
          completed[apostilaId] = (completed[apostilaId] || 0) + 1;
        }

        const next: ApostilaProgressMap = {};
        for (const [apostilaId, total] of Object.entries(totals)) {
          const done = completed[apostilaId] || 0;
          const percent = total > 0 ? Math.round((done / total) * 100) : 0;
          next[apostilaId] = {
            completed: done,
            total,
            percent,
            status: percent >= 100 ? 'concluida' : done > 0 ? 'em-andamento' : 'nao-iniciada',
          };
        }

        setMap(next);
      } catch {
        if (active) setMap({});
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user?.id]);

  return { progressMap: map, loading };
}
