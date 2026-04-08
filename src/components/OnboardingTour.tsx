import { useState } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="max-w-sm w-full p-6 bg-card border border-border/50 animate-scale-in relative">
        <button onClick={onComplete} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <div className="text-center mb-4">
          <div className="mx-auto mb-3">{STEPS[step].icon}</div>
          <h2 className="text-lg font-bold mb-1">{STEPS[step].title}</h2>
          <p className="text-sm text-muted-foreground">{STEPS[step].desc}</p>
        </div>
        <div className="flex gap-1 justify-center mb-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full smooth-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'}`} />
          ))}
        </div>
        <div className="flex gap-2 justify-center">
          {step > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setStep(s => s - 1)}>Anterior</Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={() => setStep(s => s + 1)} className="gradient-primary text-primary-foreground">Próximo</Button>
          ) : (
            <Button size="sm" onClick={onComplete} className="gradient-primary text-primary-foreground">Começar!</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
