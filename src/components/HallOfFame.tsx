import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, Flame, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RankingUser {
  full_name: string | null;
  xp_points: number;
  level: number;
  avatar_url: string | null;
  current_streak: number;
}

export const HallOfFame = () => {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            full_name,
            avatar_url,
            user_xp (xp_points, level),
            study_streaks (current_streak)
          `)
          .order('user_xp(xp_points)', { ascending: false })
          .limit(5);

        if (error) throw error;

        const formattedData = (data || []).map((item: any) => ({
          full_name: item.full_name || 'Estudante Anônimo',
          xp_points: item.user_xp?.[0]?.xp_points || 0,
          level: item.user_xp?.[0]?.level || 1,
          avatar_url: item.avatar_url,
          current_streak: item.study_streaks?.[0]?.current_streak || 0
        })).filter(u => u.xp_points > 0);

        setRanking(formattedData);
      } catch (err) {
        console.error('Error fetching ranking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  const getRankConfig = (index: number) => {
    switch (index) {
      case 0: return { icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" };
      case 1: return { icon: Medal, color: "text-slate-300", bg: "bg-slate-300/10", border: "border-slate-300/30" };
      case 2: return { icon: Award, color: "text-amber-600", bg: "bg-amber-600/10", border: "border-amber-600/30" };
      default: return { icon: User, color: "text-cyan-400/50", bg: "bg-cyan-400/5", border: "border-cyan-400/20" };
    }
  };

  return (
    <Card className="bg-black/40 border-cyan-500/30 backdrop-blur-xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-cyan-400 font-space text-sm tracking-wider uppercase">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Hall da Fama
          </div>
          <span className="text-[10px] text-muted-foreground font-sans lowercase">top global</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))
        ) : ranking.length > 0 ? (
          <AnimatePresence>
            {ranking.map((user, i) => {
              const cfg = getRankConfig(i);
              return (
                <motion.div
                  key={user.full_name + i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center justify-between p-2.5 rounded-xl ${cfg.bg} border ${cfg.border} transition-colors hover:bg-white/5 group`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-9 w-9 border border-white/10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-cyan-500/10 text-cyan-400 text-xs">
                          {user.full_name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black border ${cfg.border} flex items-center justify-center`}>
                        <span className={`text-[9px] font-black ${cfg.color}`}>{i + 1}</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-white truncate max-w-[100px]">{user.full_name}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-medium text-white/40 uppercase tracking-tighter">Nível {user.level}</span>
                        {user.current_streak > 0 && (
                          <div className="flex items-center gap-0.5 text-orange-400">
                            <Flame className="w-2 h-2 fill-current" />
                            <span className="text-[9px] font-bold">{user.current_streak}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <span className="font-black text-xs text-cyan-400 group-hover:scale-110 transition-transform">{user.xp_points}</span>
                      <span className="text-[8px] font-bold text-cyan-400/40 uppercase">XP</span>
                    </div>
                    <cfg.icon className={`w-3 h-3 ml-auto opacity-40 ${cfg.color}`} />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="py-8 text-center border border-dashed border-white/10 rounded-xl">
            <p className="text-xs text-muted-foreground">O ranking será atualizado em breve.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
