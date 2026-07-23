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
  profile?: { full_name: string };
}

const getInitials = (name: string) => {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'AL';
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

const displayName = (name: string) => {
  const trimmed = (name || '').trim();
  return trimmed || 'Aluno';
};

// Cores estilo "Ana Silva = ciano, Carlos Santos = roxo" — alterna por hash
const AVATAR_BG = ['#00f0ff', '#a855f7', '#22d3ee', '#c084fc', '#06b6d4', '#d946ef'];
const colorFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_BG[h % AVATAR_BG.length];
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
          {items.map(t => {
            const name = displayName(t.profile?.full_name || '', t.profile?.email || '');
            const initials = getInitials(t.profile?.full_name || '', t.profile?.email || '');
            const bg = colorFor(t.user_id);
            return (
              <div
                key={t.id}
                className="rounded-2xl p-6 transition-all hover:-translate-y-1 duration-300"
                style={{
                  background: '#0a0a12',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* Header: avatar + nome + curso */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center font-display font-bold text-base shrink-0"
                    style={{ background: bg, color: '#050508' }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold truncate" style={{ color: '#f1f5f9' }}>
                      {name}
                    </p>
                    <p className="text-[11px] font-mono tracking-wider truncate" style={{ color: '#64748b' }}>
                      {formatRole(t.course, t.semester)}
                    </p>
                  </div>
                </div>

                {/* Quote */}
                <p
                  className="text-[15px] italic leading-relaxed mb-5"
                  style={{ color: '#cbd5e1' }}
                >
                  "{t.content}"
                </p>

                {/* Stars */}
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <Star
                      key={n}
                      className="h-4 w-4"
                      style={{
                        fill: n <= t.rating ? '#00f0ff' : 'transparent',
                        color: n <= t.rating ? '#00f0ff' : '#334155',
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
