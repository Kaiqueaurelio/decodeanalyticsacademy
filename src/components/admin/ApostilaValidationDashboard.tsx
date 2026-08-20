import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  ShieldAlert,
  TerminalSquare,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface DashboardSummary {
  total_runs: number;
  last_run_at: string | null;
  open_alerts: number;
  open_errors: number;
  apostilas_with_open_alerts: number;
}

interface ValidationRun {
  id: string;
  apostila_id: string;
  apostila_title?: string;
  trigger_source: string;
  status: 'ok' | 'warning' | 'error';
  issue_count: number;
  evidence: Record<string, unknown>;
  created_at: string;
}

interface ValidationAlert {
  id: string;
  issue_id: string;
  apostila_id: string;
  apostila_title?: string;
  page_id: string | null;
  severity: 'warning' | 'error';
  status: 'open' | 'acknowledged' | 'resolved';
  code: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface OperationLog {
  id: string;
  operation_id: string;
  apostila_id: string | null;
  page_id: string | null;
  apostila_title?: string;
  operation_type: string;
  phase: string;
  status: 'started' | 'succeeded' | 'failed' | 'blocked';
  affected_record_ids: string[];
  error_code: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const formatDate = (value: string | null | undefined) => value
  ? new Date(value).toLocaleString('pt-BR')
  : 'Nunca';

const statusLabel: Record<string, string> = {
  ok: 'Íntegra',
  warning: 'Com avisos',
  error: 'Com erro',
  started: 'Iniciada',
  succeeded: 'Concluída',
  failed: 'Falhou',
  blocked: 'Bloqueada',
};

const statusClass: Record<string, string> = {
  ok: 'border-emerald-500/30 text-emerald-500',
  warning: 'border-amber-500/30 text-amber-500',
  error: 'border-red-500/30 text-red-500',
  started: 'border-blue-500/30 text-blue-500',
  succeeded: 'border-emerald-500/30 text-emerald-500',
  failed: 'border-red-500/30 text-red-500',
  blocked: 'border-amber-500/30 text-amber-500',
};

export function ApostilaValidationDashboard() {
  const [summary, setSummary] = useState<DashboardSummary>({
    total_runs: 0,
    last_run_at: null,
    open_alerts: 0,
    open_errors: 0,
    apostilas_with_open_alerts: 0,
  });
  const [runs, setRuns] = useState<ValidationRun[]>([]);
  const [alerts, setAlerts] = useState<ValidationAlert[]>([]);
  const [operations, setOperations] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    const { data, error } = await (supabase.rpc as any)('get_apostila_validation_dashboard', { _limit: 100 });

    if (error) {
      toast.error('Não foi possível carregar o diagnóstico server-side. A migração ainda pode estar pendente.');
      setLoading(false);
      return;
    }

    const payload = data || {};
    setSummary(payload.summary || {
      total_runs: 0,
      last_run_at: null,
      open_alerts: 0,
      open_errors: 0,
      apostilas_with_open_alerts: 0,
    });
    setRuns(payload.recent_runs || []);
    setAlerts(payload.open_alerts || []);
    setOperations(payload.operation_logs || []);
    setLoading(false);
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const query = filter.trim().toLowerCase();
  const filteredAlerts = useMemo(() => !query ? alerts : alerts.filter((alert) =>
    [alert.apostila_title, alert.apostila_id, alert.page_id, alert.code, alert.message, JSON.stringify(alert.metadata)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  ), [alerts, query]);

  const filteredOperations = useMemo(() => !query ? operations : operations.filter((operation) =>
    [operation.apostila_title, operation.apostila_id, operation.page_id, operation.operation_type, operation.phase,
      operation.status, operation.error_code, operation.error_message, JSON.stringify(operation.metadata)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  ), [operations, query]);

  const acknowledgeAlert = async (alert: ValidationAlert) => {
    const { error } = await supabase
      .from('apostila_validation_alerts' as any)
      .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() })
      .eq('id', alert.id);
    if (error) {
      toast.error('Não foi possível reconhecer o alerta.');
      return;
    }
    toast.success('Alerta reconhecido.');
    await loadDashboard();
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Diagnóstico de Apostilas
              </CardTitle>
              <CardDescription>
                Validação cronológica por data, evidências de correção, alertas preventivos e operações do Workbench.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadDashboard()} disabled={loading}>
              <RefreshCw className={loading ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <MetricCard label="Validações" value={summary.total_runs} icon={<Activity className="h-4 w-4" />} />
            <MetricCard label="Alertas abertos" value={summary.open_alerts} tone={summary.open_alerts ? 'warning' : 'ok'} icon={<AlertTriangle className="h-4 w-4" />} />
            <MetricCard label="Erros críticos" value={summary.open_errors} tone={summary.open_errors ? 'error' : 'ok'} icon={<ShieldAlert className="h-4 w-4" />} />
            <MetricCard label="Apostilas afetadas" value={summary.apostilas_with_open_alerts} tone={summary.apostilas_with_open_alerts ? 'warning' : 'ok'} icon={<BookOpen className="h-4 w-4" />} />
            <MetricCard label="Última execução" value={formatDate(summary.last_run_at)} compact icon={<Clock3 className="h-4 w-4" />} />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filtrar apostila, página, código, operação ou erro..."
              className="pl-9"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Alertas que exigem atenção</CardTitle>
            <CardDescription>Gerados automaticamente quando o conteúdo, título ou ordem das páginas divergem.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[430px] pr-3">
              <div className="space-y-3">
                {filteredAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={alert.severity === 'error' ? 'h-4 w-4 text-red-500' : 'h-4 w-4 text-amber-500'} />
                        <span className="text-sm font-semibold">{alert.apostila_title || alert.apostila_id.slice(0, 8)}</span>
                      </div>
                      <Badge variant="outline" className={statusClass[alert.severity]}>{alert.severity === 'error' ? 'Erro' : 'Aviso'}</Badge>
                    </div>
                    <p className="mt-2 text-sm">{alert.message}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                      <span>Código: <strong>{alert.code}</strong></span>
                      {alert.page_id && <span>Página: <strong>{alert.page_id.slice(0, 8)}</strong></span>}
                      <span>{formatDate(alert.created_at)}</span>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      {alert.page_id && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { window.location.href = `/admin/apostilas/${alert.apostila_id}?page=${alert.page_id}`; }}>
                          Corrigir no Workbench
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => void acknowledgeAlert(alert)}>
                        Reconhecer
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredAlerts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
                    <CheckCircle2 className="mb-2 h-10 w-10 text-emerald-500/60" />
                    <p>Nenhum alerta aberto para os filtros atuais.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Últimas validações e evidências</CardTitle>
            <CardDescription>O status e o conjunto de datas detectadas ficam preservados por execução.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[430px] pr-3">
              <div className="space-y-3">
                {runs.map((run) => (
                  <div key={run.id} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{run.apostila_title || run.apostila_id.slice(0, 8)}</p>
                        <p className="text-[10px] text-muted-foreground">Origem: {run.trigger_source} · {formatDate(run.created_at)}</p>
                      </div>
                      <Badge variant="outline" className={statusClass[run.status]}>{statusLabel[run.status]}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                      <span>Problemas: <strong>{run.issue_count}</strong></span>
                      <span>Erros: <strong>{String(run.evidence?.error_count ?? 0)}</strong></span>
                      <span>Avisos: <strong>{String(run.evidence?.warning_count ?? 0)}</strong></span>
                    </div>
                    <pre className="mt-2 max-h-24 overflow-auto rounded bg-black/20 p-2 text-[9px] text-muted-foreground">{JSON.stringify(run.evidence || {}, null, 2)}</pre>
                  </div>
                ))}
                {runs.length === 0 && <p className="py-14 text-center text-sm text-muted-foreground">Nenhuma validação registrada.</p>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><TerminalSquare className="h-4 w-4" /> Logs detalhados do Workbench</CardTitle>
          <CardDescription>Cada tentativa informa a fase, resultado, IDs afetados e motivo técnico de falha ou bloqueio.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[430px] pr-3">
            <div className="space-y-2">
              {filteredOperations.map((operation) => (
                <div key={operation.id} className="rounded-lg border border-border/50 bg-muted/10 p-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusClass[operation.status]}>{statusLabel[operation.status]}</Badge>
                      <strong>{operation.operation_type}</strong>
                      <span className="text-muted-foreground">/ {operation.phase}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{formatDate(operation.created_at)}</span>
                  </div>
                  <div className="mt-2 grid gap-1 text-[10px] text-muted-foreground md:grid-cols-3">
                    <span>Apostila: {operation.apostila_title || operation.apostila_id?.slice(0, 8) || 'N/A'}</span>
                    <span>Página: {operation.page_id?.slice(0, 8) || 'principal'}</span>
                    <span>Afetados: {operation.affected_record_ids?.length || 0}</span>
                  </div>
                  {operation.error_code && <p className="mt-2 text-red-400">{operation.error_code}: {operation.error_message}</p>}
                  <pre className="mt-2 max-h-20 overflow-auto rounded bg-black/20 p-2 text-[9px] text-muted-foreground">{JSON.stringify(operation.metadata || {}, null, 2)}</pre>
                </div>
              ))}
              {filteredOperations.length === 0 && <p className="py-14 text-center text-sm text-muted-foreground">Nenhuma operação registrada para os filtros atuais.</p>}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, icon, tone = 'default', compact = false }: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: 'default' | 'ok' | 'warning' | 'error';
  compact?: boolean;
}) {
  const toneClass = tone === 'error' ? 'text-red-500' : tone === 'warning' ? 'text-amber-500' : tone === 'ok' ? 'text-emerald-500' : 'text-primary';
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className={`flex items-center gap-1.5 text-[10px] ${toneClass}`}>{icon}<span>{label}</span></div>
      <div className={compact ? 'mt-2 text-xs font-semibold' : 'mt-2 text-2xl font-bold tabular-nums'}>{value}</div>
    </div>
  );
}
