import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Trophy, ArrowRight, RotateCcw, ClipboardCheck, Clock, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { ProfessionalAudioPlayer } from './ProfessionalAudioPlayer';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AudioAula {
  id: string;
  titulo: string;
  audioUrl: string;
  questaoId: string;
}

interface Question {
  id: string;
  type: string;
  question: string;
  description?: string;
  is_required: boolean;
  points: number;
  options: any[];
  match_options?: any[];
  correct_answer?: any;
  image_url?: string;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  min_score_percent: number;
  questions: Question[];
}

interface AudioQuizSystemProps {
  aula: AudioAula;
  quiz: Quiz;
  onComplete?: (result: any) => void;
}

export function AudioQuizSystem({ aula, quiz, onComplete }: AudioQuizSystemProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'audio' | 'transition' | 'quiz' | 'result'>('audio');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState<any>(null);

  const handleAudioEnded = () => {
    setStep('transition');
  };

  const startQuiz = () => {
    setStartTime(Date.now());
    setStep('quiz');
  };

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const currentQuestion = quiz.questions[currentQuestionIdx];
  const totalQuestions = quiz.questions.length;
  const progress = ((currentQuestionIdx + 1) / totalQuestions) * 100;

  const isCurrentQuestionAnswered = currentQuestion?.is_required 
    ? answers[currentQuestion.id] !== undefined && 
      answers[currentQuestion.id] !== '' && 
      (Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id].length > 0 : true) &&
      (currentQuestion.type === 'matching' ? Object.keys(answers[currentQuestion.id] || {}).length === currentQuestion.options.length : true)
    : true;

  const calculateScore = () => {
    let score = 0;
    let totalPoints = 0;

    quiz.questions.forEach(q => {
      totalPoints += q.points;
      const userAnswer = answers[q.id];
      
      if (q.type === 'multiple-choice' || q.type === 'true-false') {
        if (userAnswer === q.correct_answer) {
          score += q.points;
        }
      } else if (q.type === 'open') {
        // Simple heuristic for open answers (non-empty)
        if (userAnswer && userAnswer.length > 5) score += q.points;
      } else if (q.type === 'multiple-select') {
        const correctIds = q.options.filter((o: any) => o.correta).map((o: any) => o.id);
        const userIds = userAnswer || [];
        if (correctIds.length === userIds.length && correctIds.every((id: string) => userIds.includes(id))) {
          score += q.points;
        }
      } else if (q.type === 'ordering') {
        const userOrder = userAnswer || [];
        const isCorrect = userOrder.every((item: any, idx: number) => item.ordem_correta === idx + 1);
        if (isCorrect) score += q.points;
      } else if (q.type === 'matching') {
        const userMatches = userAnswer || {};
        const correctMatches = q.options.every((opt: any) => userMatches[opt.id] === opt.match_id);
        if (correctMatches) score += q.points;
      }
    });

    return { score, totalPoints };
  };

  const submitQuiz = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const end = Date.now();
    setEndTime(end);

    const { score, totalPoints } = calculateScore();
    const percent = (score / totalPoints) * 100;
    const passed = percent >= quiz.min_score_percent;

    const result = {
      user_id: user.id,
      quiz_id: quiz.id,
      score,
      total_points: totalPoints,
      answers,
      time_spent: Math.floor((end - startTime) / 1000),
      passed,
    };

    try {
      const { error } = await supabase
        .from('quiz_submissions')
        .insert(result);

      if (error) throw error;

      setFinalResult(result);
      setStep('result');
      if (onComplete) onComplete(result);
      toast.success(passed ? "Parabéns! Você passou!" : "Quiz finalizado.");
    } catch (err) {
      console.error("Erro ao salvar quiz:", err);
      toast.error("Erro ao salvar suas respostas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
      <AnimatePresence mode="wait">
        {step === 'audio' && (
          <motion.div
            key="audio-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-primary tracking-tight">{aula.titulo}</h2>
              <p className="text-muted-foreground text-sm">Ouça a aula completa para liberar o questionário.</p>
            </div>
            
            <ProfessionalAudioPlayer 
              url={aula.audioUrl} 
              title={aula.titulo}
              onEnded={handleAudioEnded}
            />

            <div className="flex justify-center">
              <Button 
                variant="outline" 
                className="group border-primary/20 hover:border-primary/50"
                onClick={handleAudioEnded}
              >
                Pular para o Questionário
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'transition' && (
          <motion.div
            key="transition-step"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-20 space-y-8 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 animate-pulse">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-foreground">Aula Concluída!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Excelente! Você finalizou a parte teórica. Agora, vamos testar seus conhecimentos com um rápido questionário.
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => setStep('audio')}>
                <RotateCcw className="mr-2 w-4 h-4" />
                Ouvir Novamente
              </Button>
              <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={startQuiz}>
                Iniciar Questionário
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'quiz' && (
          <motion.div
            key="quiz-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-primary/70">
                <span>Pergunta {currentQuestionIdx + 1} de {totalQuestions}</span>
                <span>{Math.round(progress)}% Concluído</span>
              </div>
              <Progress value={progress} className="h-2 bg-primary/10" />
            </div>

            <Card className="p-8 bg-card/40 backdrop-blur-xl border-primary/20 shadow-2xl space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold leading-tight">{currentQuestion.question}</h3>
                {currentQuestion.description && (
                  <p className="text-muted-foreground text-sm">{currentQuestion.description}</p>
                )}
                {currentQuestion.image_url && (
                  <img src={currentQuestion.image_url} alt="Referência" className="rounded-xl border border-primary/10 w-full object-cover max-h-60" />
                )}
              </div>

              <div className="space-y-4">
                {currentQuestion.type === 'multiple-choice' && (
                  <RadioGroup 
                    value={answers[currentQuestion.id]} 
                    onValueChange={(val) => handleAnswer(currentQuestion.id, val)}
                    className="grid gap-3"
                  >
                    {currentQuestion.options.map((opt: any) => (
                      <div key={opt.id} className="relative">
                        <RadioGroupItem value={opt.id} id={opt.id} className="peer sr-only" />
                        <Label
                          htmlFor={opt.id}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-primary/5 cursor-pointer transition-all hover:bg-primary/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/20",
                            answers[currentQuestion.id] === opt.id && "border-primary bg-primary/20"
                          )}
                        >
                          <span className="font-medium">{opt.texto}</span>
                          {answers[currentQuestion.id] === opt.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.type === 'true-false' && (
                  <div className="grid grid-cols-2 gap-4">
                    {[true, false].map((val) => (
                      <Button
                        key={String(val)}
                        variant="outline"
                        className={cn(
                          "h-20 text-lg font-bold border-primary/10",
                          answers[currentQuestion.id] === val && "border-primary bg-primary/20"
                        )}
                        onClick={() => handleAnswer(currentQuestion.id, val)}
                      >
                        {val ? "Verdadeiro" : "Falso"}
                      </Button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'open' && (
                  <div className="space-y-4">
                    <Textarea 
                      placeholder="Escreva sua resposta aqui..."
                      className="min-h-[150px] bg-primary/5 border-primary/10 focus:border-primary"
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                    />
                    <div className="flex justify-end text-[10px] text-muted-foreground font-mono">
                      {answers[currentQuestion.id]?.length || 0} caracteres
                    </div>
                  </div>
                )}

                {currentQuestion.type === 'multiple-select' && (
                  <div className="grid gap-3">
                    {currentQuestion.options.map((opt: any) => (
                      <div
                        key={opt.id}
                        className={cn(
                          "flex items-center space-x-3 p-4 rounded-xl border border-primary/10 bg-primary/5 cursor-pointer transition-all hover:bg-primary/10",
                          (answers[currentQuestion.id] || []).includes(opt.id) && "border-primary bg-primary/20"
                        )}
                        onClick={() => handleMultipleSelect(currentQuestion.id, opt.id, !(answers[currentQuestion.id] || []).includes(opt.id))}
                      >
                        <Checkbox
                          id={opt.id}
                          checked={(answers[currentQuestion.id] || []).includes(opt.id)}
                          onCheckedChange={(checked) => handleMultipleSelect(currentQuestion.id, opt.id, !!checked)}
                        />
                        <Label htmlFor={opt.id} className="font-medium cursor-pointer flex-1">
                          {opt.texto}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'ordering' && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-4">Clique e arraste ou use os botões para ordenar:</p>
                    {(answers[currentQuestion.id] || currentQuestion.options).map((opt: any, idx: number) => (
                      <div
                        key={opt.id}
                        className="flex items-center gap-3 p-4 rounded-xl border border-primary/10 bg-primary/5"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </div>
                        <span className="flex-1 font-medium">{opt.texto}</span>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            disabled={idx === 0}
                            onClick={() => {
                              const newOrder = [...(answers[currentQuestion.id] || currentQuestion.options)];
                              [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
                              handleOrderChange(currentQuestion.id, newOrder);
                            }}
                          >
                            <ArrowRight className="w-3 h-3 -rotate-90" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            disabled={idx === currentQuestion.options.length - 1}
                            onClick={() => {
                              const newOrder = [...(answers[currentQuestion.id] || currentQuestion.options)];
                              [newOrder[idx + 1], newOrder[idx]] = [newOrder[idx], newOrder[idx + 1]];
                              handleOrderChange(currentQuestion.id, newOrder);
                            }}
                          >
                            <ArrowRight className="w-3 h-3 rotate-90" />
                          </Button>
                        </div>
                        <GripVertical className="w-4 h-4 text-muted-foreground/30" />
                      </div>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'matching' && (
                  <div className="space-y-6">
                    {currentQuestion.options.map((opt: any) => (
                      <div key={opt.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 font-bold text-sm">
                          {opt.texto}
                        </div>
                        <RadioGroup
                          value={answers[currentQuestion.id]?.[opt.id]}
                          onValueChange={(val) => handleMatchChange(currentQuestion.id, opt.id, val)}
                          className="flex flex-wrap gap-2"
                        >
                          {currentQuestion.match_options.map((mOpt: any) => (
                            <div key={mOpt.id} className="relative">
                              <RadioGroupItem value={mOpt.id} id={`${opt.id}-${mOpt.id}`} className="peer sr-only" />
                              <Label
                                htmlFor={`${opt.id}-${mOpt.id}`}
                                className={cn(
                                  "px-3 py-2 rounded-lg border border-primary/10 bg-primary/5 text-xs cursor-pointer transition-all hover:bg-primary/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/20",
                                  answers[currentQuestion.id]?.[opt.id] === mOpt.id && "border-primary bg-primary/20 text-primary"
                                )}
                              >
                                {mOpt.texto}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="ghost"
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                >
                  Anterior
                </Button>
                
                {currentQuestionIdx < totalQuestions - 1 ? (
                  <Button
                    disabled={!isCurrentQuestionAnswered}
                    onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                  >
                    Próxima Pergunta
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    disabled={!isCurrentQuestionAnswered || isSubmitting}
                    className="bg-primary hover:bg-primary/90"
                    onClick={submitQuiz}
                  >
                    {isSubmitting ? "Enviando..." : "Finalizar Quiz"}
                    <ClipboardCheck className="ml-2 w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {step === 'result' && finalResult && (
          <motion.div
            key="result-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-8"
          >
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center text-white shadow-2xl",
              finalResult.passed ? "bg-emerald-500 shadow-emerald-500/20" : "bg-orange-500 shadow-orange-500/20"
            )}>
              {finalResult.passed ? <Trophy className="w-12 h-12" /> : <ClipboardCheck className="w-12 h-12" />}
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-4xl font-black tracking-tight">
                {finalResult.score} / {finalResult.total_points}
              </h2>
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Pontuação Final</p>
            </div>

            <Card className="w-full max-w-md p-6 bg-card/40 backdrop-blur-xl border-primary/20 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center space-y-1">
                  <span className="text-2xl font-black">{Math.round((finalResult.score / finalResult.total_points) * 100)}%</span>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Aproveitamento</p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center space-y-1">
                  <span className="text-2xl font-black flex items-center justify-center gap-1">
                    <Clock className="w-4 h-4 text-primary" />
                    {Math.floor(finalResult.time_spent / 60)}:{(finalResult.time_spent % 60).toString().padStart(2, '0')}
                  </span>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Tempo Total</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold">Feedback:</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {finalResult.passed 
                    ? "Excelente trabalho! Você demonstrou um ótimo entendimento do conteúdo apresentado na audioaula."
                    : "Quase lá! Recomendamos que você ouça a aula novamente e tente responder o questionário mais uma vez."}
                </p>
              </div>

              <Button 
                className="w-full h-12 font-bold text-base" 
                onClick={() => {
                  setAnswers({});
                  setCurrentQuestionIdx(0);
                  setStep('audio');
                }}
              >
                {finalResult.passed ? "Concluir Aula" : "Tentar Novamente"}
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
