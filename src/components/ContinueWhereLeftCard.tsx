/**
 * ContinueWhereLeftCard — destaque do último conteúdo estudado.
 * Mostra progresso e leva direto ao ponto exato onde o aluno parou.
 * Esconde silenciosamente quando não há histórico.
 */
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useContinueWhereLeft, type ContinueItem } from '@/hooks/useContinueWhereLeft';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Library, MessageCircle, StickyNote, Timer, ArrowRight, History } from 'lucide-react';

const reasonMeta: Record<string, { icon: typeof BookOpen; label: string }> = {
  chat: { icon: MessageCircle, label: 'Tirou uma dúvida' },
  annotation: { icon: StickyNote, label: 'Fez anotação' },
  pomodoro: { icon: Timer, label: 'Estudou com Pomodoro' },
  reading: { icon: Library, label: 'Estava lendo' },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `há ${d} d`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function ContinueWhereLeftCard() {
  const navigate = useNavigate();
  const { items, loading } = useContinueWhereLeft(1);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5" aria-label="Carregando última leitura">
        <div className="h-4 w-40 bg-muted rounded animate-pulse mb-4" />
        <div className="h-7 w-2/3 bg-muted/70 rounded animate-pulse mb-5" />
        <div className="h-2 w-full bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (items.length === 0) return null;

  const item = items[0];
  const progress = Math.max(0, Math.min(100, Math.round(item.progress || 0)));
  const meta = reasonMeta[item.reason] || reasonMeta.reading;
  const ContextIcon = meta.icon;

  return (
    <section className="relative overflow-hidden rounded-lg border border-primary/25 bg-card p-5 sm:p-6" aria-labelledby="continue-title">
      <div className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            {item.kind === 'book' ? <Library className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-primary">
              <History className="h-3.5 w-3.5" />
              <span id="continue-title" className="uppercase">Continue de onde parou</span>
              <span className="text-muted-foreground">· {relativeTime(item.lastAt)}</span>
            </div>
            <h2 className="truncate text-lg font-bold text-foreground sm:text-xl">{item.title}</h2>
            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <ContextIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {item.kind === 'apostila' ? (item.lessonTitle || item.category || meta.label) : (item.category || meta.label)}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[300px]">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Progresso da apostila</span>
            <span className="font-bold text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2.5" aria-label={`${progress}% concluído`} />
          {item.kind === 'apostila' && item.totalLessons ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {item.completedLessons || 0} de {item.totalLessons} tópicos concluídos
            </p>
          ) : null}
        </div>

        <Button className="h-11 shrink-0 gap-2 px-5 font-semibold" onClick={() => navigate(item.href)}>
          Retomar leitura
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
