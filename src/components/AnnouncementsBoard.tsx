import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Megaphone, GraduationCap, Calendar, Briefcase, Sparkles } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  link_url: string | null;
  published: boolean;
  created_at: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  geral: { label: 'Geral', icon: Megaphone, color: 'bg-primary/10 text-primary' },
  cursos: { label: 'Cursos', icon: GraduationCap, color: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]' },
  provas: { label: 'Provas', icon: Calendar, color: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]' },
  empregos: { label: 'Empregos', icon: Briefcase, color: 'bg-accent text-accent-foreground' },
  eventos: { label: 'Eventos', icon: Sparkles, color: 'bg-primary/10 text-primary' },
};

export function AnnouncementsBoard() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('announcements').select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setAnnouncements((data as Announcement[]) || []);
        setLoading(false);
      });
  }, []);

  const filtered = filter === 'all' ? announcements : announcements.filter(a => a.category === filter);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="skeleton-shimmer h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Megaphone className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg font-bold">Mural de Avisos</h2>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`text-[10px] font-medium px-3 py-1.5 rounded-full transition-colors ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
        >
          Todos
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-[10px] font-medium px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 ${filter === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
          >
            <cfg.icon className="h-3 w-3" /> {cfg.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Nenhum aviso disponível no momento.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(a => {
            const cfg = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.geral;
            const Icon = cfg.icon;
            return (
              <Card
                key={a.id}
                className="hover:shadow-md transition-shadow animate-fade-in cursor-pointer active:scale-[0.98]"
                onClick={() => navigate(`/aviso/${a.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {a.image_url && (
                      <img src={a.image_url} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className={`text-[9px] ${cfg.color}`}>
                          <Icon className="h-2.5 w-2.5 mr-1" /> {cfg.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm mb-1 truncate">{a.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{a.content}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
