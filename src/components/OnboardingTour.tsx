import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, PenLine, FileText, Search, Trophy, X } from 'lucide-react';

const STEPS = [
  {
    icon: <BookOpen className="h-7 w-7 text-primary" />,
    title: 'Bem-vindo à Decode!',
    desc: 'Acesse apostilas, exercícios e materiais organizados para seus estudos.',
  },
  {
    icon: <PenLine className="h-7 w-7 text-primary" />,
    title: 'Exercícios Interativos',
    desc: 'Teste seus conhecimentos por apostila e acompanhe sua evolução.',
  },
  {
    icon: <FileText className="h-7 w-7 text-primary" />,
    title: 'Materiais de Apoio',
    desc: 'Encontre PDFs, vídeos, áudios e apresentações por categoria.',
  },
  {
    icon: <Trophy className="h-7 w-7 text-primary" />,
    title: 'Gamificação',
    desc: 'Ganhe XP, mantenha sua sequência de estudos e desbloqueie conquistas.',
  },
  {
    icon: <Search className="h-7 w-7 text-primary" />,
    title: 'Ferramentas de Estudo',
    desc: 'Use flashcards, timer Pomodoro e anotações sem sair do fluxo.',
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
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[120] flex justify-end sm:inset-x-auto sm:right-4 sm:bottom-4">
      <Card className="pointer-events-auto relative w-full max-w-[360px] border border-primary/35 bg-card/95 p-4 shadow-2xl shadow-black/35 backdrop-blur animate-scale-in">
        <button
          onClick={onComplete}
          className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Fechar boas-vindas"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-3 flex gap-3 pr-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">{STEPS[step].icon}</div>
          <div className="min-w-0">
            <h2 className="mb-1 text-sm font-bold leading-tight">{STEPS[step].title}</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">{STEPS[step].desc}</p>
          </div>
        </div>

        <div className="mb-3 flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={i === step ? 'h-1.5 w-6 rounded-full bg-primary smooth-all' : 'h-1.5 w-1.5 rounded-full bg-muted smooth-all'}
            />
          ))}
        </div>

        <div className="flex justify-end gap-2">
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
              Começar
            </Button>
          )}
        </div>
      </Card>
    </div>,
    document.body,
  );
}
