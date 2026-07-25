import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, X, Target, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  title: string;
  event_time: string | null;
  event_type: string;
  subject: string | null;
  event_date: string;
}

/**
 * Banner mostrado quando o aluno tem prova/trabalho HOJE ou AMANHÃ.
 * Inclui CTA para ativar Modo Foco Prova.
 */
export function TodayExamBanner() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const dismissKey = `decode_exam_focus_dismissed_${todayStr}`;
    if (localStorage.getItem(dismissKey) === '1') {
      setDismissed(true);
      return;
    }

    let active = true;
    (async () => {
      const { data } = await supabase
        .from('calendar_events')
        .select('id,title,event_time,event_type,subject,event_date')
        .in('event_date', [todayStr, tomorrowStr])
        .in('event_type', ['prova', 'trabalho', 'entrega'])
        .order('event_date');
      if (active && data) setEvents(data as Event[]);
    })();
    return () => { active = false; };
  }, []);

  if (dismissed || events.length === 0) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEvents = events.filter(e => e.event_date === todayStr);
  const tomorrowEvents = events.filter(e => e.event_date !== todayStr);
  const isToday = todayEvents.length > 0;
  const primary = todayEvents[0] || tomorrowEvents[0];
  const totalCount = events.length;

  const handleDismiss = () => {
    localStorage.setItem(`decode_exam_focus_dismissed_${todayStr}`, '1');
    setDismissed(true);
  };

  const handleActivateFocus = () => {
    if (!primary) return;
    // Salva o foco em sessionStorage para o Dashboard reordenar e o app destacar
    sessionStorage.setItem('decode_exam_focus', JSON.stringify({
      subject: primary.subject || primary.title,
      eventId: primary.id,
      eventDate: primary.event_date,
    }));
    // Faz scroll até a seção de disciplinas para o aluno ver a matéria em destaque
    setTimeout(() => {
      document.getElementById('minhas-disciplinas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    // Re-renderiza forçando recarregar a página (abordagem simples e robusta)
    window.dispatchEvent(new Event('decode-exam-focus-changed'));
  };

  return (
    <div className={`mb-4 rounded-xl border-2 p-4 animate-fade-in relative ${
      isToday
        ? 'border-destructive/50 bg-destructive/10'
        : 'border-warning/50 bg-warning/10'
    }`}>
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-foreground/10 transition-colors"
        aria-label="Dispensar aviso"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
          isToday ? 'bg-destructive/20 animate-pulse' : 'bg-warning/20'
        }`}>
          <AlertCircle className={`h-5 w-5 ${isToday ? 'text-destructive' : 'text-warning'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${
            isToday ? 'text-destructive' : 'text-warning'
          }`}>
            {isToday
              ? `Você tem ${totalCount === 1 ? 'avaliação' : `${totalCount} avaliações`} HOJE`
              : `Avaliação AMANHÃ — hora de focar`}
          </p>
          <ul className="space-y-1 mb-3">
            {[...todayEvents, ...tomorrowEvents].map(ev => (
              <li key={ev.id} className="text-sm font-semibold text-foreground">
                • {ev.title}
                {ev.event_date !== todayStr && (
                  <span className="text-xs text-muted-foreground ml-1.5">(amanhã)</span>
                )}
                {ev.event_time && (
                  <span className="text-xs text-muted-foreground ml-1.5 inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {ev.event_time.slice(0, 5)}
                  </span>
                )}
                {ev.subject && (
                  <span className="text-xs text-muted-foreground ml-1.5">— {ev.subject}</span>
                )}
              </li>
            ))}
          </ul>
          {primary && (
            <Button
              size="sm"
              onClick={handleActivateFocus}
              className={`gap-1.5 text-xs h-8 ${
                isToday ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''
              }`}
            >
              <Target className="h-3.5 w-3.5" />
              Ativar Modo Foco Prova
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
