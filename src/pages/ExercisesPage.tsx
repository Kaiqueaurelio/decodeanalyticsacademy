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
import {
  ArrowLeft, CheckCircle, XCircle, Trophy, RotateCcw, Timer,
  BookOpen, Target, Zap, ChevronLeft, ChevronRight
} from 'lucide-react';
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
  const [timedMode, setTimedMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    setLoading(true);
    Promise.all([
      supabase.from('apostilas').select('title').eq('id', id).single(),
      supabase.from('exercises').select('id, question, options, explanation, apostila_id, created_at').eq('apostila_id', id),
      supabase.from('answers').select('exercise_id, selected_answer, is_correct').eq('user_id', user.id),
    ]).then(([apRes, exRes, ansRes]) => {
      if (apRes.data) setTitle(apRes.data.title);
      setExercises((exRes.data as any) || []);
      const map: Record<string, { selected: string; correct: boolean }> = {};
      ansRes.data?.forEach(a => { map[a.exercise_id] = { selected: a.selected_answer, correct: a.is_correct }; });
      setAnswers(map);
      setLoading(false);
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
    setTimeLeft(exercises.length * 60);
    setTimerActive(true);
    setCurrentIndex(0);
    setShowResults(false);
  };

  const handleAnswer = async (exerciseId: string, selected: string) => {
    if (!user || answers[exerciseId]) return;

    const { data, error } = await supabase.rpc('check_exercise_answer', {
      _exercise_id: exerciseId, _selected_answer: selected
    });
    if (error) { toast.error('Erro ao salvar resposta'); return; }

    const result = data as { is_correct: boolean; correct_answer: string; explanation: string | null };
    const isCorrect = result.is_correct;
    setAnswers(prev => ({ ...prev, [exerciseId]: { selected, correct: isCorrect, correctAnswer: result.correct_answer } }));

    gamification.addXP(isCorrect ? 10 : 3);
    gamification.updateStreak();

    const totalAnswers = Object.keys(answers).length + 1;
    if (totalAnswers === 1) gamification.checkAndAwardBadge('first_answer');
    if (totalAnswers >= 100) gamification.checkAndAwardBadge('answers_100');

    toast[isCorrect ? 'success' : 'error'](isCorrect ? 'Correto! +10 XP' : 'Incorreto +3 XP');

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
      if (pct === 100) gamification.checkAndAwardBadge('perfect_apostila');
    }
  }, [allAnswered]);

  const timerMins = Math.floor(timeLeft / 60);
  const timerSecs = timeLeft % 60;

  const scoreColor = pct >= 70 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-destructive';
  const scoreLabel = pct >= 70 ? 'Excelente!' : pct >= 50 ? 'Bom trabalho!' : 'Continue estudando';

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <AppHeader />

      <main className="container py-6 sm:py-8 px-4 sm:px-6 relative z-10 max-w-3xl">
        {/* Back button */}
        <Button variant="ghost" size="sm" className="mb-4 text-xs gap-1.5 animate-fade-in" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Painel
        </Button>

        {/* Header section */}
        <div className="mb-6 animate-content-show">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-lg bg-primary/10 p-1.5">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold truncate">Exercícios</h1>
              </div>
              <p className="text-muted-foreground text-sm truncate">{title || 'Carregando...'}</p>
            </div>
            {!timedMode && exercises.length > 0 && !showResults && (
              <Button size="sm" variant="outline" onClick={startTimedMode} className="text-xs gap-1.5 h-8 shrink-0 editorial-border-hover">
                <Timer className="h-3.5 w-3.5" /> Simulado
              </Button>
            )}
          </div>

          {/* Timer bar */}
          {timedMode && timerActive && (
            <div className="mt-3 p-2.5 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2.5 animate-card-enter">
              <Timer className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-mono-label font-bold text-primary tracking-wider">
                {String(timerMins).padStart(2, '0')}:{String(timerSecs).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-muted-foreground">restante</span>
            </div>
          )}
        </div>

        {/* Stat pills */}
        {exercises.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6 animate-content-show delay-1">
            <Card className="p-3 hover-lift">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-accent/10 p-1.5">
                  <Target className="h-3.5 w-3.5 text-accent" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none">{answeredCount}<span className="text-xs text-muted-foreground font-normal">/{exercises.length}</span></p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Respondidas</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 hover-lift">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-success/10 p-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-success" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none text-success">{correctCount}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Acertos</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 hover-lift">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-warning/10 p-1.5">
                  <Zap className="h-3.5 w-3.5 text-warning" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none">{pct}<span className="text-xs text-muted-foreground font-normal">%</span></p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Aproveitamento</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Progress bar */}
        {exercises.length > 0 && (
          <div className="mb-6 animate-content-show delay-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
              <span className="font-mono-label">PROGRESSO</span>
              <span className="font-medium text-foreground">{Math.round((answeredCount / exercises.length) * 100)}%</span>
            </div>
            <Progress value={(answeredCount / exercises.length) * 100} className="h-2" />
          </div>
        )}

        {/* Results Card */}
        {showResults && (
          <Card className="p-6 sm:p-8 mb-6 animate-card-enter text-center">
            <div className={`mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center ${
              pct >= 70 ? 'bg-success/10' : pct >= 50 ? 'bg-warning/10' : 'bg-destructive/10'
            }`}>
              <Trophy className={`h-8 w-8 ${scoreColor}`} />
            </div>
            <h2 className="text-xl font-bold mb-1">{scoreLabel}</h2>
            <p className={`text-4xl font-bold mb-4 ${scoreColor}`}>{pct}%</p>

            <div className="flex justify-center gap-6 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-2xl font-bold text-success">{correctCount}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Acertos</p>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-2xl font-bold text-destructive">{answeredCount - correctCount}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Erros</p>
              </div>
            </div>

            {timedMode && (
              <p className="text-xs text-muted-foreground mb-4 font-mono-label">
                ⏱ Tempo restante: {String(timerMins).padStart(2, '0')}:{String(timerSecs).padStart(2, '0')}
              </p>
            )}

            <div className="flex gap-3 justify-center">
              <Button size="sm" variant="outline" onClick={() => { setShowResults(false); setCurrentIndex(0); setTimedMode(false); }} className="gap-1.5 editorial-border-hover">
                <RotateCcw className="h-3.5 w-3.5" /> Revisar
              </Button>
              <Button size="sm" onClick={() => navigate('/dashboard')} className="gradient-primary text-primary-foreground gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
              </Button>
            </div>
          </Card>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="space-y-4">
            <div className="skeleton-shimmer h-10 rounded-lg w-full" />
            <div className="skeleton-shimmer h-64 rounded-xl" />
          </div>
        ) : exercises.length === 0 ? (
          <Card className="p-12 text-center animate-card-enter">
            <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhum exercício disponível para esta apostila.</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={() => navigate('/dashboard')}>
              Voltar ao Painel
            </Button>
          </Card>
        ) : !showResults && (
          <>
            {/* Question navigator pills */}
            <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1.5 hide-scrollbar animate-content-show delay-3">
              {exercises.map((ex, i) => {
                const answered = answers[ex.id];
                const isCurrent = i === currentIndex;
                return (
                  <button
                    key={ex.id}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-8 w-8 rounded-lg text-[11px] font-medium shrink-0 transition-all duration-200 ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground shadow-md scale-110'
                        : answered
                          ? answered.correct
                            ? 'bg-success/15 text-success border border-success/20'
                            : 'bg-destructive/15 text-destructive border border-destructive/20'
                          : 'bg-card text-muted-foreground border border-border/50 hover:border-primary/30'
                    }`}
                  >
                    {answered ? (answered.correct ? '✓' : '✗') : i + 1}
                  </button>
                );
              })}
            </div>

            {/* Current question card */}
            {currentExercise && (() => {
              const answered = answers[currentExercise.id];
              const options = Array.isArray(currentExercise.options) ? currentExercise.options as string[] : [];
              return (
                <Card key={currentExercise.id} className="overflow-hidden animate-card-enter">
                  {/* Question header */}
                  <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between bg-card">
                    <Badge variant="secondary" className="text-[10px] font-mono-label">
                      QUESTÃO {currentIndex + 1} DE {exercises.length}
                    </Badge>
                    {answered && (
                      <Badge variant={answered.correct ? 'default' : 'destructive'} className="text-[10px] gap-1">
                        {answered.correct ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {answered.correct ? 'Correta' : 'Incorreta'}
                      </Badge>
                    )}
                  </div>

                  {/* Question body */}
                  <div className="p-5 sm:p-6">
                    <p className="font-medium mb-5 text-sm sm:text-base leading-relaxed text-foreground">{currentExercise.question}</p>

                    <div className="space-y-2.5">
                      {options.map((opt, oi) => {
                        const letter = String.fromCharCode(65 + oi);
                        const isSelected = answered?.selected === letter;
                        const isCorrectAnswer = answered ? letter === answered.correctAnswer : false;

                        let containerCls = 'border-border/60 hover:border-primary/40 hover:bg-accent/30 cursor-pointer active:scale-[0.99]';
                        let circleCls = 'bg-card border border-border text-muted-foreground';

                        if (answered) {
                          if (isCorrectAnswer) {
                            containerCls = 'border-success/40 bg-success/5';
                            circleCls = 'bg-success/20 text-success border-success/30';
                          } else if (isSelected && !answered.correct) {
                            containerCls = 'border-destructive/40 bg-destructive/5';
                            circleCls = 'bg-destructive/20 text-destructive border-destructive/30';
                          } else {
                            containerCls = 'border-border/30 opacity-40';
                            circleCls = 'bg-muted text-muted-foreground border-border/30';
                          }
                        }

                        return (
                          <button
                            key={letter}
                            disabled={!!answered}
                            onClick={() => handleAnswer(currentExercise.id, letter)}
                            className={`w-full text-left p-3 sm:p-3.5 rounded-xl border transition-all duration-200 text-sm flex items-center gap-3 ${containerCls} ${answered ? 'cursor-default' : ''}`}
                          >
                            <span className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 border transition-all ${circleCls}`}>
                              {answered && isCorrectAnswer ? <CheckCircle className="h-4 w-4" />
                                : answered && isSelected && !answered.correct ? <XCircle className="h-4 w-4" />
                                : letter}
                            </span>
                            <span className="flex-1 leading-relaxed">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {answered && currentExercise.explanation && (
                      <div className="mt-5 p-4 rounded-xl bg-primary/5 border border-primary/15 animate-fade-in">
                        <p className="font-semibold text-xs text-primary mb-1.5 flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5" /> Explicação
                        </p>
                        <p className="text-muted-foreground text-sm leading-relaxed">{currentExercise.explanation}</p>
                      </div>
                    )}
                  </div>

                  {/* Navigation footer */}
                  <div className="px-5 py-3 border-t border-border/50 flex items-center justify-between bg-card">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex(prev => prev - 1)}
                      className="text-xs gap-1"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={currentIndex === exercises.length - 1}
                      onClick={() => setCurrentIndex(prev => prev + 1)}
                      className="text-xs gap-1"
                    >
                      Próxima <ChevronRight className="h-3.5 w-3.5" />
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
