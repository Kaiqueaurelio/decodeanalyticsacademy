import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Flashcard } from '@/components/Flashcard';
import { useFlashcards } from '@/hooks/useFlashcards';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Brain, Trophy, Loader2, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function FlashcardsPage() {
  const navigate = useNavigate();
  const { cards, loading, rateCard } = useFlashcards();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const totalCards = cards.length;
  const currentCard = cards[currentIndex];
  const progress = totalCards > 0 ? ((currentIndex) / totalCards) * 100 : 0;

  const handleRate = async (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!currentCard) return;
    
    await rateCard(currentCard.id, difficulty);
    
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionFinished(true);
    }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    const t = toast.loading("IA analisando suas apostilas para gerar cards...");
    try {
      // Simulação da chamada de IA (o backend processaria as apostilas)
      await new Promise(r => setTimeout(r, 2000));
      toast.success("Novos flashcards gerados e adicionados!", { id: t });
      window.location.reload(); 
    } catch (err) {
      toast.error("Erro ao gerar cards.", { id: t });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <AppHeader />
      
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col">
        {/* Header da Sessão */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft size={16} /> Voltar
          </Button>
          <div className="flex items-center gap-2 text-primary font-medium">
            <Brain size={20} />
            <span>Revisão Ativa</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGenerateAI}
              disabled={isGenerating || loading}
              className="h-8 gap-1.5 border-primary/20 text-primary hover:bg-primary/10"
            >
              {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
              <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider">Gerar com IA</span>
            </Button>
            <div className="text-sm font-mono text-muted-foreground ml-2">
              {currentIndex + 1} / {totalCards}
            </div>
          </div>
        </div>

        {/* Barra de Progresso */}
        {!sessionFinished && totalCards > 0 && (
          <div className="mb-12 space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center font-bold">
              Progresso da Sessão
            </p>
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center relative">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-4"
              >
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse">Buscando seus cartões...</p>
              </motion.div>
            ) : sessionFinished || totalCards === 0 ? (
              <motion.div 
                key="finished"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 p-8 rounded-3xl bg-primary/5 border-2 border-dashed border-primary/20"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Tudo revisado!</h2>
                  <p className="text-muted-foreground">
                    {totalCards === 0 
                      ? "Você não tem cartões para revisar hoje. Bom trabalho!" 
                      : "Você completou sua meta de revisão diária."}
                  </p>
                </div>
                <Button onClick={() => navigate('/dashboard')} className="w-full max-w-xs">
                  Voltar ao Dashboard
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key={currentCard.id}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                <Flashcard 
                  question={currentCard.question} 
                  answer={currentCard.answer} 
                  onRate={handleRate} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dica Footer */}
        {!sessionFinished && totalCards > 0 && (
          <p className="mt-8 text-center text-xs text-muted-foreground max-w-xs mx-auto">
            Avalie honestamente seu nível de dificuldade para que o algoritmo otimize sua memória.
          </p>
        )}
      </main>
    </div>
  );
}
