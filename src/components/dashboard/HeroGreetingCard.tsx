import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, Trophy, Target, Zap, PenLine, Settings, Users, Layout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface HeroGreetingCardProps {
  name: string;
  overallProgress: number;
  totalApostilas: number;
  totalAnswered: number;
}

export function HeroGreetingCard({ name, overallProgress, totalApostilas, totalAnswered }: HeroGreetingCardProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const firstName = name.split(' ')[0];
  const hour = new Date().getHours();
  
  const greeting = useMemo(() => {
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, [hour]);

  const motivation = useMemo(() => {
    if (overallProgress > 80) return "Você está quase lá! Continue com esse ritmo incrível.";
    if (overallProgress > 50) return "Ótimo progresso! Metade do caminho já foi percorrida.";
    if (totalAnswered > 0) return "Cada exercício resolvido aproxima você do seu objetivo.";
    return "Que tal começar o dia resolvendo alguns exercícios?";
  }, [overallProgress, totalAnswered]);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card p-6 sm:p-8 shadow-2xl shadow-primary/5">
      {/* Background patterns and glows */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-accent/10 blur-[80px]" />
      
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 border border-primary/20">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Ambiente de Alta Performance</span>
          </div>
          
          <div className="space-y-1">
            <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{firstName}!</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md leading-relaxed">
              {motivation}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-xl border border-border/40">
              <Zap className="h-4 w-4 text-warning fill-warning/20" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Meta Diária</span>
                <span className="text-xs font-bold text-foreground">85% Completa</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-xl border border-border/40">
              <Target className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Próxima Aula</span>
                <span className="text-xs font-bold text-foreground">Sistemas Distribuídos</span>
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-3 p-4 rounded-2xl bg-accent/5 border border-accent/20 backdrop-blur-sm self-start md:self-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-1 flex items-center gap-2">
              <Settings className="h-3 w-3" />
              Painel de Gestão Rápida
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => navigate('/admin', { state: { tab: 'apostilas' } })}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-background/50 hover:bg-accent hover:text-white border border-border/50 transition-all group/btn shadow-sm"
              >
                <Layout className="h-3.5 w-3.5 group-hover/btn:scale-110" />
                <span className="text-xs font-bold">Conteúdo</span>
              </button>
              <button 
                onClick={() => navigate('/admin', { state: { tab: 'users' } })}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-background/50 hover:bg-accent hover:text-white border border-border/50 transition-all group/btn shadow-sm"
              >
                <Users className="h-3.5 w-3.5 group-hover/btn:scale-110" />
                <span className="text-xs font-bold">Alunos</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-row md:flex-col gap-4">
          <Card className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30 min-w-[120px]">
            <Trophy className="h-6 w-6 text-primary mb-2" />
            <span className="text-2xl font-black text-foreground">{overallProgress}%</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Concluído</span>
          </Card>
          <Card className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30 min-w-[120px]">
            <PenLine className="h-6 w-6 text-accent mb-2" />
            <span className="text-2xl font-black text-foreground">{totalAnswered}</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Exercícios</span>
          </Card>
        </div>
      </div>
    </div>
  );
}
