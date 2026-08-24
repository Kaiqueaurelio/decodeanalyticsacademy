import React from 'react';
import { Target, Trophy, Award, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { StudyGoalsConfig } from './StudyGoalsConfig';


interface StudyGoal {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  type: 'chapter' | 'exercise' | 'streak' | 'custom';
  completed: boolean;
}

interface StudyGoalsWidgetProps {
  goals: StudyGoal[];
}

export function StudyGoalsWidget({ goals }: StudyGoalsWidgetProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Metas de Estudo</h3>
            <p className="text-[10px] text-muted-foreground font-mono">OBJECTIVES_LOG :: ACTIVE</p>
          </div>
        </div>
        <StudyGoalsConfig />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {goals.map((goal) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative group overflow-hidden rounded-xl border p-4 transition-all ${
              goal.completed 
                ? 'bg-success/5 border-success/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                : 'bg-card border-border hover:border-primary/30'
            }`}
          >
            {/* Cyber background effects for Cyberpunk Pro style */}
            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
              {goal.type === 'chapter' ? <Trophy className="h-12 w-12" /> : <Award className="h-12 w-12" />}
            </div>

            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                goal.completed 
                  ? 'bg-success/20 border-success/40 text-success' 
                  : 'bg-muted/50 border-border text-muted-foreground group-hover:border-primary/30 group-hover:text-primary transition-colors'
              }`}>
                {goal.completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-xs font-bold uppercase tracking-tight truncate ${goal.completed ? 'text-success' : 'text-foreground'}`}>
                    {goal.title}
                  </h4>
                  <span className="text-[9px] font-mono font-bold opacity-60">
                    {goal.progress}/{goal.total}
                  </span>
                </div>
                
                <p className="mt-1 text-[10px] text-muted-foreground leading-tight line-clamp-1">
                  {goal.description}
                </p>

                <div className="mt-3 space-y-1">
                  <Progress 
                    value={(goal.progress / goal.total) * 100} 
                    className={`h-1.5 ${goal.completed ? 'bg-success/20' : 'bg-primary/10'}`}
                    indicatorClassName={goal.completed ? 'bg-success' : 'bg-primary shadow-[0_0_8px_#a855f7]'}
                  />
                </div>
              </div>
            </div>
            
            {/* Completion decoration */}
            {goal.completed && (
              <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12">
                <Trophy className="h-20 w-20 text-success" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
