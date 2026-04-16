import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star, Quote } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Testimonial {
  id: string;
  user_id: string;
  content: string;
  rating: number;
  created_at: string;
  profile?: { full_name: string; email: string };
}

const getInitials = (name: string, email: string) => {
  if (name) return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return email?.[0]?.toUpperCase() || '?';
};

export function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('testimonials' as any)
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(9);

      const list = (data as any[]) || [];
      if (list.length) {
        const userIds = [...new Set(list.map(t => t.user_id))];
        const { data: profiles } = await supabase
          .from('profiles').select('user_id, full_name, email').in('user_id', userIds);
        const map = new Map((profiles || []).map(p => [p.user_id, p]));
        setItems(list.map(t => ({ ...t, profile: map.get(t.user_id) || { full_name: '', email: '' } })));
      }
      setLoading(false);
    })();
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-lines-bg opacity-30 pointer-events-none" />
      <div className="container mx-auto max-w-6xl relative">
        <div className="text-center mb-12">
          <p className="text-xs font-mono-label uppercase tracking-[0.2em] text-primary mb-3">
            // Depoimentos
          </p>
          <h2 className="font-display text-3xl md:text-5xl mb-3">
            O que dizem os <span className="text-primary">alunos</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Histórias reais de quem está transformando a forma de estudar com a Decode Analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(t => (
            <Card key={t.id} className="p-6 relative hover:border-primary/40 transition-all hover:-translate-y-1 duration-300">
              <Quote className="absolute top-4 right-4 h-6 w-6 text-primary/20" />
              <div className="flex gap-0.5 mb-3">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} className={cn(
                    'h-3.5 w-3.5',
                    n <= t.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'
                  )} />
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed mb-4 line-clamp-6">
                "{t.content}"
              </p>
              <div className="flex items-center gap-2.5 pt-3 border-t border-border/30">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                    {getInitials(t.profile?.full_name || '', t.profile?.email || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">
                    {t.profile?.full_name || t.profile?.email?.split('@')[0] || 'Aluno'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Decode Analytics</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
