/**
 * StudyNowDialog — Modo "Estudar agora" em 1 clique.
 *
 * Monta uma sessão de estudo guiada de ~25 min:
 *  1. Sugere uma apostila baseada em (prioridade): prova próxima → última favorita → última aberta → aleatória.
 *  2. Mostra flashcards pendentes (até 5) prontos para revisão rápida.
 *  3. Liga 1 ciclo de Pomodoro de 25 min imediatamente.
 *
 * Não substitui as ferramentas existentes — é um "atalho orquestrador" que
 * encaminha o aluno pra apostila + abre o Pomodoro flutuante via evento global
 * que o componente PomodoroTimer já escuta (decode-pomodoro-start).
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useExamFocus } from '@/hooks/useExamFocus';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Timer, Layers, BookOpen, Play, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface SuggestedApostila {
  id: string;
  title: string;
  category: string | null;
  reason: string;
}

interface Props {
  trigger?: React.ReactNode;
}

export function StudyNowDialog({ trigger }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const examFocus = useExamFocus();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apostila, setApostila] = useState<SuggestedApostila | null>(null);
  const [dueFlashcards, setDueFlashcards] = useState(0);

  useEffect(() => {
    if (!open || !user) return;
    void loadSuggestion();
  }, [open, user, examFocus?.subject]);

  const loadSuggestion = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1) Try matching exam focus subject
      let chosen: SuggestedApostila | null = null;

      if (examFocus?.subject) {
        const { data } = await supabase
          .from('apostilas')
          .select('id, title, category')
          .eq('published', true)
          .ilike('category', `%${examFocus.subject}%`)
          .limit(1);
        if (data && data.length > 0) {
          chosen = {
            id: data[0].id,
            title: data[0].title,
            category: data[0].category,
            reason: examFocus.daysUntil === 0
              ? `Prova hoje de ${examFocus.subject}`
              : `Prova em ${examFocus.daysUntil}d de ${examFocus.subject}`,
          };
        }
      }

      // 2) Last favorite
      if (!chosen) {
        const { data: fav } = await supabase
          .from('apostila_favorites')
          .select('apostila_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (fav && fav.length > 0) {
          const { data: ap } = await supabase
            .from('apostilas')
            .select('id, title, category')
            .eq('id', fav[0].apostila_id)
            .eq('published', true)
            .maybeSingle();
          if (ap) {
            chosen = { id: ap.id, title: ap.title, category: ap.category, reason: 'Sua apostila favorita' };
          }
        }
      }

      // 3) Last opened (via apostila_chats)
      if (!chosen) {
        const { data: chats } = await supabase
          .from('apostila_chats')
          .select('apostila_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (chats && chats.length > 0) {
          const { data: ap } = await supabase
            .from('apostilas')
            .select('id, title, category')
            .eq('id', chats[0].apostila_id)
            .eq('published', true)
            .maybeSingle();
          if (ap) {
            chosen = { id: ap.id, title: ap.title, category: ap.category, reason: 'Você estava aqui há pouco' };
          }
        }
      }

      // 4) Fallback: random recent published apostila
      if (!chosen) {
        const { data } = await supabase
          .from('apostilas')
          .select('id, title, category')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(1);
        if (data && data.length > 0) {
          chosen = { id: data[0].id, title: data[0].title, category: data[0].category, reason: 'Sugestão para hoje' };
        }
      }

      setApostila(chosen);

      // Flashcards due now
      const { count } = await supabase
        .from('flashcards')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lte('next_review', new Date().toISOString());
      setDueFlashcards(count || 0);
    } catch (e) {
      console.warn('[StudyNow] load error', e);
    } finally {
      setLoading(false);
    }
  };

  const startSession = () => {
    if (!apostila) return;
    // Dispara o pomodoro global (PomodoroTimer escuta esse evento se estiver montado).
    try {
      window.dispatchEvent(
        new CustomEvent('decode-pomodoro-start', {
          detail: { duration: 25, apostila_id: apostila.id },
        }),
      );
    } catch {
      /* noop */
    }
    toast.success('Sessão iniciada — bons estudos!');
    setOpen(false);
    navigate(`/apostila/${apostila.id}`);
  };

  const reviewFlashcards = () => {
    setOpen(false);
    navigate('/dashboard#flashcards');
    setTimeout(() => {
      document.getElementById('flashcards')?.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  };

  const defaultTrigger = (
    <Button size="lg" className="gap-2 gradient-primary shadow-lg hover:shadow-primary/40">
      <Sparkles className="h-4 w-4" />
      Estudar agora
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Sua sessão em 1 clique
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Montando sua sessão...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Apostila sugerida */}
            {apostila ? (
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="secondary" className="text-[10px] mb-1">{apostila.reason}</Badge>
                    <p className="text-sm font-semibold line-clamp-2">{apostila.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{apostila.category || 'Geral'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-dashed text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Nenhuma apostila disponível ainda.
              </div>
            )}

            {/* Pomodoro */}
            <div className="p-3 rounded-lg border flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
                <Timer className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Pomodoro 25 min</p>
                <p className="text-[11px] text-muted-foreground">Foco cronometrado · +10 XP ao concluir</p>
              </div>
            </div>

            {/* Flashcards pendentes */}
            {dueFlashcards > 0 && (
              <button
                onClick={reviewFlashcards}
                className="w-full p-3 rounded-lg border flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{dueFlashcards} flashcard{dueFlashcards > 1 ? 's' : ''} para revisar</p>
                  <p className="text-[11px] text-muted-foreground">Toque para revisar antes</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            )}

            <Button
              onClick={startSession}
              disabled={!apostila}
              className="w-full gap-2 gradient-primary"
              size="lg"
            >
              <Play className="h-4 w-4" />
              Começar sessão
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
              Você será levado à apostila e o Pomodoro inicia automaticamente.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
