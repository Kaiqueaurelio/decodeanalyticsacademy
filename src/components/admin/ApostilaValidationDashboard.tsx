import { useEffect, useState, useMemo } from 'react';
import { ShieldAlert, Search, RefreshCw, FileText, Calendar, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

type InconsistencyLog = {
  id: string;
  resource_id: string;
  metadata: {
    page_id: string;
    title_date: string;
    found_dates: string[];
    title: string;
  };
  created_at: string;
};

export function ApostilaValidationDashboard() {
  const [logs, setLogs] = useState<InconsistencyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('event_type', 'apostila_date_inconsistency')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar diagnóstico de validação');
    } else {
      setLogs((data as any) as InconsistencyLog[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (!filter) return logs;
    return logs.filter(l => 
      l.resource_id.includes(filter) || 
      l.metadata.title.toLowerCase().includes(filter.toLowerCase())
    );
  }, [logs, filter]);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                Diagnóstico de Apostilas
              </CardTitle>
              <CardDescription>
                Monitoramento de inconsistências cronológicas e mistura de aulas.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
              <RefreshCw className={loading ? "animate-spin mr-2" : "mr-2"} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filtrar por título ou ID..." 
              className="pl-9"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[500px] pr-4">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 text-green-500/50 mb-2" />
                <p>Nenhuma inconsistência detectada recentemente.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map(log => (
                  <div 
                    key={log.id} 
                    className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="font-bold text-sm">{log.metadata.title}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] opacity-70">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[11px]">
                      <div className="space-y-1">
                        <span className="text-muted-foreground uppercase text-[9px] font-bold">Data no Título</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <Calendar className="h-3 w-3" />
                          {log.metadata.title_date}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground uppercase text-[9px] font-bold">Datas no Conteúdo</span>
                        <div className="flex flex-wrap gap-1 font-mono">
                          {log.metadata.found_dates.map(d => (
                            <Badge key={d} variant="destructive" className="h-4 text-[9px] px-1 py-0">
                              {d}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-border/30">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        ID: {log.resource_id.slice(0, 8)}...
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px] ml-auto hover:text-primary"
                        onClick={() => window.location.href = `/admin/apostilas/${log.resource_id}?page=${log.metadata.page_id}`}
                      >
                        Corrigir no Workbench
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
