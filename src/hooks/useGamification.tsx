import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type Badge = { id: string; name: string; description: string | null; icon: string; criteria: string | null; xp_reward: number };
type UserBadge = { id: string; badge_id: string; earned_at: string };
type Streak = { current_streak: number; longest_streak: number; last_study_date: string | null };
type XP = { xp_points: number; level: number };
type StudyGoal = { id: string; title: string; description: string; progress: number; total: number; type: 'chapter' | 'exercise' | 'streak' | 'custom'; completed: boolean; metric: string };
type Milestone = { id: string; title: string; description: string | null; category: string; achieved_at: string | null; requirement_type: string; requirement_value: number; reward_type: string | null };


export function useGamification() {
  const { user } = useAuth();
  const [xp, setXp] = useState<XP>({ xp_points: 0, level: 1 });
  const [streak, setStreak] = useState<Streak>({ current_streak: 0, longest_streak: 0, last_study_date: null });
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);



  const calcLevel = (points: number) => Math.max(1, Math.floor(points / 100) + 1);
  const xpForNextLevel = (level: number) => level * 100;

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [xpRes, streakRes, badgesRes, ubRes, goalsRes, milestonesRes] = await Promise.all([
      supabase.from('user_xp').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('study_streaks').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('badges').select('*'),
      supabase.from('user_badges').select('*').eq('user_id', user.id),
      supabase.from('study_goals').select('*').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('study_milestones').select('*').eq('user_id', user.id),
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
      const mockGoals: StudyGoal[] = [
        { id: 'goal-1', title: 'Mestre de Exercícios', description: 'Complete 50 exercícios no total', progress: Math.min(32, 50), total: 50, type: 'exercise', completed: false, metric: 'exercises' },
        { id: 'goal-2', title: 'Explorador Acadêmico', description: 'Leia 5 capítulos de apostilas', progress: 5, total: 5, type: 'chapter', completed: true, metric: 'chapters' },
        { id: 'goal-3', title: 'Foco Total', description: 'Mantenha um streak de 7 dias', progress: Math.min(streakRes.data?.current_streak || 0, 7), total: 7, type: 'streak', completed: (streakRes.data?.current_streak || 0) >= 7, metric: 'days' },
        { id: 'goal-4', title: 'Elite do Conhecimento', description: 'Alcance o Nível 10', progress: Math.min(xpRes.data?.level || 1, 10), total: 10, type: 'chapter', completed: (xpRes.data?.level || 1) >= 10, metric: 'level' },
      ];
      setGoals(mockGoals);
    }

    if (milestonesRes.data) {
      setMilestones(milestonesRes.data as Milestone[]);
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
      if (leveledUp) toast.success(`🎉 Nível ${newLevel}! +${clampedPoints} XP`);
      else toast.success(`+${clampedPoints} XP`);
    }
  }, [user, xp]);

  const updateStreak = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (streak.last_study_date === today) return; // Already studied today

    let newCurrent = 1;
    if (streak.last_study_date === yesterday) {
      newCurrent = streak.current_streak + 1;
    }
    const newLongest = Math.max(streak.longest_streak, newCurrent);

    await supabase.from('study_streaks').upsert({
      user_id: user.id, current_streak: newCurrent, longest_streak: newLongest, last_study_date: today
    }, { onConflict: 'user_id' });

    setStreak({ current_streak: newCurrent, longest_streak: newLongest, last_study_date: today });

    if (newCurrent > 1) toast.success(`🔥 Streak de ${newCurrent} dias!`);
  }, [user, streak]);

  const checkAndAwardBadge = useCallback(async (criteria: string) => {
    if (!user) return;
    const badge = badges.find(b => b.criteria === criteria);
    if (!badge) return;
    const alreadyHas = userBadges.some(ub => ub.badge_id === badge.id);
    if (alreadyHas) return;

    const { error } = await supabase.from('user_badges').insert({ user_id: user.id, badge_id: badge.id });
    if (!error) {
      setUserBadges(prev => [...prev, { id: '', badge_id: badge.id, earned_at: new Date().toISOString() }]);
      await addXP(badge.xp_reward);
      toast.success(`🏆 Conquista: ${badge.icon} ${badge.name}!`);
    }
  }, [user, badges, userBadges, addXP]);

  const updateGoal = useCallback(async (goalId: string, increment: number) => {
    if (!user) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const { data, error } = await supabase
      .from('study_goals')
      .update({ current_value: goal.progress + increment })
      .eq('id', goalId)
      .select()
      .single();

    if (!error && data) {
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, progress: data.current_value } : g));
      if (data.current_value >= data.target_value && data.status !== 'completed') {
        await supabase.from('study_goals').update({ status: 'completed' }).eq('id', goalId);
        toast.success(`🎯 Meta Concluída: ${goal.title}!`);
      }
    }
  }, [user, goals]);

  const earnedBadgeIds = userBadges.map(ub => ub.badge_id);

  return {
    xp, streak, goals, badges, userBadges, milestones, earnedBadgeIds, loading,
    addXP, updateStreak, checkAndAwardBadge, updateGoal, loadAll,
    xpForNextLevel, calcLevel
  };
}
