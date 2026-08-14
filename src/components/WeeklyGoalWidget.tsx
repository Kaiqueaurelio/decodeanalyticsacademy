import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Target, CheckCircle, PartyPopper } from 'lucide-react';

const DEFAULT_GOAL = 30;

function getWeeklyGoal() {
  const saved = localStorage.getItem('weeklyExerciseGoal');
  return saved ? Number(saved) : DEFAULT_GOAL;
}

export function WeeklyGoalWidget() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState(getWeeklyGoal);
  const [streakInfo, setStreakInfo] = useState({ current: 0, lastDate: '' });

  useEffect(() => {
    const handleStorage = () => setWeeklyGoal(getWeeklyGoal());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!user) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    Promise.all([
      supabase
        .from('answers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', weekAgo.toISOString()),
      supabase
        .from('study_streaks')
        .select('current_streak, last_study_date')
        .eq('user_id', user.id)
        .maybeSingle()
    ]).then(([{ count: c }, { data: streak }]) => {
      setCount(c || 0);
      if (streak) {
        setStreakInfo({ 
          current: streak.current_streak, 
          lastDate: streak.last_study_date 
        });
      }
    });
  }, [user]);

  const WEEKLY_GOAL = weeklyGoal;
  const pct = Math.min(100, Math.round((count / WEEKLY_GOAL) * 100));
  const isComplete = count >= WEEKLY_GOAL;
  const circumference = 2 * Math.PI * 40;
  const strokeDash = (pct / 100) * circumference;

  return (
    <Card className="p-5 hover-lift">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" /> Meta Semanal
      </h3>
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="110" height="110" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="5"
            />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke={isComplete ? 'hsl(var(--success))' : 'hsl(var(--primary))'}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - strokeDash}
              transform="rotate(-90 50 50)"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isComplete ? (
              <CheckCircle className="h-6 w-6 text-success animate-check-pop" />
            ) : (
              <>
                <span className="text-xl font-bold">{count}</span>
                <span className="text-[10px] text-muted-foreground">de {WEEKLY_GOAL}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <p className="text-center text-xs text-muted-foreground">
          {isComplete ? (
            <span className="text-success font-medium flex items-center justify-center gap-1">
              <PartyPopper className="h-3.5 w-3.5" /> Meta concluída!
            </span>
          ) : (
            `Faltam ${WEEKLY_GOAL - count} exercícios para completar`
          )}
        </p>
        {streakInfo.current > 0 && (
          <div className="flex items-center justify-center gap-1.5 pt-1 border-t border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Fogo:</span>
            <span className="text-xs font-bold text-orange-500 flex items-center gap-0.5">
              🔥 {streakInfo.current} dias
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
