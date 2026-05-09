import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Crown, Medal, Award } from 'lucide-react';

type RankEntry = { user_id: string; xp_points: number; level: number; full_name: string };

export function Leaderboard() {
  const [ranking, setRanking] = useState<RankEntry[]>([]);

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    const { data: xpData } = await supabase.from('user_xp').select('user_id, xp_points, level').order('xp_points', { ascending: false }).limit(10);
    if (!xpData || xpData.length === 0) return;

    const userIds = xpData.map(x => x.user_id);
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', userIds);
    const nameMap: Record<string, string> = {};
    profiles?.forEach(p => { nameMap[p.user_id] = p.full_name || 'Anônimo'; });

    setRanking(xpData.map(x => ({
      ...x, full_name: nameMap[x.user_id] || 'Anônimo'
    })));
  };

  const icons = [
    <Crown className="h-4 w-4 text-yellow-500" />,
    <Medal className="h-4 w-4 text-gray-400" />,
    <Award className="h-4 w-4 text-amber-600" />,
  ];

  if (ranking.length === 0) return null;

  return (
    <Card className="p-5 hover-lift bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl">
      <h3 className="text-xs font-semibold mb-4 flex items-center gap-2 text-primary uppercase tracking-widest">
        <Crown className="h-4 w-4 text-primary animate-pulse" /> Ranking Global
      </h3>
      <div className="space-y-2">
        {ranking.map((r, i) => (
          <div
            key={r.user_id}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 animate-card-enter ${
              i < 3 ? 'bg-primary/5 border border-primary/10' : 'hover:bg-muted/30'
            }`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="w-6 text-center">
              {i < 3 ? icons[i] : <span className="text-[11px] text-muted-foreground font-semibold">{i + 1}º</span>}
            </span>
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                {r.full_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium flex-1 truncate">{r.full_name}</span>
            <span className="text-[10px] text-muted-foreground">Nv.{r.level}</span>
            <span className="text-xs font-bold text-primary">{r.xp_points} XP</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
