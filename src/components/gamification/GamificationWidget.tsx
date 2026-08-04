import { Trophy, Zap, Flame, Star, Target, Crown, Award, BookOpen, GraduationCap, PenTool } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useGamification } from '@/hooks/useGamification';
import { Reveal } from '@/components/Reveal';

export function GamificationWidget() {
  const { xp, streak, earnedBadgeIds, badges, xpForNextLevel } = useGamification();
  const nextLevelXP = xpForNextLevel(xp.level);
  const progressXP = Math.round((xp.xp_points % 100)); // Simples progresso para o próximo nível

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* XP e Nível */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 group transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Star className="h-12 w-12 text-primary" strokeWidth={1} />
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nível Atual</h4>
            <p className="text-xl font-black text-foreground">Level {xp.level}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
            <span>{xp.xp_points % 100} / 100 XP</span>
            <span>Prox. Nível</span>
          </div>
          <Progress value={progressXP} className="h-2 bg-primary/10" />
        </div>
      </div>

      {/* Streak */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 group transition-all hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Flame className="h-12 w-12 text-warning" strokeWidth={1} />
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/20 text-warning shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estudo Diário</h4>
            <p className="text-xl font-black text-foreground">{streak.current_streak} Dias</p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground font-medium">
          {streak.current_streak > 0 
            ? "Mantenha o ritmo! Sua maior sequência foi de " + streak.longest_streak + " dias."
            : "Comece sua sequência hoje lendo uma apostila!"}
        </p>
      </div>

      {/* Conquistas Rápidas */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 group transition-all hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Trophy className="h-12 w-12 text-cyan-400" strokeWidth={1} />
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/20 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Conquistas</h4>
              <p className="text-xl font-black text-foreground">{earnedBadgeIds.length} / {badges.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {badges.slice(0, 4).map(badge => (
            <div 
              key={badge.id} 
              className={`h-6 w-6 rounded-md flex items-center justify-center text-xs transition-all duration-300 ${earnedBadgeIds.includes(badge.id) ? 'bg-primary/20 text-primary' : 'bg-muted/40 text-muted-foreground grayscale opacity-40'}`}
              title={badge.name}
            >
              {badge.icon}
            </div>
          ))}
          {badges.length > 4 && (
            <div className="h-6 w-6 rounded-md bg-muted/40 text-muted-foreground flex items-center justify-center text-[8px] font-bold">
              +{badges.length - 4}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
