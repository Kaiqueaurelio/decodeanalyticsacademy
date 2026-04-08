import { Card } from '@/components/ui/card';
import { Flame, Zap, Trophy, Star } from 'lucide-react';

interface Props {
  xpPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  xpForNext: number;
  earnedBadges: { icon: string; name: string }[];
}

export function GamificationWidget({ xpPoints, level, currentStreak, longestStreak, xpForNext, earnedBadges }: Props) {
  const xpProgress = xpForNext > 0 ? Math.min(100, (xpPoints % 100) / (xpForNext / level) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* XP & Level */}
      <Card className="p-4 bg-card border border-border/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-full bg-primary/10 p-2">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Nível {level}</span>
              <span className="text-[10px] text-muted-foreground">{xpPoints} XP</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-primary rounded-full smooth-all" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
        </div>
      </Card>

      {/* Streak */}
      <Card className="p-4 bg-card border border-border/50">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-orange-500/10 p-2">
            <Flame className={`h-4 w-4 ${currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-sm font-bold">{currentStreak} {currentStreak === 1 ? 'dia' : 'dias'}</p>
            <p className="text-[10px] text-muted-foreground">Streak atual • Recorde: {longestStreak}</p>
          </div>
        </div>
      </Card>

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <Card className="p-4 bg-card border border-border/50">
          <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-yellow-500" /> Conquistas
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {earnedBadges.map((b, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent text-[10px] font-medium">
                {b.icon} {b.name}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
