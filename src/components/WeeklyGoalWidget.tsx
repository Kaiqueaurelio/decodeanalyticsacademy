import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Target, CheckCircle } from 'lucide-react';

const WEEKLY_GOAL = 30; // exercises per week

export function WeeklyGoalWidget() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    supabase
      .from('answers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', weekAgo.toISOString())
      .then(({ count: c }) => setCount(c || 0));
  }, [user]);

  const pct = Math.min(100, Math.round((count / WEEKLY_GOAL) * 100));
  const isComplete = count >= WEEKLY_GOAL;
  const circumference = 2 * Math.PI * 40;
  const strokeDash = (pct / 100) * circumference;

  return (
    <Card className="p-4 bg-card border border-border/50">
      <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" /> Meta Semanal
      </h3>
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
            />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke={isComplete ? 'hsl(var(--success))' : 'hsl(var(--primary))'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - strokeDash}
              transform="rotate(-90 50 50)"
              className="smooth-all"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isComplete ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <>
                <span className="text-lg font-bold">{count}</span>
                <span className="text-[9px] text-muted-foreground">/{WEEKLY_GOAL}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <p className="text-center text-[10px] text-muted-foreground mt-2">
        {isComplete ? 'Meta concluída! 🎉' : `${WEEKLY_GOAL - count} exercícios restantes`}
      </p>
    </Card>
  );
}
