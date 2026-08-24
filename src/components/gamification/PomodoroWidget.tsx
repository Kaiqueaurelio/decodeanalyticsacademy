import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Play, Pause, RotateCcw, Coffee, Trophy, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useGamification } from '@/hooks/useGamification';
import { toast } from 'sonner';

interface PomodoroWidgetProps {
  collapsed?: boolean;
}

export function PomodoroWidget({ collapsed }: PomodoroWidgetProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const { addXP } = useGamification();

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = () => {
    if (mode === 'study') {
      addXP(25);
      toast.success('Sessão de estudo concluída! +25 XP', {
        icon: <Trophy className="h-4 w-4 text-yellow-500" />,
      });
      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      toast.info('Pausa finalizada. Hora de voltar aos estudos!');
      setMode('study');
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setMode('study');
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'study' 
    ? ((25 * 60 - timeLeft) / (25 * 60)) * 100 
    : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-4 border-t border-white/5 space-y-4">
        <div className="relative">
          <Timer className={cn("h-5 w-5", isActive ? "text-cyan-400 animate-pulse" : "text-gray-500")} />
          {isActive && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          )}
        </div>
        <button onClick={toggleTimer} className="text-[9px] font-bold text-cyan-500/60 font-mono uppercase">
          {isActive ? 'STOP' : 'GO'}
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 border-t border-white/5 bg-black/20">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="h-3.5 w-3.5 text-cyan-500/60" />
        <span className="text-[9px] font-bold text-cyan-500/40 uppercase tracking-[0.2em]">Foco Pomodoro</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className={cn("h-1 w-1 rounded-full", mode === 'study' ? "bg-cyan-500" : "bg-purple-500")} />
          <span className="text-[8px] font-mono text-white/40 uppercase">
            {mode === 'study' ? 'Study' : 'Break'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-black font-mono tracking-tighter text-white tabular-nums">
            {formatTime(timeLeft)}
          </span>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-md hover:bg-white/5 text-cyan-400"
              onClick={toggleTimer}
            >
              {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-md hover:bg-white/5 text-gray-500"
              onClick={resetTimer}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className={cn("absolute left-0 top-0 h-full", mode === 'study' ? "bg-cyan-500" : "bg-purple-500")}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
          />
        </div>
        
        <div className="flex items-center gap-2 text-[8px] text-cyan-500/40 font-mono uppercase italic">
          <ShieldAlert className="h-2.5 w-2.5" />
          <span>XP bônus ativo durante a sessão</span>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
