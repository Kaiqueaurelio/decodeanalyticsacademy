import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Wand2, ArrowRight, Trophy } from 'lucide-react';

export function WeeklySimuladoCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<{ kind: 'none' } | { kind: 'in_progress'; id: string; total: number; answered: number } | { kind: 'finished'; id: string; score: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // último simulado da semana
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data } = await supabase
        .from('weekly_simulados')
        .select('id, status, total_questions, score')
        .eq('user_id', user.id)
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) { setState({ kind: 'none' }); return; }
      if (data.status === 'finished') {
        setState({ kind: 'finished', id: data.id, score: Number(data.score) });
        return;
      }
      // em andamento → conta respondidas
      const { count } = await supabase
        .from('weekly_simulado_answers')
        .select('*', { count: 'exact', head: true })
        .eq('simulado_id', data.id)
        .not('selected_answer', 'is', null);
      setState({ kind: 'in_progress', id: data.id, total: data.total_questions, answered: count || 0 });
    })();
  }, [user]);

  if (!state) return null;

  const isInProgress = state.kind === 'in_progress';
  const isFinished = state.kind === 'finished';

  return (
    <Card
      onClick={() => navigate('/simulado')}
      className="p-4 cursor-pointer smooth-all hover:shadow-md hover-lift bg-gradient-to-br from-purple-500/10 via-card to-card border border-purple-500/30"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
            {isFinished ? <Trophy className="h-5 w-5 text-purple-400" /> : <Target className="h-5 w-5 text-purple-400" />}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-purple-400 font-mono font-semibold">
              Simulado da Semana
            </p>
            <p className="text-sm font-semibold leading-tight truncate">
              {isInProgress && `${state.answered}/${state.total} respondidas — continue`}
              {isFinished && `Resultado: ${state.score.toFixed(0)}% de acerto`}
              {state.kind === 'none' && '20 questões — diagnóstico de fraquezas'}
            </p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
              <Wand2 className="h-3 w-3" />
              {isFinished ? 'Veja seu diagnóstico por disciplina' : 'Várias matérias • +5 XP a cada acerto'}
            </p>
          </div>
        </div>
        <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white gap-1 shrink-0">
          {isInProgress ? 'Continuar' : isFinished ? 'Ver resultado' : 'Começar'}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
