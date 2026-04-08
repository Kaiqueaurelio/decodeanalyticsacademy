import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, Trophy, RotateCcw, Timer } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Exercise = Tables<'exercises'>;

export default function ExercisesPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const gamification = useGamification();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [answers, setAnswers] = useState<Record<string, { selected: string; correct: boolean; correctAnswer?: string } | null>>({});
  const [title, setTitle] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  // Timed mode
  const [timedMode, setTimedMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    supabase.from('apostilas').select('title').eq('id', id).single().then(({ data }) => data && setTitle(data.title));
    supabase.from('exercises').select('id, question, options, explanation, apostila_id, created_at').eq('apostila_id', id).then(({ data }) => setExercises((data as any) || []));
    supabase.from('answers').select('exercise_id, selected_answer, is_correct').eq('user_id', user.id).then(({ data }) => {
      const map: Record<string, { selected: string; correct: boolean }> = {};
      data?.forEach(a => { map[a.exercise_id] = { selected: a.selected_answer, correct: a.is_correct }; });
      setAnswers(map);
    });
  }, [id, user]);

  // Timer
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setTimerActive(false); setShowResults(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timerActive, timeLeft]);

  const startTimedMode = () => {
    setTimedMode(true);
    setTimeLeft(exercises.length * 60); // 1 min per question
    setTimerActive(true);
    setCurrentIndex(0);
    setShowResults(false);
  };

  const handleAnswer = async (exerciseId: string, selected: string, _correctAnswer?: string) => {
    if (!user || answers[exerciseId]) return;

    // Use server-side answer validation
    const { data, error } = await supabase.rpc('check_exercise_answer', {
      _exercise_id: exerciseId, _selected_answer: selected
    });
    if (error) { toast.error('Erro ao salvar resposta'); return; }

    const result = data as { is_correct: boolean; correct_answer: string; explanation: string | null };
    const isCorrect = result.is_correct;
    setAnswers(prev => ({ ...prev, [exerciseId]: { selected, correct: isCorrect } }));

    // Gamification
    gamification.addXP(isCorrect ? 10 : 3);
    gamification.updateStreak();

    // Check badges
    const totalAnswers = Object.keys(answers).length + 1;
    if (totalAnswers === 1) gamification.checkAndAwardBadge('first_answer');
    if (totalAnswers >= 100) gamification.checkAndAwardBadge('answers_100');

    toast[isCorrect ? 'success' : 'error'](isCorrect ? 'Correto! +10 XP' : 'Incorreto +3 XP');

    // Auto-advance in timed mode
    if (timedMode && currentIndex < exercises.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 800);
    }
  };

  const answeredCount = exercises.filter(ex => answers[ex.id]).length;
  const correctCount = exercises.filter(ex => answers[ex.id]?.correct).length;
  const allAnswered = exercises.length > 0 && answeredCount === exercises.length;
  const pct = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const currentExercise = exercises[currentIndex];

  useEffect(() => {
    if (allAnswered && !showResults) {
      setShowResults(true);
      setTimerActive(false);
      // Check perfect score badge
      if (pct === 100) gamification.checkAndAwardBadge('perfect_apostila');
    }
  }, [allAnswered]);

  const timerMins = Math.floor(timeLeft / 60);
  const timerSecs = timeLeft % 60;

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <AppHeader />
      <main className="container py-6 px-4 relative z-10 max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
        </Button>

        <div className="mb-5 animate-content-show">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold sm:text-xl">Exercícios</h1>
              <p className="text-muted-foreground text-sm">{title}</p>
            </div>
            {!timedMode && exercises.length > 0 && !showResults && (
              <Button size="sm" variant="outline" onClick={startTimedMode} className="text-xs gap-1.5">
                <Timer className="h-3.5 w-3.5" /> Simulado
              </Button>
            )}
          </div>
          {timedMode && timerActive && (
            <div className="mt-2 flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono font-bold text-primary">
                {String(timerMins).padStart(2, '0')}:{String(timerSecs).padStart(2, '0')}
              </span>
            </div>
          )}
          {exercises.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{answeredCount}/{exercises.length} respondidas</span>
                {answeredCount > 0 && <span className="font-medium text-primary">{pct}%</span>}
              </div>
              <Progress value={(answeredCount / exercises.length) * 100} className="h-1.5" />
            </div>
          )}
        </div>

        {/* Results */}
        {showResults && (
          <Card className="p-6 mb-6 animate-card-enter text-center bg-card border border-border/50">
            <Trophy className={`h-8 w-8 mx-auto mb-2 ${pct >= 70 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-destructive'}`} />
            <h2 className="text-lg font-bold mb-1">
              {pct >= 70 ? 'Excelente!' : pct >= 50 ? 'Bom trabalho!' : 'Continue estudando'}
            </h2>
            <p className="text-2xl font-bold text-primary mb-2">{pct}%</p>
            <div className="flex justify-center gap-4 text-sm mb-4">
              <span className="flex items-center gap-1 text-success"><CheckCircle className="h-4 w-4" /> {correctCount}</span>
              <span className="flex items-center gap-1 text-destructive"><XCircle className="h-4 w-4" /> {answeredCount - correctCount}</span>
            </div>
            {timedMode && (
              <p className="text-xs text-muted-foreground mb-3">
                ⏱️ Tempo restante: {String(timerMins).padStart(2, '0')}:{String(timerSecs).padStart(2, '0')}
              </p>
            )}
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={() => { setShowResults(false); setCurrentIndex(0); setTimedMode(false); }}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Revisar
              </Button>
              <Button size="sm" onClick={() => navigate('/dashboard')} className="gradient-primary text-primary-foreground">
                Dashboard
              </Button>
            </div>
          </Card>
        )}

        {exercises.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground bg-card border border-border/50">
            <p className="text-sm">Nenhum exercício disponível.</p>
          </Card>
        ) : !showResults && (
          <>
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 hide-scrollbar animate-content-show delay-1">
              {exercises.map((ex, i) => {
                const answered = answers[ex.id];
                return (
                  <button key={ex.id} onClick={() => setCurrentIndex(i)}
                    className={`h-7 w-7 rounded-full text-[11px] font-medium shrink-0 smooth-all ${
                      i === currentIndex ? 'bg-primary text-primary-foreground shadow-sm'
                        : answered ? answered.correct ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                        : 'bg-accent text-muted-foreground'
                    }`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {currentExercise && (() => {
              const answered = answers[currentExercise.id];
              const options = Array.isArray(currentExercise.options) ? currentExercise.options as string[] : [];
              return (
                <Card key={currentExercise.id} className="p-5 animate-card-enter bg-card border border-border/50">
                  <Badge variant="secondary" className="text-[10px] mb-3">{currentIndex + 1}/{exercises.length}</Badge>
                  <p className="font-medium mb-4 text-sm leading-relaxed">{currentExercise.question}</p>
                  <div className="space-y-2">
                    {options.map((opt, oi) => {
                      const letter = String.fromCharCode(65 + oi);
                      const isSelected = answered?.selected === letter;
                      const isCorrectAnswer = letter === currentExercise.correct_answer;
                      let cls = 'border-border/60 hover:border-primary/40 hover:bg-accent/50';
                      if (answered) {
                        if (isCorrectAnswer) cls = 'border-success/40 bg-success/5';
                        else if (isSelected && !answered.correct) cls = 'border-destructive/40 bg-destructive/5';
                        else cls = 'border-border/30 opacity-50';
                      }
                      return (
                        <button key={letter} disabled={!!answered}
                          onClick={() => handleAnswer(currentExercise.id, letter, currentExercise.correct_answer)}
                          className={`w-full text-left p-3 rounded-lg border smooth-all text-sm flex items-center gap-3 ${cls} ${!answered ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'}`}>
                          <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                            answered && isCorrectAnswer ? 'bg-success/20 text-success' : answered && isSelected && !answered.correct ? 'bg-destructive/20 text-destructive' : 'bg-accent text-muted-foreground'
                          }`}>
                            {answered && isCorrectAnswer ? <CheckCircle className="h-3.5 w-3.5" /> : answered && isSelected && !answered.correct ? <XCircle className="h-3.5 w-3.5" /> : letter}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                  {answered && currentExercise.explanation && (
                    <div className="mt-4 p-3 rounded-lg bg-accent/40 text-sm">
                      <p className="font-medium text-xs text-primary mb-1">Explicação:</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">{currentExercise.explanation}</p>
                    </div>
                  )}
                  <div className="flex justify-between mt-4">
                    <Button size="sm" variant="ghost" disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)}>← Anterior</Button>
                    <Button size="sm" variant="ghost" disabled={currentIndex === exercises.length - 1} onClick={() => setCurrentIndex(prev => prev + 1)}>Próxima →</Button>
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
