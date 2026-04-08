import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, Trophy, RotateCcw } from 'lucide-react';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

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
    
    if (isCorrect) {
      toast.success('✅ Correto!');
    } else {
      toast.error('❌ Incorreto');
    }
  };

  const answeredCount = exercises.filter(ex => answers[ex.id]).length;
  const correctCount = exercises.filter(ex => answers[ex.id]?.correct).length;
  const allAnswered = exercises.length > 0 && answeredCount === exercises.length;
  const pct = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  const currentExercise = exercises[currentIndex];

  // Check if all exercises have been answered and show results
  useEffect(() => {
    if (allAnswered && !showResults) {
      setShowResults(true);
    }
  }, [allAnswered]);

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <AppHeader />
      <main className="container py-6 sm:py-8 px-4 relative z-10 max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
        </Button>

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl sm:text-2xl font-bold">Exercícios de Fixação</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{title}</p>
          {exercises.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{answeredCount} de {exercises.length} respondidas</span>
                {answeredCount > 0 && <span className="font-medium text-primary">{pct}% acerto</span>}
              </div>
              <Progress value={(answeredCount / exercises.length) * 100} className="h-2" />
            </div>
          )}
        </div>

        {/* Results Summary */}
        {showResults && (
          <Card className="glass p-5 mb-6 animate-fade-up text-center">
            <Trophy className={`h-10 w-10 mx-auto mb-3 ${pct >= 70 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-destructive'}`} />
            <h2 className="text-xl font-bold mb-1">
              {pct >= 70 ? 'Excelente! 🎉' : pct >= 50 ? 'Bom trabalho! 👍' : 'Continue estudando! 📚'}
            </h2>
            <p className="text-3xl font-bold text-primary mb-2">{pct}%</p>
            <div className="flex justify-center gap-4 text-sm mb-4">
              <span className="flex items-center gap-1 text-success"><CheckCircle className="h-4 w-4" /> {correctCount} acertos</span>
              <span className="flex items-center gap-1 text-destructive"><XCircle className="h-4 w-4" /> {answeredCount - correctCount} erros</span>
            </div>
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={() => { setShowResults(false); setCurrentIndex(0); }}>
                <RotateCcw className="mr-1.5 h-4 w-4" /> Revisar
              </Button>
              <Button size="sm" onClick={() => navigate('/dashboard')} className="gradient-primary text-primary-foreground">
                Voltar ao Dashboard
              </Button>
            </div>
          </Card>
        )}

        {exercises.length === 0 ? (
          <Card className="glass p-12 text-center text-muted-foreground">
            <p>Nenhum exercício disponível para esta apostila.</p>
          </Card>
        ) : !showResults && (
          <>
            {/* Navigation pills */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 hide-scrollbar">
              {exercises.map((ex, i) => {
                const answered = answers[ex.id];
                return (
                  <button
                    key={ex.id}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-8 w-8 rounded-full text-xs font-medium shrink-0 transition-all ${
                      i === currentIndex
                        ? 'bg-primary text-primary-foreground'
                        : answered
                          ? answered.correct
                            ? 'bg-success/20 text-success'
                            : 'bg-destructive/20 text-destructive'
                          : 'bg-accent text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {/* Current Exercise */}
            {currentExercise && (() => {
              const answered = answers[currentExercise.id];
              const options = Array.isArray(currentExercise.options) ? currentExercise.options as string[] : [];
              return (
                <Card className="glass p-5 sm:p-6 animate-fade-up">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-[10px]">Questão {currentIndex + 1} de {exercises.length}</Badge>
                  </div>
                  <p className="font-semibold mb-4 text-sm sm:text-base leading-relaxed">{currentExercise.question}</p>
                  <div className="space-y-2.5">
                    {options.map((opt, oi) => {
                      const letter = String.fromCharCode(65 + oi);
                      const isSelected = answered?.selected === letter;
                      const isCorrectAnswer = letter === currentExercise.correct_answer;
                      let classes = 'border-border hover:border-primary hover:bg-accent';
                      if (answered) {
                        if (isCorrectAnswer) classes = 'border-success bg-success/10';
                        else if (isSelected && !answered.correct) classes = 'border-destructive bg-destructive/10';
                        else classes = 'border-border opacity-60';
                      }
                      return (
                        <button
                          key={letter}
                          disabled={!!answered}
                          onClick={() => handleAnswer(currentExercise.id, letter, currentExercise.correct_answer)}
                          className={`w-full text-left p-3 sm:p-3.5 rounded-xl border-2 transition-all text-sm flex items-center gap-3 ${classes} ${!answered ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
                        >
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            answered && isCorrectAnswer ? 'bg-success text-white' : answered && isSelected && !answered.correct ? 'bg-destructive text-white' : 'bg-accent'
                          }`}>
                            {answered && isCorrectAnswer ? <CheckCircle className="h-4 w-4" /> : answered && isSelected && !answered.correct ? <XCircle className="h-4 w-4" /> : letter}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                  {answered && currentExercise.explanation && (
                    <div className="mt-4 p-3 rounded-xl bg-accent/50 text-sm">
                      <p className="font-medium text-xs text-primary mb-1">💡 Explicação:</p>
                      <p className="text-muted-foreground">{currentExercise.explanation}</p>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between mt-5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex(prev => prev - 1)}
                    >
                      ← Anterior
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentIndex === exercises.length - 1}
                      onClick={() => setCurrentIndex(prev => prev + 1)}
                    >
                      Próxima →
                    </Button>
                  </div>
                </Card>
              );
            })()}
          </>
        )}
      </main>
    </div>
  );
}
