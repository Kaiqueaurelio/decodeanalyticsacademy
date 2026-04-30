/**
 * usePendingApostilas — Lista de apostilas pendentes (não concluídas) do aluno,
 * priorizadas para o modo "Estudar agora".
 *
 * Ordem de prioridade:
 *  1. Vinculadas a prova próxima (matching por subject/categoria)
 *  2. Favoritadas
 *  3. Já abertas (apareceram em apostila_chats) mas não concluídas
 *  4. Demais publicadas — mais recentes primeiro
 *
 * Cada item carrega `reason` para mostrar o porquê do destaque, e `progress`
 * (0..100) baseado em respostas de exercícios já dadas.
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useExamFocus } from '@/hooks/useExamFocus';

export interface PendingApostila {
  id: string;
  title: string;
  category: string | null;
  reason: string;
  priority: number; // menor = mais urgente
  progress: number; // 0..100
  isFavorite: boolean;
  hasOpened: boolean;
  examSubject?: string;
  daysUntilExam?: number;
}

export function usePendingApostilas(limit = 12) {
  const { user } = useAuth();
  const examFocus = useExamFocus();
  const [items, setItems] = useState<PendingApostila[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Busca em paralelo
      const [
        { data: published },
        { data: completions },
        { data: favorites },
        { data: chats },
      ] = await Promise.all([
        supabase
          .from('apostilas')
          .select('id, title, category, created_at')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('apostila_completions')
          .select('apostila_id')
          .eq('user_id', user.id),
        supabase
          .from('apostila_favorites')
          .select('apostila_id, created_at')
          .eq('user_id', user.id),
        supabase
          .from('apostila_chats')
          .select('apostila_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      const completedIds = new Set((completions || []).map((c) => c.apostila_id));
      const favoriteIds = new Set((favorites || []).map((f) => f.apostila_id));
      const openedIds = new Set((chats || []).map((c) => c.apostila_id));

      const all = (published || []).filter((a) => !completedIds.has(a.id));

      // Calcula progresso por exercícios respondidos
      const apostilaIds = all.map((a) => a.id);
      const progressMap: Record<string, number> = {};
      if (apostilaIds.length > 0) {
        const { data: exercises } = await supabase
          .from('exercises')
          .select('id, apostila_id')
          .in('apostila_id', apostilaIds);

        const exByApostila: Record<string, string[]> = {};
        (exercises || []).forEach((e) => {
          if (!exByApostila[e.apostila_id]) exByApostila[e.apostila_id] = [];
          exByApostila[e.apostila_id].push(e.id);
        });

        const allExIds = (exercises || []).map((e) => e.id);
        if (allExIds.length > 0) {
          const { data: answers } = await supabase
            .from('answers')
            .select('exercise_id')
            .eq('user_id', user.id)
            .in('exercise_id', allExIds);

          const answeredEx = new Set((answers || []).map((a) => a.exercise_id));
          for (const aid of apostilaIds) {
            const total = exByApostila[aid]?.length || 0;
            if (total === 0) {
              progressMap[aid] = 0;
              continue;
            }
            const done = exByApostila[aid].filter((eid) => answeredEx.has(eid)).length;
            progressMap[aid] = Math.round((done / total) * 100);
          }
        }
      }

      // Monta itens com prioridade
      const examSubjectLower = examFocus?.subject?.toLowerCase() || null;

      const pending: PendingApostila[] = all.map((a) => {
        const cat = (a.category || '').toLowerCase();
        const matchesExam =
          examSubjectLower &&
          (cat.includes(examSubjectLower) || a.title.toLowerCase().includes(examSubjectLower));

        let priority = 4;
        let reason = 'Disponível para estudo';
        if (matchesExam) {
          priority = 1;
          reason =
            examFocus!.daysUntil === 0
              ? `Prova hoje · ${examFocus!.subject}`
              : `Prova em ${examFocus!.daysUntil}d · ${examFocus!.subject}`;
        } else if (favoriteIds.has(a.id)) {
          priority = 2;
          reason = 'Favorita';
        } else if (openedIds.has(a.id)) {
          priority = 3;
          reason = 'Em andamento';
        }

        return {
          id: a.id,
          title: a.title,
          category: a.category,
          reason,
          priority,
          progress: progressMap[a.id] ?? 0,
          isFavorite: favoriteIds.has(a.id),
          hasOpened: openedIds.has(a.id),
          examSubject: matchesExam ? examFocus?.subject : undefined,
          daysUntilExam: matchesExam ? examFocus?.daysUntil : undefined,
        };
      });

      pending.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        // dentro da mesma prioridade: mais progresso primeiro (quase terminando)
        return b.progress - a.progress;
      });

      setItems(pending.slice(0, limit));
    } catch (e) {
      console.warn('[usePendingApostilas] error', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, examFocus?.subject, examFocus?.daysUntil, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, loading, reload: load };
}
