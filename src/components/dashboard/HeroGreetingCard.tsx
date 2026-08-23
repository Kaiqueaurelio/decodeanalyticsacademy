import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, Trophy, Target, Zap, PenLine, Settings, Users, Layout, ArrowRight, MessageCircle } from 'lucide-react';
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
  const firstName = name.trim().split(' ')[0] || 'estudante';
  const hour = new Date().getHours();
  
  const greeting = useMemo(() => {
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, [hour]);

  const motivation = useMemo(() => {
    if (overallProgress > 80) return "Fase final. Mantenha a consistência operacional.";
    if (overallProgress > 50) return "Ritmo estável. Execute o próximo bloco de estudos.";
    if (totalAnswered > 0) return "Dados processados. Continue a progressão.";
    return "Inicie a primeira carga de estudos do dia.";
  }, [overallProgress, totalAnswered]);

  const dailyFocus = overallProgress === 0
    ? 'Começar com 1 exercício'
    : overallProgress < 60
      ? 'Avançar mais 10%'
      : 'Consolidar o ritmo';
  const nextStep = totalAnswered === 0
    ? 'Resolver seu primeiro exercício'
    : overallProgress < 40
      ? 'Ler uma apostila'
      : 'Revisar seus erros';

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#050508] p-6 sm:p-8 cyber-grid">
      {/* Background patterns and glows */}
      <div className="absolute inset-0 bg-[#0A0A0F] pointer-events-none opacity-50" />
      <div className="absolute top-0 left-0 w-full h-px bg-primary/20" />
      
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 border border-primary/20">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Seu centro de estudos</span>
          </div>
          
          <div className="space-y-1">
            <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              {greeting}, <span className="text-primary tracking-tight">{firstName}!</span>
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
                <span className="text-xs font-bold text-foreground">{dailyFocus}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-xl border border-border/40">
              <Target className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Próxima Aula</span>
                <span className="text-xs font-bold text-foreground">{nextStep}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => document.getElementById('minhas-disciplinas')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <PenLine className="h-3.5 w-3.5" />
              Abrir trilha de estudo
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/ella')}
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/50 px-3.5 py-2.5 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <MessageCircle className="h-3.5 w-3.5 text-accent" />
              Falar com Ella
            </button>
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4 backdrop-blur-sm self-start md:self-center">
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
          <Card className="flex flex-col items-center justify-center p-4 bg-muted/20 border-primary/20 min-w-[120px] rounded-lg shadow-none">
            <Trophy className="h-6 w-6 text-primary mb-2" />
            <span className="text-2xl font-black text-foreground">{overallProgress}%</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Concluído</span>
          </Card>
          <Card className="flex flex-col items-center justify-center p-4 bg-muted/20 border-accent/20 min-w-[120px] rounded-lg shadow-none">
            <PenLine className="h-6 w-6 text-accent mb-2" />
            <span className="text-2xl font-black text-foreground">{totalAnswered}</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Exercícios</span>
          </Card>
        </div>
      </div>
    </div>
  );
}
