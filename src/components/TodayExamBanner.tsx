import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, X } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  event_time: string | null;
  event_type: string;
  subject: string | null;
}

/**
 * Persistent banner shown when the user has a prova/trabalho/entrega TODAY.
 * Dismissable per-day via localStorage.
 */
export function TodayExamBanner() {
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const dismissKey = `decode_today_exam_dismissed_${today}`;
    if (localStorage.getItem(dismissKey) === '1') {
      setDismissed(true);
      return;
    }

    let active = true;
    (async () => {
      const { data } = await supabase
        .from('calendar_events')
        .select('id,title,event_time,event_type,subject')
        .eq('event_date', today)
        .in('event_type', ['prova', 'trabalho', 'entrega']);
      if (active && data) setTodayEvents(data as Event[]);
    })();
    return () => { active = false; };
  }, []);

  if (dismissed || todayEvents.length === 0) return null;

  const handleDismiss = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`decode_today_exam_dismissed_${today}`, '1');
    setDismissed(true);
  };

  return (
    <div className="mb-4 rounded-xl border-2 border-destructive/50 bg-destructive/10 p-4 animate-fade-in relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-destructive/20 transition-colors"
        aria-label="Dispensar aviso"
      >
        <X className="h-3.5 w-3.5 text-destructive" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="h-9 w-9 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 animate-pulse">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-destructive mb-1">
            🚨 Você tem {todayEvents.length === 1 ? 'avaliação' : `${todayEvents.length} avaliações`} HOJE
          </p>
          <ul className="space-y-1">
            {todayEvents.map(ev => (
              <li key={ev.id} className="text-sm font-semibold text-foreground">
                • {ev.title}
                {ev.event_time && (
                  <span className="text-xs text-muted-foreground ml-1.5">
                    às {ev.event_time.slice(0, 5)}
                  </span>
                )}
                {ev.subject && (
                  <span className="text-xs text-muted-foreground ml-1.5">— {ev.subject}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
