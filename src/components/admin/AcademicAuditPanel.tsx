import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw, Search, FileDown, FileText, X, GraduationCap, BookOpen, Target, CheckCircle, XCircle } from 'lucide-react';
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

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (eventType !== 'all') {
      q = q.eq('event_type', eventType);
    }

    const { data, error } = await q;

    if (error) {
      toast.error('Erro ao carregar logs de auditoria');
      setLoading(false);
      return;
    }

    setLogs(data || []);

    const userIds = [...new Set((data || []).map(l => l.user_id))];
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
  }, [eventType, limit]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return logs;
    return logs.filter(l => {
      const p = profiles[l.user_id];
      return (
        l.event_type.toLowerCase().includes(q) ||
        (p?.full_name || '').toLowerCase().includes(q) ||
        (p?.ra || '').toLowerCase().includes(q) ||
        (p?.email || '').toLowerCase().includes(q) ||
        (l.resource_id || '').toLowerCase().includes(q)
      );
    });
  }, [logs, profiles, query]);

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
            <Button variant="outline" size="sm" onClick={exportPdf} disabled={filtered.length === 0}>
              <FileDown className="h-4 w-4 mr-2" /> PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={query} 
                onChange={e => setQuery(e.target.value)} 
                placeholder="Aluno, RA ou Recurso..." 
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Evento</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="exercise_answered">Exercício Respondido</SelectItem>
                <SelectItem value="essay_answer_submitted">Dissertativa Enviada</SelectItem>
                <SelectItem value="essay_model_answer_revealed">Gabarito Revelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Limite</Label>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger>
                <SelectValue placeholder="Quantidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100 registros</SelectItem>
                <SelectItem value="200">200 registros</SelectItem>
                <SelectItem value="500">500 registros</SelectItem>
                <SelectItem value="1000">1000 registros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="h-[500px] rounded-md border border-border/50">
          <div className="p-4 space-y-3">
            {filtered.map(l => {
              const p = profiles[l.user_id];
              const isCritical = l.event_type === 'essay_model_answer_revealed';
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
                    <span className="text-[10px] text-muted-foreground truncate">ID Recurso: {l.resource_id}</span>
                  </div>
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
