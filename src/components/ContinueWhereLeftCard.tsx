/**
 * ContinueWhereLeftCard — cartão "Continue de onde parou" com até 3 itens.
 * Mostra apostilas e livros recentes; cada linha leva direto pro recurso.
 * Esconde silenciosamente quando não há histórico.
 */
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useContinueWhereLeft, type ContinueItem } from '@/hooks/useContinueWhereLeft';
import { BookOpen, Library, MessageCircle, StickyNote, Timer, ChevronRight, History } from 'lucide-react';

const reasonMeta: Record<string, { icon: typeof BookOpen; label: string }> = {
  chat: { icon: MessageCircle, label: 'Conversou com a IA' },
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

function ItemRow({ item, onOpen }: { item: ContinueItem; onOpen: () => void }) {
  const meta = reasonMeta[item.reason] || reasonMeta.reading;
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors text-left group"
    >
      <span className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        {item.kind === 'book' ? <Library className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
          <Icon className="h-3 w-3" />
          <span className="truncate">{meta.label}</span>
          <span>·</span>
          <span>{relativeTime(item.lastAt)}</span>
          {item.kind === 'book' && typeof item.progress === 'number' && item.progress > 0 && (
            <>
              <span>·</span>
              <span>{Math.round(item.progress)}%</span>
            </>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

export function ContinueWhereLeftCard() {
  const navigate = useNavigate();
  const { items, loading } = useContinueWhereLeft(3);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="h-5 w-40 bg-muted rounded animate-pulse mb-3" />
        <div className="space-y-2">
          {[0, 1, 2].map(i => <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />)}
        </div>
      </Card>
    );
  }

  if (items.length === 0) return null;

  return (
    <Card className="p-3 sm:p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Continue de onde parou</h3>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/biblioteca')}
        >
          Biblioteca
        </Button>
      </div>
      <div className="space-y-1">
        {items.map(item => (
          <ItemRow key={`${item.kind}-${item.id}`} item={item} onOpen={() => navigate(item.href)} />
        ))}
      </div>
    </Card>
  );
}
