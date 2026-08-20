import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw, Search, FileDown, FileText, X, GraduationCap, BookOpen, Target, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { autoLinkApostila } from '@/lib/auto-link-materials';

type AuditLog = {
  id: string;
  user_id: string;
  event_type: string;
  resource_id: string | null;
  metadata: any;
  created_at: string;
};

type ProfileLite = { user_id: string; full_name: string | null; ra: string | null; email: string | null };

export function AcademicAuditPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [eventType, setEventType] = useState<string>('all');
  const [limit, setLimit] = useState('200');
  
  // Advanced search/pagination
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (eventType !== 'all') {
      q = q.eq('event_type', eventType);
    }
    
    // We'll filter the rest client-side for now given the complexity of searching related profiles
    // But we'll load more to allow better filtering
    q = q.limit(1000);

    const { data, error } = await q;

    if (error) {
      toast.error('Erro ao carregar logs de auditoria');
      setLoading(false);
      return;
    }

    const fetchedLogs = data || [];
    setLogs(fetchedLogs);

    const userIds = [...new Set(fetchedLogs.map(l => l.user_id))];
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, full_name, ra, email')
        .in('user_id', userIds);
      
      const map: Record<string, ProfileLite> = {};
      (profs || []).forEach(p => map[p.user_id] = p);
      setProfiles(map);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [eventType]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return logs;
    return logs.filter(l => {
      const p = profiles[l.user_id];
      const metadataStr = JSON.stringify(l.metadata || '').toLowerCase();
      return (
        l.event_type.toLowerCase().includes(q) ||
        (p?.full_name || '').toLowerCase().includes(q) ||
        (p?.ra || '').toLowerCase().includes(q) ||
        (p?.email || '').toLowerCase().includes(q) ||
        (l.resource_id || '').toLowerCase().includes(q) ||
        metadataStr.includes(q)
      );
    });
  }, [logs, profiles, query]);

  const paginated = useMemo(() => {
    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Relatório de Auditoria Acadêmica', 20, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 30);

    let y = 40;
    filtered.forEach((l, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const p = profiles[l.user_id];
      const userName = p?.full_name || p?.ra || l.user_id.slice(0, 8);
      doc.text(`${new Date(l.created_at).toLocaleString('pt-BR')} - ${userName}`, 20, y);
      doc.text(`Ação: ${l.event_type} | Recurso: ${l.resource_id || 'N/A'}`, 20, y + 5);
      y += 15;
    });

    doc.save(`auditoria-academica-${new Date().getTime()}.pdf`);
    toast.success('Relatório PDF gerado com sucesso');
  };

  const exportCsv = () => {
    const headers = ['Data', 'Usuário', 'RA', 'Evento', 'Recurso', 'Metadata'];
    const rows = filtered.map(l => {
      const p = profiles[l.user_id];
      return [
        new Date(l.created_at).toLocaleString('pt-BR'),
        p?.full_name || 'N/A',
        p?.ra || 'N/A',
        l.event_type,
        l.resource_id || 'N/A',
        JSON.stringify(l.metadata || {})
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria-academica-${new Date().getTime()}.csv`;
    link.click();
    toast.success('CSV exportado com sucesso');
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Auditoria Acadêmica
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Monitoramento de acessos a gabaritos, respostas e submissões.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={loading ? 'animate-spin' : ''} />
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
              <FileText className="h-4 w-4 mr-2" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportPdf} disabled={filtered.length === 0}>
              <FileDown className="h-4 w-4 mr-2" /> PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Busca Avançada</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={query} 
                onChange={e => { setQuery(e.target.value); setPage(0); }} 
                placeholder="Aluno, RA, Recurso ou Detalhes..." 
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Filtrar Evento</Label>
            <Select value={eventType} onValueChange={(v) => { setEventType(v); setPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="exercise_answered">Exercício Respondido</SelectItem>
                <SelectItem value="essay_answer_submitted">Dissertativa Enviada</SelectItem>
                <SelectItem value="essay_model_answer_revealed">Gabarito Revelado</SelectItem>
                <SelectItem value="login_failed">Falha de Login</SelectItem>
                <SelectItem value="apostila_date_inconsistency">Inconsistência de Data</SelectItem>
                <SelectItem value="apostila_page_created">Nova Página Criada</SelectItem>
              </SelectContent>
            </Select>

          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Mostrando {paginated.length} de {filtered.length} registros</span>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              disabled={page === 0} 
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Página {page + 1} de {totalPages || 1}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              disabled={page >= totalPages - 1} 
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[500px] rounded-md border border-border/50">
          <div className="p-4 space-y-3">
            {paginated.map(l => {
              const p = profiles[l.user_id];
              const isCritical = l.event_type === 'essay_model_answer_revealed' || l.event_type === 'login_failed';
              return (
                <div key={l.id} className={cn(
                  "p-3 rounded-lg border transition-colors",
                  isCritical ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border/50"
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={isCritical ? "default" : "secondary"} className="text-[10px]">
                      {l.event_type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(l.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold">{p?.full_name || 'Usuário'}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{p?.ra ? `(RA: ${p.ra})` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground truncate">Recurso: {l.resource_id || 'N/A'}</span>
                  </div>
                  {l.metadata && Object.keys(l.metadata).length > 0 && (
                    <div className="mt-2 text-[9px] font-mono text-muted-foreground bg-black/20 p-1.5 rounded border border-border/20">
                      {JSON.stringify(l.metadata)}
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && !loading && (
              <div className="text-center py-20 text-muted-foreground">
                Nenhum log encontrado para os critérios selecionados.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

