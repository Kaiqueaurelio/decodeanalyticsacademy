import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type Badge = { id: string; name: string; description: string | null; icon: string; criteria: string | null; xp_reward: number };
type UserBadge = { id: string; badge_id: string; earned_at: string };
type Streak = { current_streak: number; longest_streak: number; last_study_date: string | null };
type XP = { xp_points: number; level: number };

export function useGamification() {
  const { user } = useAuth();
  const [xp, setXp] = useState<XP>({ xp_points: 0, level: 1 });
  const [streak, setStreak] = useState<Streak>({ current_streak: 0, longest_streak: 0, last_study_date: null });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const calcLevel = (points: number) => Math.max(1, Math.floor(points / 100) + 1);
  const xpForNextLevel = (level: number) => level * 100;

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [xpRes, streakRes, badgesRes, ubRes] = await Promise.all([
      supabase.from('user_xp').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('study_streaks').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('badges').select('*'),
      supabase.from('user_badges').select('*').eq('user_id', user.id),
    ]);
    if (xpRes.data) setXp({ xp_points: xpRes.data.xp_points, level: xpRes.data.level });
    if (streakRes.data) setStreak({ current_streak: streakRes.data.current_streak, longest_streak: streakRes.data.longest_streak, last_study_date: streakRes.data.last_study_date });
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

  const earnedBadgeIds = userBadges.map(ub => ub.badge_id);

  return {
    xp, streak, badges, userBadges, earnedBadgeIds, loading,
    addXP, updateStreak, checkAndAwardBadge, loadAll,
    xpForNextLevel, calcLevel
  };
}
