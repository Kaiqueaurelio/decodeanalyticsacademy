import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, Sparkles, ChevronRight } from 'lucide-react';
import { getSubjectColor } from '@/lib/subject-colors';

interface UpcomingExam {
  id: string;
  title: string;
  event_date: string;
  subject: string | null;
  days_until: number;
}

/**
 * Banner do Dashboard que aparece quando há prova em ≤7 dias.
 * Leva direto pro Modo Revisão Pré-Prova.
 */
export function PreExamReviewBanner() {
  const navigate = useNavigate();
  const [exam, setExam] = useState<UpcomingExam | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const horizon = new Date(today);
      horizon.setDate(today.getDate() + 7);
      const horizonStr = horizon.toISOString().slice(0, 10);

      const { data } = await supabase
        .from('calendar_events')
        .select('id,title,event_date,subject,event_type')
        .gte('event_date', todayStr)
        .lte('event_date', horizonStr)
        .in('event_type', ['prova', 'trabalho', 'entrega'])
        .order('event_date', { ascending: true })
        .limit(1);

      if (!active || !data || data.length === 0) return;
      const ev = data[0];
      const days = Math.max(0, Math.ceil(
        (new Date(ev.event_date + 'T23:59:59').getTime() - today.getTime()) / 86400000
      ));
      setExam({
        id: ev.id, title: ev.title, event_date: ev.event_date,
        subject: ev.subject, days_until: days,
      });
    })();
    return () => { active = false; };
  }, []);

  if (!exam) return null;

  const color = getSubjectColor(exam.subject || exam.title);
  const urgent = exam.days_until <= 3;

  return (
    <Card
      className="p-4 border-2 relative overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform"
      style={{ borderColor: `${color}55`, background: `linear-gradient(110deg, ${color}15, transparent 70%)` }}
      onClick={() => navigate(`/revisao-prova/${exam.id}`)}
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-25" style={{ background: color }} />
      <div className="relative flex items-center gap-3">
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}25` }}
        >
          {urgent ? <Flame className="h-6 w-6" style={{ color }} /> : <Sparkles className="h-6 w-6" style={{ color }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Badge
              className="text-[9px] px-1.5 py-0 h-4 border"
              style={{ background: `${color}20`, color, borderColor: `${color}50` }}
            >
              MODO REVISÃO
            </Badge>
            {urgent && (
              <Badge className="text-[9px] px-1.5 py-0 h-4 bg-destructive/15 text-destructive border-destructive/40 border">
                URGENTE
              </Badge>
            )}
          </div>
          <p className="text-sm font-semibold leading-tight line-clamp-1">
            {exam.title}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {exam.days_until === 0
              ? 'É hoje! Bora revisar tudo agora →'
              : `Em ${exam.days_until} dia${exam.days_until > 1 ? 's' : ''} · revise pontos fracos + flashcards`}
          </p>
        </div>
        <Button
          size="sm"
          className="flex-shrink-0 gap-1"
          style={{ background: color, color: '#000' }}
        >
          Abrir <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
}
