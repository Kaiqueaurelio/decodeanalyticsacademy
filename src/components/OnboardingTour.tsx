import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, PenLine, FileText, Search, Trophy, X } from 'lucide-react';

const STEPS = [
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'Bem-vindo à Decode!',
    desc: 'Aqui você encontra apostilas, exercícios e materiais para todo o curso de Ciência da Computação.',
  },
  {
    icon: <PenLine className="h-8 w-8 text-primary" />,
    title: 'Exercícios Interativos',
    desc: 'Teste seus conhecimentos com questões por apostila. Veja explicações detalhadas após responder.',
  },
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: 'Materiais de Apoio',
    desc: 'Acesse PDFs, vídeos, áudios e apresentações organizados por categoria e semestre.',
  },
  {
    icon: <Trophy className="h-8 w-8 text-primary" />,
    title: 'Gamificação',
    desc: 'Ganhe XP, mantenha seu streak de estudos, desbloqueie conquistas e suba no ranking!',
  },
  {
    icon: <Search className="h-8 w-8 text-primary" />,
    title: 'Ferramentas de Estudo',
    desc: 'Use flashcards, timer Pomodoro e anotações para maximizar seu aprendizado.',
  },
];

interface Props {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex min-h-dvh items-center justify-center bg-background/70 backdrop-blur-sm p-4">
      <Card className="relative w-full max-w-sm border border-border/50 bg-card p-6 shadow-lg animate-scale-in">
        <button
          onClick={onComplete}
          className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Fechar boas-vindas"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 text-center">
          <div className="mx-auto mb-3">{STEPS[step].icon}</div>
          <h2 className="mb-1 text-lg font-bold">{STEPS[step].title}</h2>
          <p className="text-sm text-muted-foreground">{STEPS[step].desc}</p>
        </div>

        <div className="mb-4 flex justify-center gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={i === step ? 'h-1.5 w-6 rounded-full bg-primary smooth-all' : 'h-1.5 w-1.5 rounded-full bg-muted smooth-all'}
            />
          ))}
        </div>

        <div className="flex justify-center gap-2">
          {step > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setStep((s) => s - 1)}>
              Anterior
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={() => setStep((s) => s + 1)} className="gradient-primary text-primary-foreground">
              Próximo
            </Button>
          ) : (
            <Button size="sm" onClick={onComplete} className="gradient-primary text-primary-foreground">
              Começar!
            </Button>
          )}
        </div>
      </Card>
    </div>,
    document.body,
  );
}
