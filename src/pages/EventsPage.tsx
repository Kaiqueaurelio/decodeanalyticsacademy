import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, Clock, Users, ExternalLink, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  event_type: string;
  subject: string | null;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('event_date', { ascending: true })
        .gte('event_date', new Date().toISOString().split('T')[0]);

      if (!error && data) {
        setEvents(data);
      }
      setLoading(false);
    }
    loadEvents();
  }, []);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      prova: 'Prova',
      trabalho: 'Trabalho',
      atividade: 'Atividade',
      seminario: 'Seminário',
      entrega: 'Entrega',
      aula: 'Aula',
      palestra: 'Palestra',
      hackaton: 'Hackaton'
    };
    return labels[type] || type;
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'palestra': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'hackaton': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'prova': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              <Calendar className="h-10 w-10 text-primary" />
              Eventos & Acadêmico
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Fique por dentro de palestras, hackatons, provas e atividades da Decode Analytics Academy.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-500/80 bg-emerald-500/5 px-3 py-1.5 rounded-full border border-emerald-500/10">
            <ShieldCheck className="h-3.5 w-3.5" />
            CALENDÁRIO OFICIAL v1.0
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[280px] rounded-3xl bg-card/20 animate-pulse border border-border/50" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24 rounded-[2.5rem] border-2 border-dashed border-border/50 bg-card/10">
            <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white">Nenhum evento programado</h3>
            <p className="text-muted-foreground mt-2">Fique atento às notificações para novas palestras e hackatons.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="group relative overflow-hidden bg-card/30 backdrop-blur-md border-border/50 hover:border-primary/40 transition-all duration-500 rounded-[2rem]">
                <div className="absolute top-0 right-0 p-4">
                  <Badge variant="outline" className={`capitalize font-bold tracking-wider text-[10px] ${getTypeStyle(event.event_type)}`}>
                    {getTypeLabel(event.event_type)}
                  </Badge>
                </div>
                
                <CardHeader className="pt-8">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-mono text-xs mb-2">
                      <Clock className="h-3 w-3" />
                      {format(new Date(event.event_date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                      {event.event_time && ` às ${event.event_time.slice(0, 5)}`}
                    </div>
                    <CardTitle className="text-xl font-bold text-white group-hover:text-primary transition-colors line-clamp-2">
                      {event.title}
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {event.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 italic">
                      "{event.description}"
                    </p>
                  )}

                  <div className="flex flex-col gap-3 pt-4 border-t border-border/30">
                    {event.subject && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {event.subject}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      Aberto a todos os alunos
                    </div>
                  </div>

                  <button className="w-full mt-2 py-3 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group/btn border border-primary/20">
                    Detalhes do Evento
                    <ExternalLink className="h-4 w-4 transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
