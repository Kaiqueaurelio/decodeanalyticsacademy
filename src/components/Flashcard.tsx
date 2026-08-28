import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, RotateCcw, Brain } from 'lucide-react';

interface FlashcardProps {
  question: string;
  answer: string;
  onRate: (difficulty: 'easy' | 'medium' | 'hard') => void;
}

export const Flashcard = ({ question, answer, onRate }: FlashcardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleCard = () => setIsFlipped((current) => !current);

  return (
    <div className="mx-auto h-[330px] w-full max-w-md perspective-1000 sm:h-[360px]">
      <motion.div
        className="relative h-full w-full cursor-pointer rounded-2xl transition-all duration-500 preserve-3d focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        onClick={toggleCard}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleCard();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? 'Mostrar a pergunta do flashcard' : 'Mostrar a resposta do flashcard'}
        aria-pressed={isFlipped}
      >
        {/* Frente do Cartão */}
        <Card className="absolute inset-0 flex h-full w-full backface-hidden flex-col items-center justify-center border-2 border-primary/10 bg-card p-5 text-center shadow-xl sm:p-8">
          <div className="absolute top-4 left-4 text-primary/40">
            <Brain size={24} />
          </div>
          <span className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Pergunta</span>
          <h3 className="max-h-[190px] overflow-y-auto break-words whitespace-pre-wrap text-lg font-semibold leading-relaxed text-foreground sm:text-xl">{question}</h3>
          <p className="mt-6 text-xs italic text-muted-foreground sm:mt-8">Toque para ver a resposta</p>
        </Card>

        {/* Verso do Cartão */}
        <Card className="absolute inset-0 flex h-full w-full backface-hidden flex-col items-center justify-center border-2 border-primary bg-primary/5 p-5 text-center shadow-xl rotate-y-180 sm:p-8">
          <span className="text-sm font-medium text-primary mb-4 uppercase tracking-wider">Resposta</span>
          <div className="flex-1 flex items-center">
            <p className="max-h-[185px] overflow-y-auto break-words whitespace-pre-wrap text-base font-medium leading-relaxed text-foreground sm:text-lg">{answer}</p>
          </div>
          
          <div className="mt-5 grid w-full grid-cols-3 gap-1.5 sm:mt-6 sm:gap-2">
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              className="min-w-0 gap-1 border-destructive/35 bg-destructive/5 px-2 text-destructive hover:bg-destructive/10"
              onClick={(e) => { e.stopPropagation(); onRate('hard'); }}
            >
              <X className="h-4 w-4 shrink-0" /> <span className="truncate">Difícil</span>
            </Button>
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              className="min-w-0 gap-1 border-amber-500/35 bg-amber-500/5 px-2 text-amber-500 hover:bg-amber-500/10"
              onClick={(e) => { e.stopPropagation(); onRate('medium'); }}
            >
              <RotateCcw className="h-4 w-4 shrink-0" /> <span className="truncate">Médio</span>
            </Button>
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              className="min-w-0 gap-1 border-emerald-500/35 bg-emerald-500/5 px-2 text-emerald-500 hover:bg-emerald-500/10"
              onClick={(e) => { e.stopPropagation(); onRate('easy'); }}
            >
              <Check className="h-4 w-4 shrink-0" /> <span className="truncate">Fácil</span>
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
