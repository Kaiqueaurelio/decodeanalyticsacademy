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
    <Card className="p-4 bg-card border border-border/50">
      <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
        <Crown className="h-4 w-4 text-yellow-500" /> Ranking
      </h3>
      <div className="space-y-2">
        {ranking.map((r, i) => (
          <div key={r.user_id} className={`flex items-center gap-2.5 p-2 rounded-lg ${i < 3 ? 'bg-accent/40' : ''}`}>
            <span className="w-5 text-center">
              {i < 3 ? icons[i] : <span className="text-[10px] text-muted-foreground font-medium">{i + 1}</span>}
            </span>
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{r.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
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
