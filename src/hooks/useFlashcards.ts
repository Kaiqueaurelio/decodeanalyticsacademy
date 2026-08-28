import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type Flashcard = {
  id: string;
  question: string;
  answer: string;
  next_review: string | null;
  apostila_id: string | null;
  created_at: string;
};

type FlashcardRow = {
  id: string;
  front: string;
  back: string;
  next_review: string | null;
  apostila_id: string | null;
  created_at: string;
};

const mapRow = (row: FlashcardRow): Flashcard => ({
  id: row.id,
  question: row.front,
  answer: row.back,
  next_review: row.next_review,
  apostila_id: row.apostila_id,
  created_at: row.created_at,
});

const isDue = (card: Flashcard) => (
  !card.next_review || new Date(card.next_review).getTime() <= Date.now()
);

export const useFlashcards = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(async () => {
    if (!userId) {
      setCards([]);
      setAllCards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const requestController = new AbortController();
    const requestTimeout = window.setTimeout(() => requestController.abort(), 12_000);
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('id, front, back, next_review, apostila_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .abortSignal(requestController.signal);

      if (error) throw error;
      const mapped = (data || []).map((row) => mapRow(row as FlashcardRow));
      setAllCards(mapped);
      setCards(mapped.filter(isDue));
    } catch (error) {
      const wasAborted = requestController.signal.aborted;
      if (!wasAborted) console.error('Erro ao buscar flashcards:', error);
      toast.error(wasAborted
        ? 'A busca de flashcards demorou demais. Tente novamente.'
        : 'Não foi possível carregar seus flashcards.');
      setCards([]);
      setAllCards([]);
    } finally {
      window.clearTimeout(requestTimeout);
      setLoading(false);
    }
  }, [userId]);

  const rateCard = async (cardId: string, difficulty: 'easy' | 'medium' | 'hard') => {
    if (!userId) return false;

    const daysToAdd = difficulty === 'easy' ? 7 : difficulty === 'medium' ? 3 : 1;
    const difficultyValue = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 1 : 0;
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysToAdd);
    const nextReviewIso = nextReview.toISOString();

    try {
      const { error } = await supabase
        .from('flashcards')
        .update({
          next_review: nextReviewIso,
          last_reviewed: new Date().toISOString(),
          interval_days: daysToAdd,
          difficulty: difficultyValue,
        })
        .eq('id', cardId)
        .eq('user_id', userId);

      if (error) throw error;
      setCards((previous) => previous.filter((card) => card.id !== cardId));
      setAllCards((previous) => previous.map((card) => (
        card.id === cardId ? { ...card, next_review: nextReviewIso } : card
      )));
      toast.success('Card revisado!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar card:', error);
      toast.error('Erro ao atualizar card');
      return false;
    }
  };

  const updateCard = async (cardId: string, question: string, answer: string) => {
    if (!userId) return false;
    const nextQuestion = question.trim();
    const nextAnswer = answer.trim();
    if (!nextQuestion || !nextAnswer) {
      toast.error('Preencha a pergunta e a resposta.');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('flashcards')
        .update({ front: nextQuestion, back: nextAnswer })
        .eq('id', cardId)
        .eq('user_id', userId)
        .select('id')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Flashcard não encontrado para este usuário.');

      const applyUpdate = (items: Flashcard[]) => items.map((card) => (
        card.id === cardId ? { ...card, question: nextQuestion, answer: nextAnswer } : card
      ));
      setCards(applyUpdate);
      setAllCards(applyUpdate);
      toast.success('Flashcard atualizado.');
      return true;
    } catch (error) {
      console.error('Erro ao editar flashcard:', error);
      toast.error('Não foi possível salvar o flashcard.');
      return false;
    }
  };

  useEffect(() => {
    void fetchCards();
  }, [fetchCards]);

  return { cards, allCards, loading, rateCard, updateCard, refresh: fetchCards };
};
