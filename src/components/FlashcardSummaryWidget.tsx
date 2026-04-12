import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Brain, Play, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function FlashcardSummaryWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [total, setTotal] = useState(0);
  const [dueToday, setDueToday] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count: totalCount } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setTotal(totalCount || 0);

      const { count: dueCount } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lte('next_review', new Date().toISOString());
      setDueToday(dueCount || 0);
    };
    load();
  }, [user]);

  const dailyGoal = Number(localStorage.getItem('flashcardsPerDay') || '10');
  const reviewed = Math.max(0, (total - dueToday));
  const progressPct = dailyGoal > 0 ? Math.min(100, Math.round((reviewed / dailyGoal) * 100)) : 0;

  return (
    <Card className="p-4 bg-card border border-border/50">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <Brain className="h-4 w-4 text-primary" /> Flashcards
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-center p-2.5 rounded-lg bg-muted/50">
          <p className="text-lg font-bold">{total}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className={`text-center p-2.5 rounded-lg ${dueToday > 0 ? 'bg-warning/10' : 'bg-success/10'}`}>
          <p className="text-lg font-bold">{dueToday}</p>
          <p className="text-[10px] text-muted-foreground">Para revisar</p>
        </div>
      </div>

      {/* Daily goal progress */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>Meta diária</span>
          <span>{reviewed}/{dailyGoal}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {dueToday > 0 ? (
        <Button size="sm" className="w-full text-xs gap-1.5" onClick={() => navigate('/dashboard')}>
          <Play className="h-3 w-3" /> Revisar {dueToday} cards
        </Button>
      ) : (
        <div className="flex items-center justify-center gap-1.5 text-xs text-success py-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> Revisões em dia!
        </div>
      )}
    </Card>
  );
}
