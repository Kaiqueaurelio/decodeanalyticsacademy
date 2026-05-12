import React, { useState } from 'react';
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

  return (
    <div className="w-full max-w-md mx-auto h-[350px] perspective-1000">
      <motion.div
        className="relative w-full h-full transition-all duration-500 preserve-3d cursor-pointer"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Frente do Cartão */}
        <Card className="absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-8 text-center bg-card shadow-xl border-2 border-primary/10">
          <div className="absolute top-4 left-4 text-primary/40">
            <Brain size={24} />
          </div>
          <span className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Pergunta</span>
          <h3 className="text-xl font-semibold text-foreground leading-relaxed">{question}</h3>
          <p className="mt-8 text-xs text-muted-foreground animate-pulse italic">Clique para ver a resposta</p>
        </Card>

        {/* Verso do Cartão */}
        <Card className="absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-8 text-center bg-primary/5 shadow-xl border-2 border-primary rotate-y-180">
          <span className="text-sm font-medium text-primary mb-4 uppercase tracking-wider">Resposta</span>
          <div className="flex-1 flex items-center">
            <p className="text-lg text-foreground font-medium leading-relaxed">{answer}</p>
          </div>
          
          <div className="mt-6 flex gap-2 w-full">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
              onClick={(e) => { e.stopPropagation(); onRate('hard'); }}
            >
              <X className="mr-1 h-4 w-4" /> Difícil
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700"
              onClick={(e) => { e.stopPropagation(); onRate('medium'); }}
            >
              <RotateCcw className="mr-1 h-4 w-4" /> Médio
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
              onClick={(e) => { e.stopPropagation(); onRate('easy'); }}
            >
              <Check className="mr-1 h-4 w-4" /> Fácil
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
