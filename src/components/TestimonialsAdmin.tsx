import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Check, X, Loader2, MessageSquareQuote } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface T {
  id: string;
  user_id: string;
  content: string;
  rating: number;
  approved: boolean;
  created_at: string;
  profile?: { full_name: string; email: string };
}

export function TestimonialsAdmin() {
  const { user } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved'>('pending');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('testimonials' as any)
      .select('*').eq('approved', filter === 'approved')
      .order('created_at', { ascending: false });

    const list = (data as any[]) || [];
    const userIds = [...new Set(list.map(t => t.user_id))];
    const { data: profiles } = await supabase.from('profiles')
      .select('user_id, full_name, email').in('user_id', userIds);
    const map = new Map((profiles || []).map(p => [p.user_id, p]));
    setItems(list.map(t => ({ ...t, profile: map.get(t.user_id) || { full_name: '', email: '' } })));
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    const { error } = await supabase.from('testimonials' as any).update({
      approved: true, approved_by: user?.id, approved_at: new Date().toISOString(),
    } as any).eq('id', id);
    if (error) return toast.error('Erro ao aprovar');
    toast.success('Depoimento aprovado!');
    load();
  };

  const reject = async (id: string) => {
    const { error } = await supabase.from('testimonials' as any).delete().eq('id', id);
    if (error) return toast.error('Erro ao excluir');
    toast.success('Depoimento removido');
    load();
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquareQuote className="h-4 w-4 text-primary" />
        <h3 className="font-display text-base">Depoimentos</h3>
        <div className="ml-auto flex gap-1 bg-secondary/40 p-1 rounded-lg">
          <button onClick={() => setFilter('pending')} className={cn(
            'px-3 py-1 text-xs rounded-md transition-colors',
            filter === 'pending' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}>Pendentes</button>
          <button onClick={() => setFilter('approved')} className={cn(
            'px-3 py-1 text-xs rounded-md transition-colors',
            filter === 'approved' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}>Aprovados</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">
          {filter === 'pending' ? 'Nenhum depoimento pendente.' : 'Nenhum depoimento aprovado.'}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map(t => (
            <div key={t.id} className="p-3 rounded-lg bg-secondary/30 border border-border/40">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold">
                    {t.profile?.full_name || t.profile?.email || 'Aluno'}
                  </p>
                  <div className="flex gap-0.5 mt-0.5">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={cn(
                        'h-3 w-3',
                        n <= t.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'
                      )} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  {filter === 'pending' && (
                    <Button size="sm" className="h-7 gap-1" onClick={() => approve(t.id)}>
                      <Check className="h-3 w-3" /> Aprovar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive"
                    onClick={() => reject(t.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">"{t.content}"</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
