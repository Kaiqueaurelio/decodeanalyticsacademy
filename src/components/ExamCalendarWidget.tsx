import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Event {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  event_type: string;
  subject: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  prova: 'Prova', trabalho: 'Trabalho', atividade: 'Atividade',
  seminario: 'Seminário', entrega: 'Entrega', aula: 'Aula',
};
const TYPE_STYLE: Record<string, string> = {
  prova: 'bg-destructive/15 text-destructive border-destructive/30',
  trabalho: 'bg-warning/15 text-warning border-warning/30',
  atividade: 'bg-primary/15 text-primary border-primary/30',
  seminario: 'bg-accent/15 text-accent-foreground border-accent/30',
  entrega: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  aula: 'bg-muted-foreground/15 text-muted-foreground border-border',
};

export function ExamCalendarWidget() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from('calendar_events')
        .select('id,title,event_date,event_time,event_type,subject')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(20);
      if (active && data) setEvents(data as Event[]);
    })();

    const channel = supabase
      .channel(`calendar-events-widget-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, () => {
        supabase.from('calendar_events')
          .select('id,title,event_date,event_time,event_type,subject')
          .gte('event_date', new Date().toISOString().slice(0, 10))
          .order('event_date', { ascending: true })
          .limit(20)
          .then(({ data }) => { if (active && data) setEvents(data as Event[]); });
      })
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (events.length === 0) return;
    const notifiedRaw = sessionStorage.getItem('decode_exam_notified_ids');
    const notified = new Set<string>(notifiedRaw ? JSON.parse(notifiedRaw) : []);
    const newNotified = new Set(notified);
    events.forEach(ev => {
      if (ev.event_type !== 'prova' && ev.event_type !== 'trabalho' && ev.event_type !== 'entrega') return;
      const d = new Date(ev.event_date + 'T23:59:59');
      if (isPast(d) || notified.has(ev.id)) return;
      const days = differenceInDays(d, new Date());
      if (days <= 3) {
        newNotified.add(ev.id);
        if (days === 0) toast.error(`Hoje: "${ev.title}"!`, { duration: 8000 });
        else toast.warning(`"${ev.title}" em ${days} dia${days > 1 ? 's' : ''}!`, { duration: 6000 });
      }
    });
    if (newNotified.size > notified.size) {
      sessionStorage.setItem('decode_exam_notified_ids', JSON.stringify([...newNotified]));
    }
  }, [events]);

  return (
    <Card className="p-5 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" /> Calendário Acadêmico
        </h3>
      </div>
      {events.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Nenhum evento agendado</p>
      ) : (
        <div className="space-y-2">
          {events.slice(0, 8).map((ev, idx) => {
            const d = new Date(ev.event_date + 'T23:59:59');
            const days = differenceInDays(d, new Date());
            return (
              <div
                key={ev.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 animate-card-enter ${
                  days <= 3 ? 'border-destructive/30 bg-destructive/5' :
                  days <= 7 ? 'border-warning/30 bg-warning/5' :
                  'border-border/30 bg-card hover:bg-muted/20'
                }`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${TYPE_STYLE[ev.event_type] ?? ''}`}>
                      {TYPE_LABEL[ev.event_type] ?? ev.event_type}
                    </Badge>
                    <p className="text-xs font-medium truncate">{ev.title}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {format(new Date(ev.event_date + 'T12:00:00'), "d 'de' MMM", { locale: ptBR })}
                    {ev.event_time && ` · ${ev.event_time.slice(0, 5)}`}
                    {ev.subject && ` · ${ev.subject}`}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0 ${
                  days <= 3 ? 'bg-destructive/10 text-destructive' :
                  days <= 7 ? 'bg-warning/10 text-warning' :
                  'bg-primary/10 text-primary'
                }`}>
                  <Clock className="h-2.5 w-2.5" />
                  {days === 0 ? 'Hoje!' : `${days}d`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
