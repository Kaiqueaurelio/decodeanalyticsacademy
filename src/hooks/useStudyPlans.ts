import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { StudyPlan, StudyPlanTask, StudyPlanVersion } from '@/lib/study-plan';

/**
 * Estado do módulo Plano de Estudos Inteligente.
 * Todas as consultas são filtradas pelo usuário autenticado e reforçadas
 * pelas políticas de acesso do banco (cada aluno só alcança os próprios dados).
 */
export function useStudyPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    if (!user) {
      setPlans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('planos_estudo')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (err) setError('Não foi possível carregar seus planos de estudo.');
    else setError(null);
    setPlans((data as unknown as StudyPlan[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  return { plans, loading, error, reload: loadPlans };
}

export function useStudyPlanDetail(planId: string | null) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<StudyPlanTask[]>([]);
  const [versions, setVersions] = useState<StudyPlanVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!planId || !user) {
      setTasks([]);
      setVersions([]);
      return;
    }
    setLoading(true);
    const [taskRes, versionRes] = await Promise.all([
      supabase
        .from('planos_estudo_tarefas')
        .select('*')
        .eq('plan_id', planId)
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true }),
      supabase
        .from('planos_estudo_versoes')
        .select('*')
        .eq('plan_id', planId)
        .eq('user_id', user.id)
        .order('version', { ascending: false }),
    ]);
    setTasks((taskRes.data as unknown as StudyPlanTask[]) ?? []);
    setVersions((versionRes.data as unknown as StudyPlanVersion[]) ?? []);
    setLoading(false);
  }, [planId, user]);

  useEffect(() => { load(); }, [load]);

  /** Marca/desmarca uma atividade — atualização otimista com reversão em caso de falha. */
  const toggleTask = useCallback(
    async (task: StudyPlanTask) => {
      if (!user) return false;
      const next = !task.done;
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: next } : t)));
      const { error } = await supabase
        .from('planos_estudo_tarefas')
        .update({ done: next, done_at: next ? new Date().toISOString() : null })
        .eq('id', task.id)
        .eq('user_id', user.id);
      if (error) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !next } : t)));
        return false;
      }
      return true;
    },
    [user],
  );

  return { tasks, versions, loading, reload: load, toggleTask };
}
