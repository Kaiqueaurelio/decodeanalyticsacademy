import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Wand2, ArrowRight } from 'lucide-react';

export function ReviewTodayCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dueCount, setDueCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { count } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .or(`next_review.lte.${new Date().toISOString()},next_review.is.null`);
      setDueCount(count || 0);
    })();
  }, [user]);

  if (dueCount === null || dueCount === 0) return null;

  return (
    <Card
      onClick={() => navigate('/review')}
      className="p-4 cursor-pointer smooth-all hover:shadow-md hover-lift bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-primary font-mono font-semibold">
              Revisar hoje
            </p>
            <p className="text-sm font-semibold leading-tight">
              {dueCount} {dueCount === 1 ? 'cartão pendente' : 'cartões pendentes'}
            </p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Wand2 className="h-3 w-3" /> Revisão espaçada (SM-2) • +2 XP por acerto
            </p>
          </div>
        </div>
        <Button size="sm" className="gradient-primary text-primary-foreground gap-1 shrink-0">
          Iniciar <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
