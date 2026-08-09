import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Target, Trophy, Wand2, RefreshCw, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getSubjectColor } from '@/lib/subject-colors';

type Question = {
  id: string;
  question_index: number;
  question: string;
  options: string[];
  correct_answer: string | null;
  explanation: string | null;
  selected_answer: string | null;
  is_correct: boolean | null;
  subject: string | null;
};

type Simulado = {
  id: string;
  status: 'in_progress' | 'finished';
  total_questions: number;
  correct_count: number;
  score: number;
  diagnosis: Record<string, { total: number; correct: number; accuracy: number }>;
  finished_at: string | null;
};

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export default function SimuladoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  const loadLatest = async () => {
    if (!user) return;
    setLoading(true);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: sim } = await supabase
      .from('weekly_simulados')
      .select('id, status, total_questions, correct_count, score, diagnosis, finished_at')
      .eq('user_id', user.id)
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sim) { setSimulado(null); setQuestions([]); setLoading(false); return; }
    setSimulado(sim as any);

    // Gabarito nunca é carregado antecipadamente: buscamos apenas o enunciado
    // e revelamos a resposta correta somente das questões já respondidas.
    const { data: ans } = await supabase
      .from('weekly_simulado_answers')
      .select('id, question_index, question, options, selected_answer, is_correct, subject')
      .eq('simulado_id', sim.id)
      .order('question_index', { ascending: true });

    const { data: revealed } = await supabase
      .from('weekly_simulado_answers')
      .select('id, correct_answer, explanation')
      .eq('simulado_id', sim.id)
      .not('selected_answer', 'is', null);
    
    const revealMap = new Map((revealed ?? []).map((r: any) => [r.id, r]));

    const list = (ans ?? []).map((a: any) => ({
      ...a,
      options: Array.isArray(a.options) ? a.options : [],
      correct_answer: revealMap.get(a.id)?.correct_answer ?? null,
      explanation: revealMap.get(a.id)?.explanation ?? null,
    }));
    setQuestions(list);

    // posiciona no primeiro não respondido
    const firstUnanswered = list.findIndex((q: Question) => !q.selected_answer);
    setCurrentIdx(firstUnanswered === -1 ? Math.max(0, list.length - 1) : firstUnanswered);
    setShowFeedback(firstUnanswered === -1);
    setLoading(false);
  };

  useEffect(() => { loadLatest(); /* eslint-disable-next-line */ }, [user]);

  const startNew = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-simulado', { body: { force: true } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success('Simulado pronto! Boa sorte.');
      await loadLatest();
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao gerar simulado');
    } finally {
      setGenerating(false);
    }
  };

  const current = questions[currentIdx];

  const choose = async (letter: string) => {
    if (!current || current.selected_answer || !simulado) return;

    // Correção feita no servidor: o gabarito só volta depois da resposta.
    const { data, error } = await supabase.rpc('answer_simulado_question' as never, {
      _answer_id: current.id,
      _selected_answer: letter,
    } as never);

    if (error) { toast.error('Não foi possível registrar sua resposta'); return; }

    const result = data as unknown as { is_correct: boolean; correct_answer: string; explanation: string | null };

    setQuestions((prev) => prev.map((q, i) => i === currentIdx
      ? { ...q, selected_answer: letter, is_correct: result.is_correct, correct_answer: result.correct_answer, explanation: result.explanation }
      : q));
    setShowFeedback(true);

    if (result.is_correct && user) {
      try { await supabase.rpc('increment_xp', { _user_id: user.id, _amount: 5 }); } catch {/* ignore */}
    }
  };

  const next = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setShowFeedback(false);
      return;
    }
    // Finaliza
    if (!simulado) return;
    const correct = questions.filter((q) => q.is_correct).length;
    const score = Math.round((correct / questions.length) * 10000) / 100;

    // diagnóstico por disciplina
    const diag: Record<string, { total: number; correct: number; accuracy: number }> = {};
    for (const q of questions) {
      const s = q.subject || 'Geral';
      if (!diag[s]) diag[s] = { total: 0, correct: 0, accuracy: 0 };
      diag[s].total += 1;
      if (q.is_correct) diag[s].correct += 1;
    }
    Object.keys(diag).forEach((k) => {
      diag[k].accuracy = Math.round((diag[k].correct / diag[k].total) * 10000) / 100;
    });

    await supabase.from('weekly_simulados').update({
      status: 'finished',
      correct_count: correct,
      score,
      diagnosis: diag,
      finished_at: new Date().toISOString(),
    }).eq('id', simulado.id);
    toast.success('Simulado concluído!');
    await loadLatest();
  };

  // ============ RENDERS ============

  if (loading) {
    return (
      <div className="min-h-dvh bg-background">
        <AppHeader />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Sem simulado → tela de início
  if (!simulado) {
    return (
      <div className="min-h-dvh bg-background">
        <AppHeader />
        <div className="container max-w-2xl mx-auto px-4 pt-8 pb-16">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mb-4 gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Card className="p-8 text-center bg-gradient-to-br from-purple-500/10 via-card to-card border-purple-500/30">
            <div className="h-16 w-16 rounded-2xl bg-purple-500/15 flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Simulado da Semana</h1>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              20 questões variadas de várias disciplinas. Ao final, você recebe um diagnóstico
              de fraquezas por matéria — para saber exatamente o que estudar.
            </p>
            <Button onClick={startNew} disabled={generating} size="lg" className="bg-purple-500 hover:bg-purple-600 text-white gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {generating ? 'Montando seu simulado...' : 'Começar agora'}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Simulado finalizado → diagnóstico
  if (simulado.status === 'finished') {
    return <ResultView simulado={simulado} questions={questions} onRestart={startNew} restarting={generating} navigate={navigate} />;
  }

  // Em andamento
  if (!current) return null;
  const answered = questions.filter((q) => q.selected_answer).length;
  const subjectColor = getSubjectColor(current.subject || 'Geral');

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <div className="container max-w-2xl mx-auto px-4 pt-6 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Sair
          </Button>
          <div className="text-xs font-mono text-muted-foreground">
            {currentIdx + 1} / {questions.length}
          </div>
        </div>
        <Progress value={(answered / questions.length) * 100} className="h-1.5 mb-6" />

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full" style={{ background: subjectColor }} />
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                  {current.subject || 'Geral'}
                </Badge>
              </div>
              <p className="text-base leading-relaxed mb-4 whitespace-pre-wrap">{current.question}</p>

              <div className="space-y-2">
                {current.options.map((opt, i) => {
                  const letter = LETTERS[i];
                  const selected = current.selected_answer === letter;
                  const correct = letter === current.correct_answer;
                  const reveal = !!current.selected_answer;
                  let cls = 'border-border hover:border-primary/40 hover:bg-primary/5';
                  if (reveal && correct) cls = 'border-emerald-500 bg-emerald-500/10';
                  else if (reveal && selected && !correct) cls = 'border-red-500 bg-red-500/10';
                  else if (selected) cls = 'border-primary bg-primary/10';
                  return (
                    <button
                      key={i}
                      disabled={!!current.selected_answer}
                      onClick={() => choose(letter)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-start gap-3 ${cls} disabled:cursor-default`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-mono font-bold">
                        {letter}
                      </span>
                      <span className="text-sm flex-1">{opt}</span>
                      {reveal && correct && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                      {reveal && selected && !correct && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {showFeedback && current.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-3 rounded-lg bg-muted/50 border text-sm"
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono font-semibold mb-1">
                    Explicação
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{current.explanation}</p>
                </motion.div>
              )}
            </Card>

            {showFeedback && (
              <Button onClick={next} size="lg" className="w-full gap-2 bg-purple-500 hover:bg-purple-600 text-white">
                {currentIdx === questions.length - 1 ? 'Finalizar e ver diagnóstico' : 'Próxima questão'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResultView({ simulado, questions, onRestart, restarting, navigate }: {
  simulado: Simulado; questions: Question[]; onRestart: () => void; restarting: boolean; navigate: (to: string) => void;
}) {
  const diagnosis = useMemo(() => {
    const entries = Object.entries(simulado.diagnosis || {}) as [string, { total: number; correct: number; accuracy: number }][];
    return entries.sort((a, b) => a[1].accuracy - b[1].accuracy);
  }, [simulado.diagnosis]);

  const weakest = diagnosis.filter(([, v]) => v.accuracy < 60);

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <div className="container max-w-2xl mx-auto px-4 pt-6 pb-16">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mb-4 gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        {/* Score */}
        <Card className="p-6 text-center mb-4 bg-gradient-to-br from-purple-500/10 via-card to-card border-purple-500/30">
          <Trophy className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Pontuação</p>
          <p className="text-5xl font-bold gradient-text mb-1">{simulado.score.toFixed(0)}%</p>
          <p className="text-sm text-muted-foreground">
            {simulado.correct_count} de {simulado.total_questions} acertos
          </p>
        </Card>

        {/* Diagnóstico */}
        <Card className="p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Diagnóstico por Disciplina</h2>
          </div>
          <div className="space-y-3">
            {diagnosis.map(([subject, stats]) => {
              const color = getSubjectColor(subject);
              const isWeak = stats.accuracy < 60;
              return (
                <div key={subject}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                      <span className="truncate font-medium">{subject}</span>
                      {isWeak && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                    </div>
                    <span className="text-xs font-mono text-muted-foreground shrink-0 ml-2">
                      {stats.correct}/{stats.total} • {stats.accuracy.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${stats.accuracy}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recomendações */}
        {weakest.length > 0 && (
          <Card className="p-5 mb-4 border-amber-500/40 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold">Onde focar agora</h2>
            </div>
            <ul className="space-y-2 text-sm">
              {weakest.map(([subject, stats]) => (
                <li key={subject} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>
                    Revise <strong>{subject}</strong> — você acertou apenas {stats.accuracy.toFixed(0)}%.
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Revisão das questões */}
        <Card className="p-5 mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3">Revisão</h2>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <details key={q.id} className="rounded-lg border p-3">
                <summary className="cursor-pointer flex items-center gap-2 text-sm">
                  {q.is_correct
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                  <span className="font-mono text-xs text-muted-foreground">{(i + 1).toString().padStart(2, '0')}</span>
                  <span className="truncate flex-1">{q.question}</span>
                </summary>
                <div className="mt-2 pl-6 text-xs space-y-1 text-muted-foreground">
                  <p>Sua resposta: <strong className={q.is_correct ? 'text-emerald-500' : 'text-red-500'}>{q.selected_answer || '—'}</strong></p>
                  <p>Resposta correta: <strong className="text-emerald-500">{q.correct_answer}</strong></p>
                  {q.explanation && <p className="mt-2 leading-relaxed">{q.explanation}</p>}
                </div>
              </details>
            ))}
          </div>
        </Card>

        <Button onClick={onRestart} disabled={restarting} size="lg" className="w-full gap-2 bg-purple-500 hover:bg-purple-600 text-white">
          {restarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Gerar novo simulado
        </Button>
      </div>
    </div>
  );
}
