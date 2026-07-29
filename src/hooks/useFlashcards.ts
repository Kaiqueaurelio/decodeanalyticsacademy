import { useState, useEffect } from 'react';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
const supabase = supabaseTyped as any;
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type Flashcard = {
  id: string;
  question: string;
  answer: string;
  next_review: string;
};

type FlashcardRow = {
  id: string;
  front: string | null;
  back: string | null;
  next_review: string | null;
};

const mapRow = (row: FlashcardRow): Flashcard => ({
  id: row.id,
  question: row.front ?? '',
  answer: row.back ?? '',
  next_review: row.next_review ?? new Date().toISOString(),
});

export const useFlashcards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDueCards = async () => {
    if (!user) {
      setCards([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('id, front, back, next_review')
        .eq('user_id', user.id)
        .lte('next_review', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCards((data || []).map((row: FlashcardRow) => mapRow(row)));
    } catch (error) {
      console.error('Erro ao buscar flashcards:', error);
      toast.error('Não foi possível carregar seus flashcards.');
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const rateCard = async (cardId: string, difficulty: 'easy' | 'medium' | 'hard') => {
    // Lógica simplificada de repetição espaçada (SM-2 adaptado)
    let daysToAdd = 1;
    if (difficulty === 'medium') daysToAdd = 3;
    if (difficulty === 'easy') daysToAdd = 7;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysToAdd);

    try {
      const { error } = await supabase
        .from('flashcards')
        .update({
          next_review: nextReview.toISOString(),
          last_reviewed: new Date().toISOString(),
          interval_days: daysToAdd,
          difficulty,
        })
        .eq('id', cardId);

      if (error) throw error;
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      toast.success('Card revisado!');
    } catch (error) {
      console.error('Erro ao atualizar card:', error);
      toast.error('Erro ao atualizar card');
    }
  };


  useEffect(() => {
    fetchDueCards();
  }, [user]);

  return { cards, loading, rateCard, refresh: fetchDueCards };
};
