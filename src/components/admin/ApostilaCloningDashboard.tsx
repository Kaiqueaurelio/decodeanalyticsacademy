import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Copy, 
  Wand2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  History, 
  Clock, 
  ArrowRight,
  Database,
  Search,
  RefreshCw,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ApostilaCloningDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
    
    // Subscribe to changes for live updates on generation jobs
    const channel = supabase
      .channel('generation_jobs_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'apostila_generation_jobs' 
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: jobsData } = await supabase
        .from('apostila_generation_jobs')
        .select('*, source:source_apostila_id(title), target:apostila_id(title)')
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: historyData } = await supabase
        .from('apostila_version_history')
        .select('*, apostilas(title)')
        .order('created_at', { ascending: false })
        .limit(20);

      setJobs(jobsData || []);
      setHistory(historyData || []);
    } finally {
      setLoading(false);
    }
  }

  const filteredJobs = jobs.filter(job => 
    (job.source?.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (job.target?.title || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1"><CheckCircle2 className="h-3 w-3" /> Concluído</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Falhou</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Processando</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Copy className="h-6 w-6 text-primary" />
            Dashboard de Auditoria & Qualidade 360º
          </h2>
          <p className="text-sm text-muted-foreground">Monitoramento de erros, status de geração e integridade de conteúdo</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar tarefa..." 
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active & Recent Jobs */}
        <Card className="lg:col-span-2 border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-primary" />
              Tarefas de Geração
            </CardTitle>
            <CardDescription>Status atual de clonagem e expansão por IA</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[550px] pr-4">
              <div className="space-y-4">
                {filteredJobs.length > 0 ? filteredJobs.map((job) => (
                  <div key={job.id} className="p-4 rounded-xl border border-border/50 bg-background/30 hover:bg-background/50 transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {job.type === 'clone' ? (
                          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                            <Copy className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                            <Wand2 className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold truncate max-w-[200px] md:max-w-xs">
                            {job.target?.title || 'Apostila Gerada'}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span>Origem: {job.source?.title || 'N/A'}</span>
                            <ArrowRight className="h-2 w-2" />
                            <span>{job.type === 'clone' ? 'Clonagem' : 'Geração IA'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-auto md:ml-0">
                        {getStatusBadge(job.status)}
                      </div>
                    </div>
                    
                    {job.status === 'processing' && (
                      <div className="space-y-1.5 mt-2">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="h-1" />
                      </div>
                    )}

                    {job.error_message && (
                      <div className="mt-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10 text-[10px] text-destructive flex gap-2">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{job.error_message}</span>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/30 pt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(job.created_at), "PPP 'às' p", { locale: ptBR })}
                      </span>
                      <span>ID: {job.id.split('-')[0]}</span>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Database className="h-10 w-10 mb-4 opacity-20" />
                    <p>Nenhuma tarefa de geração encontrada.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Version History Sidebar */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-primary" />
              Histórico de Versões
            </CardTitle>
            <CardDescription>Alterações estruturais e marcos</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[550px] pr-4">
              <div className="space-y-6">
                {history.length > 0 ? history.map((item) => (
                  <div key={item.id} className="relative pl-6 border-l-2 border-primary/20 pb-2">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-primary group-hover:scale-110 transition-transform" />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold leading-none">{item.apostilas?.title}</p>
                        {item.version_label && (
                          <Badge variant="outline" className="text-[8px] h-4 px-1.5 py-0 border-primary/30 text-primary">
                            {item.version_label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-foreground leading-snug">{item.changes_summary}</p>
                      <div className="flex items-center gap-3 pt-1">
                        <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                          <FileText className="h-3 w-3" /> {format(new Date(item.created_at), "dd/MM, HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <History className="h-8 w-8 mb-3 opacity-20" />
                    <p className="text-xs text-center">Nenhum histórico de versão registrado ainda.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
