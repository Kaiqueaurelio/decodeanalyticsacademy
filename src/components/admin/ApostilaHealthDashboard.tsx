import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  History, 
  User, 
  Clock,
  LayoutDashboard,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const STATUS_CONFIG = {
  liberada: { label: 'Liberada', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 },
  bloqueada: { label: 'Bloqueada', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: Lock },
  em_manutencao: { label: 'Em Manutenção', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: AlertTriangle }
};

export function ApostilaHealthDashboard() {
  const [apostilas, setApostilas] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [semesterFilter, setSemesterFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [semesterFilter]);

  async function fetchData() {
    setLoading(true);
    try {
      let query = supabase.from('apostilas').select('id, title, status, semester, category').order('semester', { ascending: true });
      if (semesterFilter !== 'all') {
        query = query.eq('semester', parseInt(semesterFilter));
      }
      
      const { data: aData } = await query;
      const { data: lData } = await supabase
        .from('maintenance_logs')
        .select('*, apostilas(title)')
        .order('created_at', { ascending: false })
        .limit(20);

      setApostilas(aData || []);
      setLogs(lData || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            Saúde das Apostilas
          </h2>
          <p className="text-sm text-muted-foreground">Status operacional e histórico de manutenções</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={semesterFilter} onValueChange={setSemesterFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar Semestre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Semestres</SelectItem>
              {[1,2,3,4,5,6,7,8].map(s => (
                <SelectItem key={s} value={s.toString()}>{s}º Semestre</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Status por Matéria</CardTitle>
            <CardDescription>Visão geral da disponibilidade das apostilas</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {apostilas.map((a) => {
                  const config = STATUS_CONFIG[a.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.liberada;
                  const Icon = config.icon;
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{a.title}</span>
                        <span className="text-[10px] text-muted-foreground">{a.semester}º Semestre • {a.category}</span>
                      </div>
                      <Badge className={`${config.color} border gap-1.5`}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico Recente
            </CardTitle>
            <CardDescription>Últimas alterações de status e conteúdo</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {logs.map((log) => (
                  <div key={log.id} className="relative pl-6 border-l-2 border-primary/20 pb-1">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold leading-none">{log.apostilas?.title}</p>
                      <p className="text-[11px] text-primary font-medium">{log.action}</p>
                      {log.details && <p className="text-[10px] text-muted-foreground italic">"{log.details}"</p>}
                      <div className="flex items-center gap-3 pt-1">
                        <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                          <User className="h-3 w-3" /> {log.user_name || 'Admin'}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                          <Clock className="h-3 w-3" /> {format(new Date(log.created_at), "dd/MM, HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-10">Nenhum registro encontrado.</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
