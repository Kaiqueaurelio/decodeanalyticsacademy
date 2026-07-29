import { useMemo, useState } from 'react';
import { ShieldAlert, ShieldCheck, RefreshCw, Check, Search, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ALERT_HINT, ALERT_LABEL, useSecurityAlerts, type SecurityAlertKind } from '@/hooks/useSecurityAlerts';

const FILTERS: { id: 'open' | 'critical' | 'all'; label: string }[] = [
  { id: 'open', label: 'Em aberto' },
  { id: 'critical', label: 'Críticos' },
  { id: 'all', label: 'Todos' },
];

const KIND_STYLE: Record<SecurityAlertKind, string> = {
  privilege_escalation: 'border-destructive/40 bg-destructive/10 text-destructive',
  authz_denied: 'border-primary/40 bg-primary/10 text-primary',
  scope_violation: 'border-accent/40 bg-accent/10 text-accent-foreground',
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return value;
  }
}

export function SecurityAlertsPanel() {
  const { alerts, loading, error, reload, acknowledge, acknowledgeAll, openCount, criticalCount } =
    useSecurityAlerts({ enabled: true, notify: true });
  const [filter, setFilter] = useState<'open' | 'critical' | 'all'>('open');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return alerts.filter((a) => {
      if (filter === 'open' && a.acknowledged) return false;
      if (filter === 'critical' && (a.acknowledged || a.severity !== 'critical')) return false;
      if (!q) return true;
      return (
        (a.tool_name ?? '').toLowerCase().includes(q) ||
        (a.reason ?? '').toLowerCase().includes(q) ||
        (a.user_id ?? '').toLowerCase().includes(q) ||
        (a.request_id ?? '').toLowerCase().includes(q) ||
        (ALERT_LABEL[a.kind] ?? '').toLowerCase().includes(q)
      );
    });
  }, [alerts, filter, query]);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Alertas de segurança
            </CardTitle>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              Avisos automáticos sempre que o servidor recusa uma ação: tentativa de agir como
              administrador, ação fora do catálogo permitido ou conteúdo fora do escopo da conta.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Atualizar
            </Button>
            <Button size="sm" onClick={() => void acknowledgeAll()} disabled={openCount === 0}>
              <Check className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Tratar todos
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={criticalCount > 0 ? 'destructive' : 'secondary'}>
            {criticalCount} crítico{criticalCount === 1 ? '' : 's'}
          </Badge>
          <Badge variant="outline">{openCount} em aberto</Badge>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <Button
                key={f.id}
                size="sm"
                variant={filter === f.id ? 'default' : 'outline'}
                onClick={() => setFilter(f.id)}
                className="min-h-[36px]"
              >
                {f.label}
              </Button>
            ))}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar ação, motivo ou usuário"
                aria-label="Buscar alertas de segurança"
                className="h-9 w-56 pl-8"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {!error && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
            <ShieldCheck className="h-6 w-6 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-sm font-medium">Nenhum alerta {filter === 'all' ? 'registrado' : 'em aberto'}</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Toda tentativa recusada pelo servidor aparece aqui automaticamente, em tempo real.
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <ScrollArea className="h-[520px] pr-2">
            <ul className="space-y-3">
              {filtered.map((a) => (
                <li
                  key={a.id}
                  className={`rounded-lg border p-3 ${a.acknowledged ? 'opacity-60' : ''} ${
                    a.severity === 'critical' ? 'border-destructive/40' : 'border-border'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${KIND_STYLE[a.kind]}`}>
                          {ALERT_LABEL[a.kind] ?? 'Alerta'}
                        </span>
                        {a.severity === 'critical' && (
                          <Badge variant="destructive" className="gap-1">
                            <TriangleAlert className="h-3 w-3" aria-hidden="true" /> Crítico
                          </Badge>
                        )}
                        {a.occurrences > 1 && (
                          <Badge variant="secondary">{a.occurrences} tentativas</Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground">{formatDate(a.created_at)}</span>
                      </div>
                      <p className="break-words text-sm font-medium">
                        {a.tool_name ?? 'Ação desconhecida'}
                      </p>
                      <p className="break-words text-xs text-muted-foreground">
                        {a.reason ?? ALERT_HINT[a.kind]}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Perfil: {a.user_role ?? '—'} · Escopo: {a.content_scope ?? '—'} · Usuário:{' '}
                        <span className="font-mono">{(a.user_id ?? '—').slice(0, 8)}</span> · Requisição:{' '}
                        <span className="font-mono">{(a.request_id ?? '—').slice(0, 8)}</span>
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={a.acknowledged ? 'outline' : 'secondary'}
                      onClick={() => void acknowledge(a.id, !a.acknowledged)}
                      className="min-h-[36px]"
                    >
                      {a.acknowledged ? 'Reabrir' : 'Marcar como tratado'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default SecurityAlertsPanel;
