import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, ArrowLeft, RotateCcw, Check, X, Wand2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { sm2, formatNextReview, type SRSQuality } from '@/lib/srs';

type Card = {
  id: string;
  front: string;
  back: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review: string | null;
  apostila_id: string | null;
};

export default function ReviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const gamification = useGamification();
  const [queue, setQueue] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [initialDue, setInitialDue] = useState(0);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .or(`next_review.lte.${new Date().toISOString()},next_review.is.null`)
        .order('next_review', { ascending: true, nullsFirst: true })
        .limit(50);
      const cards = (data || []) as Card[];
      setQueue(cards);
      setInitialDue(cards.length);
      setLoading(false);
    })();
  }, [user]);

  const current = queue[idx];
  const done = !loading && (queue.length === 0 || idx >= queue.length);

  const progressPct = useMemo(() => {
    if (initialDue === 0) return 0;
    return Math.min(100, Math.round((reviewedCount / initialDue) * 100));
  }, [reviewedCount, initialDue]);

  const handleAnswer = async (quality: SRSQuality) => {
    if (!current || working) return;
    setWorking(true);
    const result = sm2(
      {
        ease_factor: current.ease_factor || 2.5,
        interval_days: current.interval_days || 0,
        repetitions: current.repetitions || 0,
      },
      quality,
    );
    const { error } = await supabase
      .from('flashcards')
      .update({
        ease_factor: result.ease_factor,
        interval_days: result.interval_days,
        repetitions: result.repetitions,
        next_review: result.next_review,
        last_reviewed: new Date().toISOString(),
        difficulty: quality < 3 ? 0 : quality === 3 ? 1 : 2,
      })
      .eq('id', current.id);

    if (error) {
      toast.error('Erro ao salvar revisão');
      setWorking(false);
      return;
    }

    // Toast de feedback discreto
    toast.success(`Próxima revisão em ${formatNextReview(result.next_review)}`);

    // Ganha XP só para acertos (4 ou 5) — evita farming
    if (quality >= 4) {
      try { await gamification.addXP(2); } catch { /* silencioso */ }
    }

    setReviewedCount((c) => c + 1);
    setFlipped(false);
    setIdx((i) => i + 1);
    setWorking(false);
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-background">
        <AppHeader />
        <main className="max-w-2xl mx-auto p-6">
          <div className="animate-pulse h-64 rounded-xl bg-muted/30" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4 text-primary" />
            Revisão Inteligente
          </div>
        </div>

        {!done && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{reviewedCount} de {initialDue} revisados</span>
              <span>{queue.length - idx} restantes</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        )}

        {done ? (
          <Card className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold">
              {initialDue === 0 ? 'Nenhum cartão para revisar agora' : 'Revisão concluída!'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {initialDue === 0
                ? 'Volte mais tarde — os cartões aparecem aqui no dia certo conforme o algoritmo SM-2.'
                : `Você revisou ${reviewedCount} cartão(ões). Volte amanhã para a próxima rodada.`}
            </p>
            <Button onClick={() => navigate('/dashboard')} className="gap-1.5 gradient-primary text-primary-foreground">
              <Wand2 className="h-4 w-4" /> Voltar ao Dashboard
            </Button>
          </Card>
        ) : current ? (
          <Card className="p-6 sm:p-8 space-y-6 min-h-[320px] flex flex-col">
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="flex-1 text-left space-y-3 group"
            >
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                {flipped ? 'Resposta' : 'Pergunta'}
              </p>
              <p className="text-lg sm:text-xl font-medium leading-relaxed">
                {flipped ? current.back : current.front}
              </p>
              {!flipped && (
                <p className="text-xs text-muted-foreground italic mt-4 group-hover:text-primary smooth-all">
                  Toque para ver a resposta
                </p>
              )}
            </button>

            {flipped ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-in">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={working}
                  onClick={() => handleAnswer(0)}
                  className="border-destructive/40 text-destructive hover:bg-destructive/5 flex-col h-auto py-2"
                >
                  <X className="h-4 w-4" />
                  <span className="text-[11px] font-semibold mt-1">Errei</span>
                  <span className="text-[9px] text-muted-foreground">10 min</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={working}
                  onClick={() => handleAnswer(3)}
                  className="border-warning/40 hover:bg-warning/5 flex-col h-auto py-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-[11px] font-semibold mt-1">Difícil</span>
                  <span className="text-[9px] text-muted-foreground">~1 d</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={working}
                  onClick={() => handleAnswer(4)}
                  className="border-primary/40 text-primary hover:bg-primary/5 flex-col h-auto py-2"
                >
                  <Check className="h-4 w-4" />
                  <span className="text-[11px] font-semibold mt-1">Bom</span>
                  <span className="text-[9px] text-muted-foreground">+2 XP</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={working}
                  onClick={() => handleAnswer(5)}
                  className="border-success/40 text-success hover:bg-success/5 flex-col h-auto py-2"
                >
                  <Wand2 className="h-4 w-4" />
                  <span className="text-[11px] font-semibold mt-1">Fácil</span>
                  <span className="text-[9px] text-muted-foreground">+2 XP</span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setFlipped(true)}
                className="w-full gradient-primary text-primary-foreground"
              >
                Mostrar resposta
              </Button>
            )}
          </Card>
        ) : null}
      </main>
    </div>
  );
}
