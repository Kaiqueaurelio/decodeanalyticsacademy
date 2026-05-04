import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type Flashcard = {
  id: string;
  question: string;
  answer: string;
  next_review_at: string;
};

export const useFlashcards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDueCards = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .lte('next_review_at', new Date().toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar flashcards:', error);
    } else {
      setCards(data || []);
    }
    setLoading(false);
  };

  const rateCard = async (cardId: string, difficulty: 'easy' | 'medium' | 'hard') => {
    // Lógica simplificada de repetição espaçada (SM-2 adaptado)
    let daysToAdd = 1;
    if (difficulty === 'medium') daysToAdd = 3;
    if (difficulty === 'easy') daysToAdd = 7;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysToAdd);

    const { error } = await supabase
      .from('flashcards')
      .update({ 
        next_review_at: nextReview.toISOString(),
        last_reviewed_at: new Date().toISOString(),
        difficulty
      })
      .eq('id', cardId);

    if (error) {
      toast.error('Erro ao atualizar card');
    } else {
      setCards(prev => prev.filter(c => c.id !== cardId));
      toast.success('Card revisado!');
    }
  };

  useEffect(() => {
    fetchDueCards();
  }, [user]);

  return { cards, loading, rateCard, refresh: fetchDueCards };
};
