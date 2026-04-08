import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Exercise = Tables<'exercises'>;

export default function ExercisesPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [answers, setAnswers] = useState<Record<string, { selected: string; correct: boolean } | null>>({});
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!id || !user) return;
    supabase.from('apostilas').select('title').eq('id', id).single().then(({ data }) => data && setTitle(data.title));
    supabase.from('exercises').select('*').eq('apostila_id', id).then(({ data }) => setExercises(data || []));
    supabase.from('answers').select('exercise_id, selected_answer, is_correct').eq('user_id', user.id).then(({ data }) => {
      const map: Record<string, { selected: string; correct: boolean }> = {};
      data?.forEach(a => { map[a.exercise_id] = { selected: a.selected_answer, correct: a.is_correct }; });
      setAnswers(map);
    });
  }, [id, user]);

  const handleAnswer = async (exerciseId: string, selected: string, correctAnswer: string) => {
    if (!user || answers[exerciseId]) return;
    const isCorrect = selected === correctAnswer;
    const { error } = await supabase.from('answers').insert({
      user_id: user.id,
      exercise_id: exerciseId,
      selected_answer: selected,
      is_correct: isCorrect,
    });
    if (error) { toast.error('Erro ao salvar resposta'); return; }
    setAnswers(prev => ({ ...prev, [exerciseId]: { selected, correct: isCorrect } }));
    toast[isCorrect ? 'success' : 'error'](isCorrect ? 'Resposta correta!' : 'Resposta incorreta');
  };

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <AppHeader />
      <main className="container py-8 relative z-10 max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold mb-2">Exercícios</h1>
        <p className="text-muted-foreground mb-6 text-sm">{title}</p>

        {exercises.length === 0 ? (
          <Card className="glass p-12 text-center text-muted-foreground">
            <p>Nenhum exercício disponível para esta apostila.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {exercises.map((ex, i) => {
              const answered = answers[ex.id];
              const options = Array.isArray(ex.options) ? ex.options as string[] : [];
              return (
                <Card key={ex.id} className="glass p-6 animate-fade-up">
                  <p className="font-semibold mb-4">{i + 1}. {ex.question}</p>
                  <div className="space-y-2">
                    {options.map((opt, oi) => {
                      const letter = String.fromCharCode(65 + oi);
                      const isSelected = answered?.selected === letter;
                      const isCorrectAnswer = letter === ex.correct_answer;
                      let borderClass = 'border-border';
                      if (answered) {
                        if (isCorrectAnswer) borderClass = 'border-success bg-success/10';
                        else if (isSelected && !answered.correct) borderClass = 'border-destructive bg-destructive/10';
                      }
                      return (
                        <button
                          key={letter}
                          disabled={!!answered}
                          onClick={() => handleAnswer(ex.id, letter, ex.correct_answer)}
                          className={`w-full text-left p-3 rounded-lg border transition-all text-sm ${borderClass} ${!answered ? 'hover:border-primary hover:bg-accent cursor-pointer' : 'cursor-default'}`}
                        >
                          <span className="font-semibold mr-2">{letter})</span> {opt}
                          {answered && isCorrectAnswer && <CheckCircle className="inline ml-2 h-4 w-4 text-success" />}
                          {answered && isSelected && !answered.correct && <XCircle className="inline ml-2 h-4 w-4 text-destructive" />}
                        </button>
                      );
                    })}
                  </div>
                  {answered && ex.explanation && (
                    <div className="mt-4 p-3 rounded-lg bg-accent/50 text-sm">
                      <p className="font-medium text-xs text-muted-foreground mb-1">Explicação:</p>
                      <p>{ex.explanation}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
