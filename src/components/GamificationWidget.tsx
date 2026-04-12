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
    <div className="space-y-4">
      {/* XP & Level */}
      <Card className="p-5 hover-lift">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Nível {level}</span>
              <span className="text-xs text-muted-foreground font-medium">{xpPoints} XP</span>
            </div>
            <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full animate-progress-fill"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Streak */}
      <Card className="p-5 hover-lift">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2.5 ${currentStreak > 0 ? 'bg-orange-500/10' : 'bg-muted'}`}>
            <Flame className={`h-5 w-5 ${currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-lg font-bold">{currentStreak} {currentStreak === 1 ? 'dia' : 'dias'}</p>
            <p className="text-xs text-muted-foreground">Sequência de estudo • Recorde: {longestStreak}</p>
          </div>
        </div>
      </Card>

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <Card className="p-5 hover-lift">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" /> Conquistas
          </h3>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((b, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-xs font-medium animate-card-enter"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {b.icon} {b.name}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
