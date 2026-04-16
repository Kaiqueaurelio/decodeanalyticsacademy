import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ExamFocus {
  subject: string;
  eventId: string;
  eventDate: string;
  daysUntil: number; // 0 = hoje, 1 = amanhã
}

/**
 * Detecta automaticamente provas em até 1 dia e expõe a "matéria foco".
 * Pode ser ativado manualmente via banner (sessionStorage 'decode_exam_focus')
 * ou ser detectado automaticamente a partir de calendar_events.
 */
export function useExamFocus(): ExamFocus | null {
  const [focus, setFocus] = useState<ExamFocus | null>(null);

  useEffect(() => {
    let active = true;

    const compute = async () => {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);

      // Manual override via sessionStorage
      try {
        const raw = sessionStorage.getItem('decode_exam_focus');
        if (raw) {
          const parsed = JSON.parse(raw);
          const days = parsed.eventDate === todayStr ? 0 : parsed.eventDate === tomorrowStr ? 1 : -1;
          if (days >= 0 && active) {
            setFocus({ ...parsed, daysUntil: days });
            return;
          }
        }
      } catch { /* ignore */ }

      // Auto-detect
      const { data } = await supabase
        .from('calendar_events')
        .select('id,title,subject,event_date')
        .in('event_date', [todayStr, tomorrowStr])
        .in('event_type', ['prova', 'trabalho', 'entrega'])
        .order('event_date')
        .limit(1);

      if (!active) return;
      if (data && data.length > 0) {
        const ev = data[0];
        setFocus({
          subject: ev.subject || ev.title,
          eventId: ev.id,
          eventDate: ev.event_date,
          daysUntil: ev.event_date === todayStr ? 0 : 1,
        });
      } else {
        setFocus(null);
      }
    };

    compute();
    const handler = () => compute();
    window.addEventListener('decode-exam-focus-changed', handler);
    return () => {
      active = false;
      window.removeEventListener('decode-exam-focus-changed', handler);
    };
  }, []);

  return focus;
}
