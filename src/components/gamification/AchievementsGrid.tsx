import React from 'react';
import { Award, Lock, Zap, Shield, Star, Crown, BookOpen, Target, Flame, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGamification } from '@/hooks/useGamification';

const ICON_MAP: Record<string, any> = {
  Zap, Shield, Award, Star, Crown, BookOpen, Target, Flame, Trophy
};

const COLOR_MAP: Record<string, string> = {
  yellow: 'text-yellow-400',
  cyan: 'text-cyan-400',
  purple: 'text-purple-400',
  blue: 'text-blue-400',
  orange: 'text-orange-400',
  green: 'text-green-400',
  red: 'text-red-400'
};

export function AchievementsGrid() {
  const { milestones, earnedBadgeIds } = useGamification();

  // Combine static rewards with dynamic milestones if needed, 
  // but for now we'll prioritize displaying milestones from DB.
  const displayRewards = milestones.map(m => ({
    id: m.id,
    title: m.title,
    level: `Meta: ${m.requirement_value}`,
    icon: ICON_MAP[m.icon || 'Award'] || Award,
    color: COLOR_MAP[m.reward_type?.split(':')[1] || 'purple'] || 'text-purple-400',
    unlocked: !!m.achieved_at,
    reward: m.reward_type?.split(':')[0] || 'XP Reward'
  }));

  // Fallback se não houver milestones no banco
  const rewards = displayRewards.length > 0 ? displayRewards : [
    { id: '1', title: 'Iniciante Tech', level: 'Nível 2', icon: Zap, color: 'text-yellow-400', unlocked: true, reward: 'Badge Neon Bronze' },
    { id: '2', title: 'Explorador de Dados', level: 'Nível 5', icon: Shield, color: 'text-cyan-400', unlocked: true, reward: 'Avatar Ella Cyberpunk' },
    { id: '3', title: 'Mestre da Lógica', level: 'Nível 10', icon: Award, color: 'text-purple-400', unlocked: false, reward: 'Tema Industrial Pro' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Conquistas e Recompensas</h3>
            <p className="text-[10px] text-muted-foreground font-mono">REWARDS_SYSTEM :: MILESTONES</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {rewards.map((reward, index) => (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative group flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
              reward.unlocked 
                ? 'bg-card border-primary/20 hover:border-primary/40' 
                : 'bg-muted/10 border-border opacity-50 grayscale'
            }`}
          >
            <div className={`p-3 rounded-full bg-background border ${reward.unlocked ? 'border-primary/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]' : 'border-muted'}`}>
              <reward.icon className={`h-6 w-6 ${reward.unlocked ? reward.color : 'text-muted-foreground'}`} />
            </div>
            
            <h4 className="mt-3 text-[10px] font-black uppercase tracking-tighter text-center line-clamp-1">
              {reward.title}
            </h4>
            
            <p className="text-[9px] font-mono text-muted-foreground mt-1">
              {reward.level}
            </p>

            {!reward.unlocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px] rounded-xl">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
            )}

            {reward.unlocked && (
              <div className="mt-2 text-[8px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                {reward.reward}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
