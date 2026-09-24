import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type Badge = { id: string; name: string; description: string | null; icon: string; criteria: string | null; xp_reward: number };
type UserBadge = { id: string; badge_id: string; earned_at: string };
type Streak = { current_streak: number; longest_streak: number; last_study_date: string | null };
type XP = { xp_points: number; level: number };
type StudyGoal = { id: string; title: string; description: string; progress: number; total: number; type: 'chapter' | 'exercise' | 'streak' | 'custom'; completed: boolean; metric: string; frequency?: string; category?: string };
type Milestone = { id: string; title: string; description: string | null; category: string; achieved_at: string | null; requirement_type: string; requirement_value: number; reward_type: string | null; icon?: string };
type StudyHistory = { date: string; xp_gained: number; chapters_completed: number; exercises_completed: number; time_spent_minutes: number };
type StreakRpcResult = { current_streak?: number; longest_streak?: number; last_study_date?: string | null };
type BadgeAwardResult = { awarded?: boolean; badge_id?: string | null };


export function useGamification() {
  const { user } = useAuth();
  const [xp, setXp] = useState<XP>({ xp_points: 0, level: 1 });
  const [streak, setStreak] = useState<Streak>({ current_streak: 0, longest_streak: 0, last_study_date: null });
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [history, setHistory] = useState<StudyHistory[]>([]);
  const [loading, setLoading] = useState(true);



  const calcLevel = (points: number) => Math.max(1, Math.floor(points / 100) + 1);
  const xpForNextLevel = (level: number) => level * 100;

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [xpRes, streakRes, badgesRes, ubRes, goalsRes, milestonesRes, historyRes] = await Promise.all([
      supabase.from('user_xp').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('study_streaks').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('badges').select('*'),
      supabase.from('user_badges').select('*').eq('user_id', user.id),
      (supabase.from('study_goals' as any).select('*') as any).eq('user_id', user.id).eq('status', 'active'),
      (supabase.from('study_milestones' as any).select('*') as any).eq('user_id', user.id),
      supabase.from('study_history' as any).select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
    ]);

    if (xpRes.data) setXp({ xp_points: xpRes.data.xp_points, level: xpRes.data.level });
    if (streakRes.data) setStreak({ current_streak: streakRes.data.current_streak, longest_streak: streakRes.data.longest_streak, last_study_date: streakRes.data.last_study_date });
    
    if (goalsRes.data && goalsRes.data.length > 0) {
      setGoals(goalsRes.data.map(g => ({
        id: g.id,
        title: g.metadata?.title || (g.type === 'daily' ? 'Meta Diária' : 'Meta Personalizada'),
        description: g.metadata?.description || `Meta de ${g.target_value} ${g.metric}`,
        progress: g.current_value,
        total: g.target_value,
        type: g.metric as any,
        completed: g.status === 'completed',
        metric: g.metric
      })));
    } else {
      setGoals([]);
    }

    if (milestonesRes.data) {
      setMilestones(milestonesRes.data as Milestone[]);
    }

    if (historyRes.data) {
      setHistory(historyRes.data as unknown as StudyHistory[]);
    }

    if (badgesRes.data) setBadges(badgesRes.data as Badge[]);
    if (ubRes.data) setUserBadges(ubRes.data as UserBadge[]);
    setLoading(false);

  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addXP = useCallback(async (points: number) => {
    if (!user) return;
    const clampedPoints = Math.min(Math.max(1, points), 100);
    const newPoints = xp.xp_points + clampedPoints;
    const newLevel = calcLevel(newPoints);
    const leveledUp = newLevel > xp.level;

    const { error } = await supabase.rpc('increment_xp', {
      _user_id: user.id, _amount: clampedPoints
    });

    if (!error) {
      setXp({ xp_points: newPoints, level: newLevel });
      await supabase.rpc('log_study_activity', {
        _user_id: user.id,
        _xp: clampedPoints
      });
      if (leveledUp) toast.success(`🎉 Nível ${newLevel}! +${clampedPoints} XP`);
      else toast.success(`+${clampedPoints} XP`);
    }
  }, [user, xp]);

  const updateStreak = useCallback(async () => {
    if (!user) return;
    const { data: updatedStreak, error } = await (supabase.rpc as any)('record_study_streak', {
      _user_id: user.id,
    });

    if (error || !updatedStreak) {
      toast.error('Não foi possível atualizar seu streak agora. Tente novamente.');
      return;
    }

    const row = (Array.isArray(updatedStreak) ? updatedStreak[0] : updatedStreak) as StreakRpcResult;
    const newCurrent = Number(row?.current_streak ?? 0);
    const newLongest = Number(row?.longest_streak ?? 0);
    const newLastDate = typeof row?.last_study_date === 'string' ? row.last_study_date : null;

    setStreak({
      current_streak: newCurrent,
      longest_streak: newLongest,
      last_study_date: newLastDate,
    });

    if (newCurrent > streak.current_streak) toast.success(`🔥 Streak de ${newCurrent} dias!`);
    
    // Log history
    await supabase.rpc('log_study_activity', {
      _user_id: user.id,
      _minutes: 5 // Default study activity
    });
  }, [user, streak]);

  const checkAndAwardBadge = useCallback(async (criteria: string) => {
    if (!user) return;
    const badge = badges.find(b => b.criteria === criteria);
    if (!badge) return;
    const alreadyHas = userBadges.some(ub => ub.badge_id === badge.id);
    if (alreadyHas) return;

    const { data: awardResult, error } = await supabase.rpc('award_badge', {
      _criteria: criteria,
    });
    const result = awardResult as BadgeAwardResult | null;
    if (!error && result?.awarded) {
      setUserBadges(prev => [...prev, { id: result.badge_id || '', badge_id: badge.id, earned_at: new Date().toISOString() }]);
      await loadAll();
      toast.success(`🏆 Conquista: ${badge.icon} ${badge.name}!`);
    }
  }, [user, badges, userBadges, addXP]);

  const updateGoal = useCallback(async (goalId: string, increment: number) => {
    if (!user) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const { data, error } = await (supabase
      .from('study_goals' as any)
      .update({ current_value: goal.progress + increment } as any)
      .eq('id', goalId)
      .select()
      .single() as any);

    if (!error && data) {
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, progress: data.current_value } : g));
      if (data.current_value >= data.target_value && data.status !== 'completed') {
        await (supabase.from('study_goals' as any).update({ status: 'completed' } as any).eq('id', goalId) as any);
        toast.success(`🎯 Meta Concluída: ${goal.title}!`);
      }
      
      // Log activity to history
      await supabase.rpc('log_study_activity', {
        _user_id: user.id,
        _chapters: goal.metric === 'chapters' ? increment : 0,
        _exercises: goal.metric === 'exercises' ? increment : 0
      });
    }
  }, [user, goals]);

  const addGoal = useCallback(async (newGoal: Partial<StudyGoal>) => {
    if (!user) return;
    const { data, error } = await (supabase
      .from('study_goals' as any)
      .insert([{
        user_id: user.id,
        type: newGoal.type || 'custom',
        metric: newGoal.metric,
        target_value: newGoal.total,
        current_value: 0,
        status: 'active',
        metadata: { 
          title: newGoal.title, 
          description: newGoal.description,
          frequency: newGoal.frequency,
          category: newGoal.category
        }
      }] as any)
      .select()
      .single() as any);

    if (!error && data) {
      loadAll();
      toast.success('Meta de estudo criada com sucesso!');
    } else {
      toast.error('Erro ao criar meta.');
    }
  }, [user, loadAll]);

  const earnedBadgeIds = userBadges.map(ub => ub.badge_id);

  return {
    xp, streak, goals, badges, userBadges, milestones, history, earnedBadgeIds, loading,
    addXP, updateStreak, checkAndAwardBadge, updateGoal, addGoal, loadAll,
    xpForNextLevel, calcLevel
  };
}
