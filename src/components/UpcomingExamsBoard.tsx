import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  event_type: string;
  subject: string | null;
  description: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  prova: 'Prova', trabalho: 'Trabalho', atividade: 'Atividade',
  seminario: 'Seminário', entrega: 'Entrega', aula: 'Aula',
};

const TYPE_BADGE: Record<string, string> = {
  prova: 'bg-destructive/10 text-destructive border-destructive/30',
  trabalho: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30',
  atividade: 'bg-primary/10 text-primary border-primary/30',
  seminario: 'bg-accent text-accent-foreground border-accent/30',
  entrega: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  aula: 'bg-muted text-muted-foreground border-border',
};

/**
 * Shows upcoming exams/work as announcement-style cards.
 * Sincroniza calendário acadêmico com o mural de avisos.
 * Filters: only events in the next 14 days, prioritizing prova/trabalho/entrega.
 */
export function UpcomingExamsBoard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('event_date', today)
        .in('event_type', ['prova', 'trabalho', 'entrega'])
        .order('event_date', { ascending: true })
        .limit(5);
      if (active) {
        setEvents((data as Event[]) || []);
        setLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel('upcoming-exams-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, load)
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, []);

  if (loading || events.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
        <h2 className="font-display text-sm font-bold uppercase tracking-wider">
          Próximas avaliações
        </h2>
      </div>

      <div className="grid gap-2">
        {events.map(ev => {
          const d = new Date(ev.event_date + 'T23:59:59');
          const days = differenceInDays(d, new Date());
          const urgent = days <= 3;

          return (
            <Card
              key={ev.id}
              className={`animate-fade-in transition-shadow hover:shadow-md ${
                urgent ? 'border-destructive/40 bg-destructive/5' : ''
              }`}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex flex-col items-center justify-center shrink-0 ${
                  urgent ? 'bg-destructive/15 text-destructive' : 'bg-primary/10 text-primary'
                }`}>
                  <Calendar className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${TYPE_BADGE[ev.event_type] ?? ''}`}>
                      {TYPE_LABEL[ev.event_type] ?? ev.event_type}
                    </Badge>
                    {ev.subject && (
                      <span className="text-[10px] text-muted-foreground truncate">{ev.subject}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold truncate">{ev.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {format(new Date(ev.event_date + 'T12:00:00'), "EEEE, d 'de' MMM", { locale: ptBR })}
                    {ev.event_time && ` · ${ev.event_time.slice(0, 5)}`}
                  </p>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0 ${
                  urgent ? 'bg-destructive text-destructive-foreground' : 'bg-primary/10 text-primary'
                }`}>
                  <Clock className="h-2.5 w-2.5" />
                  {days === 0 ? 'HOJE!' : `${days}d`}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
