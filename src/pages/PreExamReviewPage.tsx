import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle, BookOpen, Brain, Calendar, ChevronRight, Flame,
  GraduationCap, Lightbulb, RotateCcw, Sparkles, Target,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { getSubjectColor } from '@/lib/subject-colors';

interface ReviewBundle {
  event: {
    id: string; title: string; event_date: string; event_type: string;
    subject: string | null; description: string | null; days_until: number;
  };
  weak_topics: Array<{ apostila_id: string; title: string; total: number; errors: number; accuracy: number }>;
  due_flashcards: Array<{ id: string; front: string; back: string; apostila_id: string | null }>;
  related_apostilas: Array<{ id: string; title: string; category: string; completed: boolean }>;
  ai_summary: string;
}

export default function PreExamReviewPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [bundle, setBundle] = useState<ReviewBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashFlipped, setFlashFlipped] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('pre-exam-review', {
          body: { eventId },
        });
        if (error) throw error;
        if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
        setBundle(data as ReviewBundle);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Erro ao carregar revisão';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  const reviewFlash = async (quality: 'again' | 'good' | 'easy') => {
    if (!bundle) return;
    const card = bundle.due_flashcards[flashIndex];
    if (!card) return;

    // SM-2 simplificado
    const qMap = { again: 1, good: 4, easy: 5 };
    const q = qMap[quality];
    const { data: existing } = await supabase
      .from('flashcards')
      .select('ease_factor,interval_days,repetitions')
      .eq('id', card.id)
      .maybeSingle();

    const ef = Math.max(1.3, (existing?.ease_factor ?? 2.5) + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    let reps = existing?.repetitions ?? 0;
    let intervalDays = existing?.interval_days ?? 0;
    if (q < 3) { reps = 0; intervalDays = 1; }
    else {
      reps += 1;
      if (reps === 1) intervalDays = 1;
      else if (reps === 2) intervalDays = 6;
      else intervalDays = Math.round(intervalDays * ef);
    }
    const next = new Date(); next.setDate(next.getDate() + intervalDays);

    await supabase.from('flashcards').update({
      ease_factor: ef, interval_days: intervalDays, repetitions: reps,
      last_reviewed: new Date().toISOString(), next_review: next.toISOString(),
    }).eq('id', card.id);

    setFlashFlipped(false);
    if (flashIndex + 1 < bundle.due_flashcards.length) {
      setFlashIndex(flashIndex + 1);
    } else {
      toast.success('Todos os flashcards revisados! 🎉');
      setBundle({ ...bundle, due_flashcards: [] });
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-background">
        <AppHeader />
        <div className="container max-w-5xl mx-auto p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-dvh bg-background">
        <AppHeader />
        <div className="container max-w-5xl mx-auto p-8 text-center">
          <p className="text-muted-foreground">Não foi possível carregar a revisão.</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">Voltar</Button>
        </div>
      </div>
    );
  }

  const { event, weak_topics, due_flashcards, related_apostilas, ai_summary } = bundle;
  const color = getSubjectColor(event.subject || event.title);
  const urgent = event.days_until <= 3;
  const currentFlash = due_flashcards[flashIndex];

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <div className="container max-w-5xl mx-auto p-4 pb-24 space-y-5">
        {/* HERO */}
        <Card
          className="p-6 border-2 relative overflow-hidden"
          style={{ borderColor: `${color}66`, background: `linear-gradient(135deg, ${color}10, transparent)` }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: color }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[10px]" style={{ borderColor: color, color }}>
                MODO REVISÃO
              </Badge>
              {urgent && (
                <Badge className="text-[10px] bg-destructive/15 text-destructive border-destructive/40 border animate-pulse">
                  <Flame className="h-3 w-3 mr-1" /> URGENTE
                </Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">{event.title}</h1>
            {event.subject && <p className="text-sm text-muted-foreground mt-1">{event.subject}</p>}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {format(new Date(event.event_date + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {event.days_until === 0 ? 'HOJE' : `em ${event.days_until} dia${event.days_until > 1 ? 's' : ''}`}
              </Badge>
            </div>
          </div>
        </Card>

        {/* TÓPICOS FRACOS */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-destructive/15 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Seus pontos fracos</h2>
              <p className="text-xs text-muted-foreground">Onde você mais errou — revise primeiro</p>
            </div>
          </div>
          {weak_topics.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Você ainda não respondeu exercícios desta disciplina. Comece pelas apostilas abaixo.
            </p>
          ) : (
            <div className="space-y-2">
              {weak_topics.map((t) => {
                const pct = Math.round(t.accuracy * 100);
                return (
                  <button
                    key={t.apostila_id}
                    onClick={() => navigate(`/exercises/${t.apostila_id}`)}
                    className="w-full text-left p-3 rounded-lg border border-border/60 hover:border-primary/40 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">{t.title}</span>
                      <span className={`text-xs font-bold tabular-nums ${pct < 50 ? 'text-destructive' : pct < 70 ? 'text-warning' : 'text-success'}`}>
                        {pct}%
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {t.errors} erro{t.errors !== 1 ? 's' : ''} em {t.total} respostas · toque para refazer
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* FLASHCARDS ATRASADOS */}
        {due_flashcards.length > 0 && currentFlash && (
          <Card className="p-5 bg-gradient-to-br from-primary/5 via-card to-card border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">Flashcards atrasados</h2>
                  <p className="text-xs text-muted-foreground">Revisão espaçada — {flashIndex + 1}/{due_flashcards.length}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setFlashFlipped(!flashFlipped)}
              className="w-full min-h-[140px] rounded-lg border-2 border-dashed border-primary/30 p-5 text-center hover:border-primary/60 transition-colors flex items-center justify-center"
            >
              <p className="text-sm font-medium leading-relaxed">
                {flashFlipped ? currentFlash.back : currentFlash.front}
              </p>
            </button>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              {flashFlipped ? 'Como foi seu desempenho?' : 'Toque para ver a resposta'}
            </p>
            {flashFlipped && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => reviewFlash('again')} className="text-xs border-destructive/40 text-destructive hover:bg-destructive/10">
                  <RotateCcw className="h-3 w-3 mr-1" /> De novo
                </Button>
                <Button size="sm" variant="outline" onClick={() => reviewFlash('good')} className="text-xs">
                  Bom
                </Button>
                <Button size="sm" variant="outline" onClick={() => reviewFlash('easy')} className="text-xs border-success/40 text-success hover:bg-success/10">
                  Fácil
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* RESUMO IA */}
        {ai_summary && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-warning/15 flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-warning" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">Pontos-chave da prova</h2>
                <p className="text-xs text-muted-foreground">Resumo gerado com base no material</p>
              </div>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0.5">
              <ReactMarkdown>{ai_summary}</ReactMarkdown>
            </div>
          </Card>
        )}

        {/* APOSTILAS RELACIONADAS */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-accent/15 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-accent-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Material da disciplina</h2>
              <p className="text-xs text-muted-foreground">Apostilas relacionadas a esta prova</p>
            </div>
          </div>
          {related_apostilas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma apostila publicada para esta disciplina ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {related_apostilas.map((a) => (
                <button
                  key={a.id}
                  onClick={() => navigate(`/apostila/${a.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/40 transition-colors group"
                >
                  <span
                    className="w-1.5 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getSubjectColor(a.category) }}
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                      {a.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{a.category}</p>
                  </div>
                  {a.completed && (
                    <Badge variant="secondary" className="text-[9px] bg-success/15 text-success border-success/30">
                      ✓ Lida
                    </Badge>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* AÇÕES FINAIS */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/simulado')}
            className="h-12 gap-2"
          >
            <Target className="h-4 w-4" /> Fazer simulado
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            className="h-12 gap-2"
          >
            <GraduationCap className="h-4 w-4" /> Voltar ao painel
          </Button>
        </div>
      </div>
    </div>
  );
}
