import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { CommentsWidget } from '@/components/CommentsWidget';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, ArrowRight, CheckCircle, XCircle, Trophy, RotateCcw, Timer,
  BookOpen, Wand2, ChevronLeft, ChevronRight, Eye, EyeOff, PenLine,
  BarChart3, Clock, Target, Rocket, Award, Send, ListChecks, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

// Nunca carregamos `correct_answer` no cliente: a correção é feita pelo servidor
// (RPC check_exercise_answer) e a alternativa correta só é revelada após responder.
type Exercise = Omit<Tables<'exercises'>, 'correct_answer'>;

type AnswerState = {
  selected: string;
  correct: boolean;
  correctAnswer?: string;
};

// Essay answers stored locally
type EssayAnswer = {
  text: string;
  showModel: boolean;
};

export default function ExercisesPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const gamification = useGamification();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerState | null>>({});
  const [essayAnswers, setEssayAnswers] = useState<Record<string, EssayAnswer>>({});
  const [title, setTitle] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);

  // Timed mode
  const [timedMode, setTimedMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Animation
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [animating, setAnimating] = useState(false);

  // Review mode
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    setLoading(true);
    Promise.all([
      supabase.from('apostilas').select('title').eq('id', id).single(),
      supabase.from('exercises').select('id, question, options, explanation, apostila_id, created_at, correct_answer').eq('apostila_id', id),
      supabase.from('answers').select('exercise_id, selected_answer, is_correct').eq('user_id', user.id),
    ]).then(([apostila, exercisesRes, answersRes]) => {
      if (apostila.data) setTitle(apostila.data.title);
      setExercises((exercisesRes.data as any) || []);
      const map: Record<string, AnswerState> = {};
      answersRes.data?.forEach(a => { map[a.exercise_id] = { selected: a.selected_answer, correct: a.is_correct }; });
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

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigateQuestion('next');
      if (e.key === 'ArrowLeft') navigateQuestion('prev');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIndex, animating, exercises.length]);


  const getExerciseType = useCallback((ex: Exercise): 'multiple_choice' | 'essay' => {
    const opts = Array.isArray(ex.options) ? ex.options as string[] : [];
    if (opts.length === 0 || ex.correct_answer === 'dissertativa') return 'essay';
    return 'multiple_choice';
  }, []);

  const mcExercises = useMemo(() => exercises.filter(e => getExerciseType(e) === 'multiple_choice'), [exercises, getExerciseType]);
  const essayExercises = useMemo(() => exercises.filter(e => getExerciseType(e) === 'essay'), [exercises, getExerciseType]);

  const startTimedMode = () => {
    setTimedMode(true);
    setTimeLeft(mcExercises.length * 60);
    setTimerActive(true);
    setCurrentIndex(0);
    setShowResults(false);
  };

  const navigateQuestion = (direction: 'prev' | 'next') => {
    if (animating) return;
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= exercises.length) return;
    setSlideDirection(direction === 'next' ? 'right' : 'left');
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setAnimating(false);
    }, 150);
  };

  const handleAnswer = async (exerciseId: string, selected: string) => {
    if (!user || answers[exerciseId]) return;

    const { data, error } = await supabase.rpc('check_exercise_answer', {
      _exercise_id: exerciseId, _selected_answer: selected
    });
    if (error) { toast.error('Erro ao salvar resposta'); return; }

    const result = data as { is_correct: boolean; correct_answer: string; explanation: string | null };
    setAnswers(prev => ({ ...prev, [exerciseId]: { selected, correct: result.is_correct, correctAnswer: result.correct_answer } }));

    gamification.addXP(result.is_correct ? 10 : 3);
    gamification.updateStreak();

    const totalAnswers = Object.keys(answers).length + 1;
    if (totalAnswers === 1) gamification.checkAndAwardBadge('first_answer');
    if (totalAnswers >= 100) gamification.checkAndAwardBadge('answers_100');

    if (result.is_correct) {
      toast.success('Correto! +10 XP', { duration: 2000 });
    } else {
      toast.error('Incorreto +3 XP', { duration: 2000 });
    }

    if (timedMode && currentIndex < exercises.length - 1) {
      setTimeout(() => navigateQuestion('next'), 1000);
    }
  };

  const handleEssaySubmit = (exerciseId: string) => {
    const essay = essayAnswers[exerciseId];
    if (!essay?.text?.trim()) { toast.error('Escreva sua resposta antes de enviar.'); return; }
    setAnswers(prev => ({ ...prev, [exerciseId]: { selected: essay.text, correct: true } }));
    gamification.addXP(15);
    gamification.updateStreak();
    toast.success('Dissertativa enviada. +15 XP');
  };

  const toggleModelAnswer = (exerciseId: string) => {
    setEssayAnswers(prev => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], showModel: !prev[exerciseId]?.showModel }
    }));
  };

  // Stats
  const answeredCount = exercises.filter(ex => answers[ex.id]).length;
  const mcAnswered = mcExercises.filter(ex => answers[ex.id]).length;
  const correctCount = mcExercises.filter(ex => answers[ex.id]?.correct).length;
  const allAnswered = exercises.length > 0 && answeredCount === exercises.length;
  const pct = mcAnswered > 0 ? Math.round((correctCount / mcAnswered) * 100) : 0;
  const currentExercise = exercises[currentIndex];

  const filteredReviewExercises = useMemo(() => {
    return exercises.filter(ex => {
      const ans = answers[ex.id];
      if (reviewFilter === 'correct') return ans?.correct === true;
      if (reviewFilter === 'incorrect') return ans && !ans.correct;
      if (reviewFilter === 'unanswered') return !ans;
      return true;
    });
  }, [exercises, answers, reviewFilter]);

  useEffect(() => {
    if (allAnswered && !showResults) {
      setShowResults(true);
      setTimerActive(false);
      if (pct === 100) {
        gamification.checkAndAwardBadge('perfect_apostila');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
    }
  }, [allAnswered]);

  const timerMins = Math.floor(timeLeft / 60);
  const timerSecs = timeLeft % 60;

  const getGradeColor = (p: number) => p >= 70 ? 'text-[hsl(var(--success))]' : p >= 50 ? 'text-[hsl(var(--warning))]' : 'text-destructive';
  const getGradeLabel = (p: number) => p >= 90 ? 'Extraordinário!' : p >= 70 ? 'Excelente!' : p >= 50 ? 'Bom trabalho!' : 'Continue estudando!';
  const getGradeEmoji = (_p: number) => '';

  if (loading) {
    return (
      <div className="min-h-dvh bg-background">
        <AppHeader />
        <main className="container py-12 px-4 max-w-2xl">
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 sm:h-24 rounded-xl bg-muted/30 animate-pulse border border-border/40" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background relative overflow-hidden">
      <Watermark />
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div key={i} className="absolute animate-confetti" style={{
              left: `${Math.random() * 100}%`,
              top: '-10px',
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              backgroundColor: ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--accent))'][Math.floor(Math.random() * 4)],
              width: `${6 + Math.random() * 6}px`,
              height: `${6 + Math.random() * 6}px`,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }} />
          ))}
        </div>
      )}

      <AppHeader />
      <main className="container py-6 px-4 relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              <h1 className="text-base font-bold truncate sm:text-lg">Exercícios</h1>
            </div>
            <p className="text-muted-foreground text-xs truncate mt-0.5">{title}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {exercises.length > 0 && (
              <Badge variant="secondary" className="text-[10px] font-mono">
                {mcExercises.length > 0 && `${mcExercises.length} obj`}
                {mcExercises.length > 0 && essayExercises.length > 0 && ' + '}
                {essayExercises.length > 0 && `${essayExercises.length} diss`}
              </Badge>
            )}
            {!timedMode && mcExercises.length > 0 && !showResults && !reviewMode && (
              <Button size="sm" variant="outline" onClick={startTimedMode} className="text-xs gap-1.5 h-8">
                <Timer className="h-3.5 w-3.5" /> Simulado
              </Button>
            )}
            {answeredCount > 0 && !showResults && (
              <Button size="sm" variant={reviewMode ? 'default' : 'outline'} onClick={() => { setReviewMode(!reviewMode); setTimedMode(false); setTimerActive(false); }} className="text-xs gap-1.5 h-8">
                <ListChecks className="h-3.5 w-3.5" /> Revisão
              </Button>
            )}
          </div>
        </div>

        {/* Timer bar */}
        {timedMode && timerActive && (
          <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Timer className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Modo Simulado</p>
                <p className="text-sm font-mono font-bold text-primary">
                  {String(timerMins).padStart(2, '0')}:{String(timerSecs).padStart(2, '0')}
                </p>
              </div>
            </div>
            <Progress value={(timeLeft / (mcExercises.length * 60)) * 100} className="w-24 h-2" />
          </div>
        )}

        {/* Progress bar */}
        {exercises.length > 0 && !showResults && (
          <div className="mb-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {answeredCount}/{exercises.length} respondidas
              </span>
              {answeredCount > 0 && (
                <span className="flex items-center gap-1 font-semibold text-primary">
                  <Rocket className="h-3 w-3" />
                  {pct}% acertos
                </span>
              )}
            </div>
            <Progress value={(answeredCount / exercises.length) * 100} className="h-2" />
          </div>
        )}

        {/* Results Card */}
        {showResults && (
          <div className="mb-6 animate-scale-in">
            <Card className="p-6 bg-card border border-border/50 overflow-hidden relative">
              {/* Decorative gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

              <div className="relative text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
                  <span className="text-3xl">{getGradeEmoji(pct)}</span>
                </div>
                <h2 className="text-xl font-bold mb-1">{getGradeLabel(pct)}</h2>

                {/* Score circle */}
                <div className="relative w-28 h-28 mx-auto my-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                      className="stroke-muted/30" />
                    <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                      strokeDasharray={`${pct * 2.64} 264`}
                      strokeLinecap="round"
                      className="stroke-primary transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${getGradeColor(pct)}`}>{pct}%</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-[hsl(var(--success))]/10">
                    <CheckCircle className="h-4 w-4 text-[hsl(var(--success))] mx-auto mb-1" />
                    <p className="text-lg font-bold text-[hsl(var(--success))]">{correctCount}</p>
                    <p className="text-[10px] text-muted-foreground">Corretas</p>
                  </div>
                  <div className="p-3 rounded-xl bg-destructive/10">
                    <XCircle className="h-4 w-4 text-destructive mx-auto mb-1" />
                    <p className="text-lg font-bold text-destructive">{mcAnswered - correctCount}</p>
                    <p className="text-[10px] text-muted-foreground">Incorretas</p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Wand2 className="h-4 w-4 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold text-primary">{correctCount * 10 + (mcAnswered - correctCount) * 3 + essayExercises.filter(e => answers[e.id]).length * 15}</p>
                    <p className="text-[10px] text-muted-foreground">XP Ganho</p>
                  </div>
                </div>

                {timedMode && (
                  <p className="text-xs text-muted-foreground mb-4 flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    Tempo restante: {String(timerMins).padStart(2, '0')}:{String(timerSecs).padStart(2, '0')}
                  </p>
                )}

                <div className="flex gap-2 justify-center">
                  <Button size="sm" variant="outline" onClick={() => { setShowResults(false); setReviewMode(true); setReviewFilter('all'); setTimedMode(false); }}
                    className="gap-1.5">
                    <ListChecks className="h-3.5 w-3.5" /> Revisão
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowResults(false); setCurrentIndex(0); setTimedMode(false); }}
                    className="gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" /> Refazer
                  </Button>
                  <Button size="sm" onClick={() => navigate('/dashboard')} className="gradient-primary text-primary-foreground gap-1.5">
                    <Award className="h-3.5 w-3.5" /> Dashboard
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Empty state */}
        {exercises.length === 0 ? (
          <Card className="p-12 text-center bg-card border border-border/50">
            <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum exercício disponível para esta apostila.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Voltar
            </Button>
          </Card>
        ) : reviewMode ? (
          /* ========== REVIEW MODE ========== */
          <div className="space-y-4 animate-fade-in">
            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {([
                { key: 'all', label: 'Todas', count: exercises.length },
                { key: 'correct', label: 'Corretas', count: mcExercises.filter(e => answers[e.id]?.correct).length + essayExercises.filter(e => answers[e.id]).length },
                { key: 'incorrect', label: 'Incorretas', count: exercises.filter(e => answers[e.id] && !answers[e.id]?.correct).length },
                { key: 'unanswered', label: 'Não respondidas', count: exercises.filter(e => !answers[e.id]).length },
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => setReviewFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                    reviewFilter === f.key
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {f.key === 'correct' && <CheckCircle className="h-3 w-3" />}
                  {f.key === 'incorrect' && <XCircle className="h-3 w-3" />}
                  {f.key === 'all' && <Filter className="h-3 w-3" />}
                  {f.label}
                  <span className={`ml-0.5 text-[10px] font-mono ${reviewFilter === f.key ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {filteredReviewExercises.length === 0 ? (
              <Card className="p-8 text-center bg-card border border-border/50">
                <Filter className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Nenhuma questão neste filtro.</p>
              </Card>
            ) : (
              filteredReviewExercises.map((ex, idx) => {
                const globalIdx = exercises.indexOf(ex);
                const ans = answers[ex.id];
                const type = getExerciseType(ex);
                const options = Array.isArray(ex.options) ? ex.options as string[] : [];

                return (
                  <Card key={ex.id} className={`bg-card border overflow-hidden transition-all ${
                    ans?.correct ? 'border-[hsl(var(--success))]/30' : ans ? 'border-destructive/30' : 'border-border/50'
                  }`}>
                    {/* Header */}
                    <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          ans?.correct ? 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]'
                            : ans ? 'bg-destructive/15 text-destructive'
                            : 'bg-secondary text-muted-foreground'
                        }`}>
                          {globalIdx + 1}
                        </span>
                        <Badge variant={type === 'essay' ? 'default' : 'secondary'} className="text-[10px]">
                          {type === 'essay' ? 'Dissertativa' : 'Múltipla Escolha'}
                        </Badge>
                      </div>
                      {ans && (
                        <Badge variant={ans.correct ? 'default' : 'destructive'} className="text-[10px] gap-1">
                          {ans.correct ? <><CheckCircle className="h-2.5 w-2.5" /> Correto</> : <><XCircle className="h-2.5 w-2.5" /> Incorreto</>}
                        </Badge>
                      )}
                    </div>

                    {/* Question */}
                    <div className="p-4">
                      <p className="text-sm font-medium leading-relaxed mb-3 whitespace-pre-line">{ex.question}</p>

                      {/* Options review */}
                      {type === 'multiple_choice' && (
                        <div className="space-y-1.5">
                          {options.map((opt, oi) => {
                            const letter = String.fromCharCode(65 + oi);
                            const isSelected = ans?.selected === letter;
                            const isCorrectAnswer = ans ? letter === ans.correctAnswer : false;

                            let cls = 'bg-secondary/20 border-border/30 text-muted-foreground';
                            if (ans) {
                              if (isCorrectAnswer) cls = 'bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/30 text-foreground';
                              else if (isSelected && !ans.correct) cls = 'bg-destructive/10 border-destructive/30 text-foreground';
                              else cls = 'bg-secondary/10 border-border/20 text-muted-foreground/50';
                            }

                            return (
                              <div key={letter} className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs ${cls}`}>
                                <span className={`h-6 w-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isCorrectAnswer ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]'
                                    : isSelected && !ans?.correct ? 'bg-destructive/20 text-destructive'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {isCorrectAnswer ? <CheckCircle className="h-3 w-3" /> : isSelected && !ans?.correct ? <XCircle className="h-3 w-3" /> : letter}
                                </span>
                                <span className="flex-1 leading-relaxed">{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Essay review */}
                      {type === 'essay' && ans && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <p className="text-xs text-primary font-medium mb-1 flex items-center gap-1"><PenLine className="h-3 w-3" /> Sua resposta</p>
                          <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">{ans.selected}</p>
                        </div>
                      )}

                      {/* Explanation */}
                      {ans && ex.explanation && (
                        <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                          <p className="font-semibold text-[10px] text-accent mb-1 flex items-center gap-1">
                            <Wand2 className="h-3 w-3" /> {type === 'essay' ? 'Resposta Modelo' : 'Explicação'}
                          </p>
                          <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-line">{ex.explanation}</p>
                        </div>
                      )}

                      {/* Jump to question button for unanswered */}
                      {!ans && (
                        <Button size="sm" variant="outline" className="mt-3 text-xs gap-1.5"
                          onClick={() => { setCurrentIndex(globalIdx); setReviewMode(false); }}>
                          <Target className="h-3 w-3" /> Responder questão {globalIdx + 1}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        ) : !showResults && (
          <>
            {/* Question nav pills */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-2 hide-scrollbar">
              {exercises.map((ex, i) => {
                const answered = answers[ex.id];
                const type = getExerciseType(ex);
                const isCurrent = i === currentIndex;
                return (
                  <button key={ex.id} onClick={() => { setSlideDirection(i > currentIndex ? 'right' : 'left'); setCurrentIndex(i); }}
                    className={`shrink-0 smooth-all relative ${
                      isCurrent
                        ? 'h-8 min-w-[2rem] px-2 rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-110'
                        : answered
                          ? answered.correct
                            ? 'h-7 w-7 rounded-full bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]'
                            : 'h-7 w-7 rounded-full bg-destructive/15 text-destructive'
                          : 'h-7 w-7 rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80'
                    } flex items-center justify-center text-[11px] font-semibold`}>
                    {answered && !isCurrent ? (
                      answered.correct ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />
                    ) : (
                      <span className="flex items-center gap-0.5">
                        {type === 'essay' && <PenLine className="h-2.5 w-2.5" />}
                        {i + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Current exercise card */}
            {currentExercise && (() => {
              const answered = answers[currentExercise.id];
              const type = getExerciseType(currentExercise);
              const options = Array.isArray(currentExercise.options) ? currentExercise.options as string[] : [];
              const essay = essayAnswers[currentExercise.id] || { text: '', showModel: false };

              return (
                <div className={`transition-all duration-200 ${animating ? (slideDirection === 'right' ? 'translate-x-4 opacity-0' : '-translate-x-4 opacity-0') : 'translate-x-0 opacity-100'}`}>
                  <Card className="bg-card border border-border/50 overflow-hidden">
                    {/* Card header */}
                    <div className="px-5 py-3 border-b border-border/30 flex items-center justify-between bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Badge variant={type === 'essay' ? 'default' : 'secondary'} className="text-[10px] gap-1">
                          {type === 'essay' ? <><PenLine className="h-2.5 w-2.5" /> Dissertativa</> : <><BarChart3 className="h-2.5 w-2.5" /> Múltipla Escolha</>}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">{currentIndex + 1}/{exercises.length}</span>
                      </div>
                      {answered && (
                        <Badge variant={answered.correct ? 'default' : 'destructive'} className="text-[10px] gap-1 animate-scale-in">
                          {answered.correct ? <><CheckCircle className="h-2.5 w-2.5" /> Correto</> : <><XCircle className="h-2.5 w-2.5" /> Incorreto</>}
                        </Badge>
                      )}
                    </div>

                    {/* Question body */}
                    <div className="p-5">
                      <p className="font-medium text-sm leading-relaxed mb-5 whitespace-pre-line">{currentExercise.question}</p>

                      {/* Multiple choice */}
                      {type === 'multiple_choice' && (
                        <div className="space-y-2.5">
                          {options.map((opt, oi) => {
                            const letter = String.fromCharCode(65 + oi);
                            const isSelected = answered?.selected === letter;
                            const isCorrectAnswer = answered ? letter === answered.correctAnswer : false;

                            let bgClass = 'bg-secondary/30 border-border/60 hover:bg-secondary/60 hover:border-primary/30';
                            let ringClass = '';
                            if (answered) {
                              if (isCorrectAnswer) {
                                bgClass = 'bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/40';
                                ringClass = 'ring-1 ring-[hsl(var(--success))]/20';
                              } else if (isSelected && !answered.correct) {
                                bgClass = 'bg-destructive/10 border-destructive/40';
                                ringClass = 'ring-1 ring-destructive/20';
                              } else {
                                bgClass = 'bg-secondary/10 border-border/20 opacity-40';
                              }
                            }

                            return (
                              <button key={letter} disabled={!!answered}
                                onClick={() => handleAnswer(currentExercise.id, letter)}
                                className={`w-full text-left p-3.5 rounded-xl border text-sm flex items-center gap-3 transition-all duration-200 ${bgClass} ${ringClass} ${
                                  !answered ? 'cursor-pointer active:scale-[0.98] hover:shadow-sm' : 'cursor-default'
                                }`}>
                                <span className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                                  answered && isCorrectAnswer
                                    ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]'
                                    : answered && isSelected && !answered.correct
                                      ? 'bg-destructive/20 text-destructive'
                                      : isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}>
                                  {answered && isCorrectAnswer ? <CheckCircle className="h-4 w-4" />
                                    : answered && isSelected && !answered.correct ? <XCircle className="h-4 w-4" />
                                    : letter}
                                </span>
                                <span className="flex-1 leading-relaxed">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Essay */}
                      {type === 'essay' && (
                        <div className="space-y-3">
                          {!answered ? (
                            <>
                              <Textarea
                                placeholder="Escreva sua resposta aqui..."
                                value={essay.text}
                                onChange={e => setEssayAnswers(prev => ({
                                  ...prev,
                                  [currentExercise.id]: { ...prev[currentExercise.id], text: e.target.value, showModel: false }
                                }))}
                                className="min-h-[140px] resize-y text-sm leading-relaxed bg-secondary/20 border-border/50 focus:border-primary/50"
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">
                                  {essay.text.length} caracteres
                                </span>
                                <Button size="sm" onClick={() => handleEssaySubmit(currentExercise.id)}
                                  disabled={!essay.text?.trim()}
                                  className="gap-1.5 gradient-primary text-primary-foreground">
                                  <Send className="h-3.5 w-3.5" /> Enviar Resposta
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-3">
                              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                                <p className="text-xs font-medium text-primary mb-1.5 flex items-center gap-1">
                                  <PenLine className="h-3 w-3" /> Sua resposta
                                </p>
                                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{answered.selected}</p>
                              </div>
                              {currentExercise.explanation && (
                                <Button size="sm" variant="outline" className="gap-1.5 w-full"
                                  onClick={() => toggleModelAnswer(currentExercise.id)}>
                                  {essay.showModel ? <><EyeOff className="h-3.5 w-3.5" /> Ocultar Resposta Modelo</> : <><Eye className="h-3.5 w-3.5" /> Ver Resposta Modelo</>}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Explanation */}
                      {answered && currentExercise.explanation && (type === 'multiple_choice' || essay.showModel) && (
                        <div className="mt-4 p-4 rounded-xl bg-accent/10 border border-accent/20 animate-fade-in">
                          <p className="font-semibold text-xs text-accent mb-1.5 flex items-center gap-1">
                            <Wand2 className="h-3 w-3" />
                            {type === 'essay' ? 'Resposta Modelo' : 'Explicação'}
                          </p>
                          <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-line">{currentExercise.explanation}</p>
                        </div>
                      )}
                    </div>

                    {/* Navigation footer */}
                    <div className="px-5 py-3 border-t border-border/30 flex items-center justify-between bg-muted/20">
                      <Button size="sm" variant="ghost" disabled={currentIndex === 0}
                        onClick={() => navigateQuestion('prev')}
                        className="gap-1 text-xs h-8">
                        <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                      </Button>
                      {currentIndex === exercises.length - 1 && answeredCount === exercises.length ? (
                        <Button size="sm" onClick={() => setShowResults(true)}
                          className="gap-1 text-xs h-8 gradient-primary text-primary-foreground">
                          <Trophy className="h-3.5 w-3.5" /> Ver Resultado
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled={currentIndex === exercises.length - 1}
                          onClick={() => navigateQuestion('next')}
                          className="gap-1 text-xs h-8">
                          Próxima <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </Card>
                </div>
              );
            })()}

            {/* Keyboard hints (desktop) */}
            <p className="text-center text-[10px] text-muted-foreground/50 mt-4 hidden sm:block">
              Use ← → para navegar entre questões
            </p>

            {/* Comments per exercise */}
            {currentExercise && (
              <div className="mt-4">
                <CommentsWidget contextType="exercise" contextId={currentExercise.id} compact />
              </div>
            )}
          </>
        )}
      </main>

      {/* CSS for confetti */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
      `}</style>
    </div>
  );
}
