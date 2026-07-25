/**
 * StudyNowDialog — Modo "Estudar Agora" com sessão de foco Pomodoro
 * + lista de pendências (apostilas que faltam concluir).
 *
 * UX:
 *  - Topo: apostila destacada (próxima a estudar), com badge do motivo e barra
 *    de progresso. Botão grande "Iniciar foco 25 min".
 *  - Lista rolável de pendências priorizadas (prova → favorita → em andamento → demais).
 *    Cada item permite trocar a seleção ou ir direto pra ela.
 *  - Seletor de duração Pomodoro (15 / 25 / 45 min).
 *  - Atalho para revisar flashcards pendentes, se houver.
 *
 * Ao iniciar: dispara `decode-pomodoro-start` (já escutado pelo PomodoroTimer
 * global) e navega para a apostila selecionada.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePendingApostilas, type PendingApostila } from '@/hooks/usePendingApostilas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Wand2,
  Timer,
  Layers,
  BookOpen,
  Play,
  Loader2,
  AlertCircle,
  ArrowRight,
  Heart,
  Flame,
  CalendarClock,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  trigger?: React.ReactNode;
}

const DURATIONS = [15, 25, 45] as const;
type Duration = (typeof DURATIONS)[number];

function ReasonIcon({ item }: { item: PendingApostila }) {
  if (item.examSubject) return <CalendarClock className="h-3 w-3" />;
  if (item.isFavorite) return <Heart className="h-3 w-3 fill-current" />;
  if (item.hasOpened) return <Flame className="h-3 w-3" />;
  return <BookOpen className="h-3 w-3" />;
}

export function StudyNowDialog({ trigger }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { items, loading, reload } = usePendingApostilas(15);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [duration, setDuration] = useState<Duration>(25);
  const [dueFlashcards, setDueFlashcards] = useState(0);

  // Recarrega quando abre
  useEffect(() => {
    if (!open || !user) return;
    void reload();
    void loadFlashcards();
  }, [open, user]);

  // Auto-seleciona a primeira pendência ao abrir / recarregar
  useEffect(() => {
    if (!open) return;
    if (items.length > 0 && !items.find((i) => i.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [open, items, selectedId]);

  const loadFlashcards = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('flashcards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('next_review', new Date().toISOString());
    setDueFlashcards(count || 0);
  };

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) || items[0] || null,
    [items, selectedId],
  );

  const startSession = () => {
    if (!selected) return;
    try {
      window.dispatchEvent(
        new CustomEvent('decode-pomodoro-start', {
          detail: { duration, apostila_id: selected.id },
        }),
      );
    } catch {
      /* noop */
    }
    toast.success(`Foco de ${duration} min iniciado — bons estudos!`, {
      description: selected.title,
    });
    setOpen(false);
    navigate(`/apostila/${selected.id}`);
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
      <Wand2 className="h-4 w-4" />
      Estudar agora
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Modo Estudar Agora
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Sessão de foco com lista de apostilas que faltam concluir.
          </p>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Montando sua sessão...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-primary/50" />
            <p>
              <strong className="block text-foreground">Tudo em dia.</strong>
              Você concluiu todas as apostilas disponíveis.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Apostila selecionada */}
            {selected && (
              <div className="p-4 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 border-b">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="secondary" className="text-[10px] mb-1 gap-1">
                      <ReasonIcon item={selected} />
                      {selected.reason}
                    </Badge>
                    <p className="text-sm font-semibold line-clamp-2 leading-snug">
                      {selected.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {selected.category || 'Geral'}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={selected.progress} className="h-1.5 flex-1" />
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {selected.progress}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seletor de duração */}
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Timer className="h-3 w-3" /> Duração da sessão
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={cn(
                          'py-2 rounded-md text-xs font-medium border transition-all',
                          duration === d
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-card hover:bg-muted/60 border-border text-foreground/80',
                        )}
                      >
                        {d} min
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={startSession}
                  className="w-full mt-3 gap-2 gradient-primary shadow-md"
                  size="lg"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Iniciar foco · {duration} min
                </Button>
              </div>
            )}

            {/* Flashcards atalho */}
            {dueFlashcards > 0 && (
              <button
                onClick={reviewFlashcards}
                className="px-4 py-2.5 border-b flex items-center gap-2.5 hover:bg-muted/50 transition-colors text-left"
              >
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium flex-1">
                  {dueFlashcards} flashcard{dueFlashcards > 1 ? 's' : ''} para revisar antes
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}

            {/* Lista de pendências */}
            <div className="p-4 pb-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Pendentes ({items.length})
                </span>
                <span className="text-muted-foreground/70 normal-case">toque para escolher</span>
              </p>
              <ScrollArea className="h-[220px] -mx-1 pr-2">
                <div className="space-y-1.5 px-1">
                  {items.map((item) => {
                    const active = item.id === selected?.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={cn(
                          'w-full p-2.5 rounded-lg border text-left transition-all flex items-center gap-2.5',
                          active
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:bg-muted/40',
                        )}
                      >
                        <div
                          className={cn(
                            'h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 text-[11px]',
                            item.priority === 1
                              ? 'bg-destructive/15 text-destructive'
                              : item.priority === 2
                              ? 'bg-pink-500/15 text-pink-500'
                              : item.priority === 3
                              ? 'bg-accent/15 text-accent'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          <ReasonIcon item={item} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium line-clamp-1">{item.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge
                              variant="outline"
                              className="text-[9px] py-0 px-1 h-4 leading-none"
                            >
                              {item.reason}
                            </Badge>
                            {item.progress > 0 && (
                              <span className="text-[9px] text-muted-foreground tabular-nums">
                                {item.progress}%
                              </span>
                            )}
                          </div>
                        </div>
                        {active && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <p className="text-[10px] text-center text-muted-foreground pb-3 px-4">
              Você será levado à apostila e o Pomodoro começa automaticamente. +10 XP ao concluir.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
