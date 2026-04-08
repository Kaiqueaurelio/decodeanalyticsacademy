import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';

interface Props {
  onComplete?: () => void;
}

export function PomodoroTimer({ onComplete }: Props) {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const focusTime = 25 * 60;
  const breakTime = 5 * 60;

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === 'focus') {
        onComplete?.();
        setMode('break');
        setTimeLeft(breakTime);
        setIsRunning(false);
      } else {
        setMode('focus');
        setTimeLeft(focusTime);
        setIsRunning(false);
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft, mode]);

  const reset = () => { setIsRunning(false); setTimeLeft(mode === 'focus' ? focusTime : breakTime); };
  const toggle = () => setIsRunning(!isRunning);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const total = mode === 'focus' ? focusTime : breakTime;
  const pct = ((total - timeLeft) / total) * 100;

  return (
    <Card className="p-4 bg-card border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        {mode === 'focus' ? <Brain className="h-4 w-4 text-primary" /> : <Coffee className="h-4 w-4 text-success" />}
        <span className="text-xs font-semibold">{mode === 'focus' ? 'Foco' : 'Pausa'}</span>
      </div>
      <div className="relative w-20 h-20 mx-auto mb-3">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/20" />
          <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={mode === 'focus' ? 'text-primary' : 'text-success'}
            strokeDasharray={`${pct} 100`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-mono font-bold">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
      </div>
      <div className="flex justify-center gap-2">
        <Button size="icon" variant="outline" className="h-8 w-8" onClick={toggle}>
          {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
