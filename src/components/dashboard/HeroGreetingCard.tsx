import { Button } from '@/components/ui/button';
import { Trophy, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeroProps {
  name: string;
  overallProgress: number;
  totalApostilas: number;
  totalAnswered: number;
}

export function HeroGreetingCard({ name, overallProgress, totalApostilas, totalAnswered }: HeroProps) {
  const navigate = useNavigate();
  // Remove prefixos do tipo "[TESTE BOT]" e pega só o primeiro nome real.
  const cleanName = (name || '').replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
  const firstName = (cleanName || 'Aluno').split(' ')[0];

  const radius = 60;
  const circ = 2 * Math.PI * radius;
  const dash = (overallProgress / 100) * circ;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card/86 to-primary/5 p-5 sm:p-7">
      <div className="absolute -top-24 -right-16 w-72 h-72 bg-primary/12 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-28 left-1/3 w-64 h-64 bg-accent/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_auto_1fr] lg:items-center">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">Painel de estudos</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Olá, {firstName}
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Acompanhe suas atividades, apostilas e revisões em um só lugar.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Button
              className="h-10 px-5 font-bold gap-2 shadow-[0_8px_30px_hsl(var(--primary)/0.24)] group transition-all hover:scale-105"
              onClick={() => {
                const el = document.getElementById('minhas-disciplinas');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else navigate('/dashboard#minhas-disciplinas');
              }}
            >
              Ver disciplinas
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <Button
              variant="outline"
              className="h-10 px-5 font-bold gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all hover:scale-105"
              onClick={() => navigate('/simulado')}
            >
              Fazer Simulado
            </Button>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-center relative">
          <div className="relative">
            <div className="absolute inset-0 bg-warning/16 blur-2xl rounded-full" />
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-warning/24 to-warning/8 border border-warning/24 flex items-center justify-center animate-bounce-slow">
              <Trophy className="h-12 w-12 text-warning drop-shadow-[0_0_12px_hsl(var(--warning)/0.45)]" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 backdrop-blur p-4">
          <div className="relative w-[112px] h-[112px] shrink-0 sm:w-[128px] sm:h-[128px]">
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
              <span className="text-2xl sm:text-3xl font-extrabold">{overallProgress}%</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">geral</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold mb-0.5">Seu progresso</p>
            <p className="text-[11px] text-muted-foreground leading-snug">
              {totalAnswered > 0
                ? `${totalAnswered} exercícios respondidos em ${totalApostilas} apostilas.`
                : 'Comece por uma apostila para registrar sua evolução.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
