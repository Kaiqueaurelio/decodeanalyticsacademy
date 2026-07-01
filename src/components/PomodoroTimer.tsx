import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';

interface Props {
  onComplete?: () => void;
}

export function PomodoroTimer({ onComplete }: Props) {
  const getFocusMinutes = () => Number(localStorage.getItem('pomodoroFocusMinutes') || '25');
  const getBreakMinutes = () => Number(localStorage.getItem('pomodoroBreakMinutes') || '5');

  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState(getFocusMinutes() * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const focusTime = getFocusMinutes() * 60;
  const breakTime = getBreakMinutes() * 60;

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

  // Permite outro componente disparar o Pomodoro (ex: Modo Estudar agora).
  // Evento: window.dispatchEvent(new CustomEvent('decode-pomodoro-start', { detail: { duration?: number } }))
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const minutes = Number(detail.duration) > 0 ? Number(detail.duration) : getFocusMinutes();
      setMode('focus');
      setTimeLeft(minutes * 60);
      setIsRunning(true);
    };
    window.addEventListener('decode-pomodoro-start', handler);
    return () => window.removeEventListener('decode-pomodoro-start', handler);
  }, []);

  const reset = () => { setIsRunning(false); setTimeLeft(mode === 'focus' ? focusTime : breakTime); };
  const toggle = () => setIsRunning(!isRunning);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const total = mode === 'focus' ? focusTime : breakTime;
  const pct = ((total - timeLeft) / total) * 100;

  return (
    <Card className="p-5 hover-lift">
      <div className="flex items-center gap-2 mb-4">
        {mode === 'focus' ? <Brain className="h-4 w-4 text-primary" /> : <Coffee className="h-4 w-4 text-success" />}
        <span className="text-sm font-semibold">{mode === 'focus' ? 'Tempo de Foco' : 'Pausa'}</span>
      </div>
      <div className="relative w-24 h-24 mx-auto mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30" />
          <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`${mode === 'focus' ? 'text-primary' : 'text-success'} transition-all duration-500`}
            strokeDasharray={`${pct} 100`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-mono font-bold tabular-nums">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
      </div>
      <div className="flex justify-center gap-2">
        <Button size="icon" variant={isRunning ? 'default' : 'outline'} className="h-9 w-9 rounded-xl" onClick={toggle} aria-label="Pausar">
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={reset} aria-label="Reiniciar">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
