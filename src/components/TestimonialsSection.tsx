import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star } from 'lucide-react';

interface Testimonial {
  id: string;
  user_id: string;
  content: string;
  rating: number;
  course: string | null;
  semester: number | null;
  created_at: string;
  profile?: { full_name: string; email: string };
}

const getInitials = (name: string, email: string) => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email?.slice(0, 2)?.toUpperCase() || '??';
};

const displayName = (name: string, email: string) => {
  if (name && name.trim()) return name.trim();
  return email?.split('@')[0] || 'Aluno';
};

const formatRole = (course: string | null, semester: number | null) => {
  if (!course && !semester) return 'Aluno · Decode Analytics';
  const c = course === 'OUTRO' ? 'Aluno' : `Aluno de ${course || ''}`.trim();
  const s = semester ? ` - ${semester}º sem.` : '';
  return `${c}${s}`.toUpperCase();
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
    <section className="py-20 px-4 relative overflow-hidden bg-black">
      <div className="absolute -top-40 right-0 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.05] pointer-events-none" style={{ background: '#ffffff' }} />
      <div className="container mx-auto max-w-6xl relative">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-3">
            // Depoimentos
          </p>
          <h2
            className="text-3xl md:text-5xl mb-3 text-white"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            O que dizem os alunos
          </h2>
          <p className="text-sm text-white/60 max-w-xl mx-auto">
            Histórias reais de quem está transformando a forma de estudar com a Decode Analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(t => {
            const name = displayName(t.profile?.full_name || '', t.profile?.email || '');
            const initials = getInitials(t.profile?.full_name || '', t.profile?.email || '');
            return (
              <div
                key={t.id}
                className="liquid-glass rounded-2xl p-6 hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="liquid-glass h-12 w-12 rounded-full flex items-center justify-center font-bold text-base shrink-0 text-white">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold truncate text-white">
                      {name}
                    </p>
                    <p className="text-[11px] tracking-wider truncate text-white/50">
                      {formatRole(t.course, t.semester)}
                    </p>
                  </div>
                </div>

                <p className="text-[15px] italic leading-relaxed mb-5 text-white/80">
                  "{t.content}"
                </p>

                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <Star
                      key={n}
                      className="h-4 w-4"
                      strokeWidth={1.5}
                      style={{
                        fill: n <= t.rating ? '#ffffff' : 'transparent',
                        color: n <= t.rating ? '#ffffff' : 'rgba(255,255,255,0.25)',
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
