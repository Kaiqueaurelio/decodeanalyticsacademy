import { Button } from '@/components/ui/button';
import { Lightbulb, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeroProps {
  name: string;
  overallProgress: number;
  totalApostilas: number;
  totalAnswered: number;
}

export function HeroGreetingCard({ name, overallProgress, totalApostilas, totalAnswered }: HeroProps) {
  const navigate = useNavigate();
  const firstName = (name || 'Aluno').split(' ')[0];

  const radius = 60;
  const circ = 2 * Math.PI * radius;
  const dash = (overallProgress / 100) * circ;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card/80 to-primary/5 p-6 sm:p-8">
      {/* glow */}
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/15 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 w-64 h-64 bg-accent/15 blur-3xl rounded-full pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.4fr_auto_1fr] gap-6 items-center">
        {/* Greeting */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Olá, {firstName}! <span className="inline-block animate-wave">👋</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-md">
            Continue seus estudos e alcance seus objetivos!
          </p>
          <Button
            className="mt-5 h-11 px-5 font-bold gap-2 shadow-[0_8px_30px_hsl(var(--primary)/0.35)]"
            onClick={() => {
              const el = document.getElementById('minhas-disciplinas');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              else navigate('/dashboard#minhas-disciplinas');
            }}
          >
            Ver minhas disciplinas
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Illustration */}
        <div className="hidden lg:flex items-center justify-center relative">
          <div className="relative">
            <div className="absolute inset-0 bg-warning/20 blur-2xl rounded-full" />
            <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-warning/30 to-warning/10 border border-warning/30 flex items-center justify-center">
              <Lightbulb className="h-14 w-14 text-warning drop-shadow-[0_0_12px_hsl(var(--warning)/0.6)]" strokeWidth={1.5} />
              <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-warning animate-pulse" />
            </div>
          </div>
        </div>

        {/* Progress circle */}
        <div className="flex items-center gap-5 rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
          <div className="relative w-[140px] h-[140px] shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="url(#hg)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
              <defs>
                <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold">{overallProgress}%</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">geral</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold mb-0.5">Seu progresso</p>
            <p className="text-[11px] text-muted-foreground leading-snug">
              {totalAnswered > 0
                ? `Você já resolveu ${totalAnswered} exercícios em ${totalApostilas} apostilas.`
                : `Comece resolvendo exercícios para acompanhar sua evolução.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
