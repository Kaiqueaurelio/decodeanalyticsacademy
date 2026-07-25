import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Calendar, Clock, RefreshCw, ChevronRight, BookOpen, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { getSubjectColor } from '@/lib/subject-colors';

interface PlanItem {
  id: string;
  apostila_id: string;
  apostila_title: string;
  subject: string | null;
  reason: string;
  pomodoros: number;
  related_event_title: string | null;
  related_event_date: string | null;
  completed: boolean;
  sort_order: number;
}

/**
 * Widget "Plano de Estudos Inteligente" — mostra o cronograma de hoje
 * gerado a partir das provas do calendário e apostilas pendentes.
 */
export function StudyPlanWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_date', todayStr)
      .order('sort_order', { ascending: true });
    setItems((data as PlanItem[]) || []);
    setLoading(false);
  }, [user, todayStr]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-study-plan', { body: {} });
      if (error) throw error;
      const inserted = (data as { inserted?: number })?.inserted ?? 0;
      if (inserted === 0) toast.info('Nenhuma apostila pendente — você está em dia!');
      else toast.success(`Plano gerado: ${inserted} sessões nos próximos dias`);
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao gerar plano';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const toggleComplete = async (item: PlanItem, checked: boolean) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: checked } : i));
    const { error } = await supabase
      .from('study_plans')
      .update({ completed: checked, completed_at: checked ? new Date().toISOString() : null })
      .eq('id', item.id);
    if (error) {
      toast.error('Erro ao salvar');
      load();
    } else if (checked) {
      toast.success('+10 XP por sessão concluída', { duration: 2000 });
      await supabase.rpc('increment_xp', { _user_id: user!.id, _amount: 10 });
    }
  };

  const totalPomodoros = items.reduce((s, i) => s + i.pomodoros, 0);
  const completedCount = items.filter(i => i.completed).length;
  const allDone = items.length > 0 && completedCount === items.length;

  return (
    <Card className="p-5 hover-lift bg-gradient-to-br from-primary/5 via-card to-card border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight">Plano de Estudos de Hoje</h3>
            <p className="text-[10px] text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={generate}
          disabled={generating}
          className="h-8 text-xs gap-1.5"
        >
          <RefreshCw className={`h-3 w-3 ${generating ? 'animate-spin' : ''}`} />
          {items.length === 0 ? 'Gerar' : 'Recalcular'}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-shimmer h-12 rounded-lg" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-6">
          <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">Nenhum plano gerado ainda</p>
          <p className="text-xs text-muted-foreground mb-4">
            A IA vai analisar suas provas e apostilas para montar seu cronograma.
          </p>
          <Button size="sm" onClick={generate} disabled={generating} className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {generating ? 'Gerando...' : 'Gerar meu plano'}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {items.length} sessões</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> ≈ {totalPomodoros * 25}min</span>
            <span className="ml-auto font-semibold text-primary">{completedCount}/{items.length}</span>
          </div>

          <div className="space-y-2">
            {items.map((item) => {
              const color = getSubjectColor(item.subject || 'Geral');
              const urgent = item.related_event_date &&
                Math.ceil((new Date(item.related_event_date + 'T23:59:59').getTime() - Date.now()) / 86400000) <= 3;
              return (
                <div
                  key={item.id}
                  className={`group flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    item.completed
                      ? 'bg-muted/30 border-border/40 opacity-60'
                      : 'bg-card border-border/60 hover:border-primary/30'
                  }`}
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={(v) => toggleComplete(item, !!v)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                        {item.subject || 'Geral'}
                      </Badge>
                      {urgent && (
                        <Badge className="text-[9px] px-1.5 py-0 h-4 bg-destructive/15 text-destructive border-destructive/30">
                          <AlertTriangle className="h-2 w-2 mr-0.5" /> URGENTE
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/apostila/${item.apostila_id}`)}
                      className={`text-sm font-medium text-left hover:text-primary transition-colors line-clamp-1 block w-full ${
                        item.completed ? 'line-through' : ''
                      }`}
                    >
                      {item.apostila_title}
                    </button>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                      {item.reason} · {item.pomodoros} pomodoro{item.pomodoros > 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/apostila/${item.apostila_id}`)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
                    aria-label="Abrir apostila"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {allDone && (
            <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/30 text-center">
              <p className="text-sm font-semibold text-primary">Plano de hoje concluído.</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Volte amanhã para a próxima rodada.</p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
