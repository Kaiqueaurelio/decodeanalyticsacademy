import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, AlertTriangle, Clock, Wifi, Trash2, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { getEvents, clearEvents, summarizeEvents, PERF_THRESHOLDS, type PerfEvent } from '@/lib/perf-monitor';
import { toast } from 'sonner';

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function PerformanceMetrics() {
  const [events, setEvents] = useState<PerfEvent[]>([]);
  const [filter, setFilter] = useState<'all' | 'slow' | 'errors'>('all');

  const refresh = () => setEvents(getEvents());

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('decode:perf-update', handler);
    const interval = window.setInterval(refresh, 5000);
    return () => {
      window.removeEventListener('decode:perf-update', handler);
      window.clearInterval(interval);
    };
  }, []);

  const summary = useMemo(() => summarizeEvents(events), [events]);

  const filtered = useMemo(() => {
    const sorted = [...events].sort((a, b) => b.ts - a.ts);
    if (filter === 'slow') return sorted.filter((e) => e.kind === 'page-load' && e.slow || e.kind === 'slow-fetch');
    if (filter === 'errors') return sorted.filter((e) => e.kind === 'network-error');
    return sorted;
  }, [events, filter]);

  const handleClear = () => {
    clearEvents();
    toast.success('Histórico de métricas limpo');
  };

  const healthBadge = () => {
    if (summary.networkErrors > 5 || summary.slowLoadCount > 5) {
      return <Badge variant="destructive" className="gap-1"><TrendingDown className="h-3 w-3" /> Atenção</Badge>;
    }
    if (summary.networkErrors > 0 || summary.slowLoadCount > 0) {
      return <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"><AlertTriangle className="h-3 w-3" /> Aviso</Badge>;
    }
    return <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"><TrendingUp className="h-3 w-3" /> Saudável</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Métricas de Performance
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Resumo dos últimos {events.length} eventos coletados neste navegador
            </p>
          </div>
          <div className="flex items-center gap-2">
            {healthBadge()}
            <Button size="icon" variant="ghost" onClick={refresh} className="h-8 w-8">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              icon={<Clock className="h-4 w-4" />}
              label="Tempo médio"
              value={summary.avgLoad ? `${summary.avgLoad}ms` : '—'}
              hint={`em ${summary.pageLoads} carregamentos`}
              tone={summary.avgLoad > PERF_THRESHOLDS.pageLoad ? 'danger' : 'default'}
            />
            <MetricCard
              icon={<TrendingDown className="h-4 w-4" />}
              label="Páginas lentas"
              value={String(summary.slowLoadCount)}
              hint={`> ${PERF_THRESHOLDS.pageLoad / 1000}s`}
              tone={summary.slowLoadCount > 0 ? 'warning' : 'default'}
            />
            <MetricCard
              icon={<Wifi className="h-4 w-4" />}
              label="Erros de rede"
              value={String(summary.networkErrors)}
              hint="status ≥ 400 ou falhas"
              tone={summary.networkErrors > 0 ? 'danger' : 'default'}
            />
            <MetricCard
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Requisições lentas"
              value={String(summary.slowFetches)}
              hint={`> ${PERF_THRESHOLDS.fetch / 1000}s`}
              tone={summary.slowFetches > 0 ? 'warning' : 'default'}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-sm">Eventos recentes</CardTitle>
          <div className="flex items-center gap-1">
            {(['all', 'slow', 'errors'] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'default' : 'ghost'}
                className="h-7 text-xs"
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'Todos' : f === 'slow' ? 'Lentos' : 'Erros'}
              </Button>
            ))}
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive" onClick={handleClear}>
              <Trash2 className="h-3 w-3" /> Limpar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[420px]">
            {filtered.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-12">
                Nenhum evento registrado.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((e, i) => (
                  <EventRow key={`${e.ts}-${i}`} event={e} />
                ))}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon, label, value, hint, tone,
}: { icon: React.ReactNode; label: string; value: string; hint: string; tone: 'default' | 'warning' | 'danger' }) {
  const toneClass =
    tone === 'danger' ? 'border-destructive/30 bg-destructive/5'
    : tone === 'warning' ? 'border-amber-500/30 bg-amber-500/5'
    : 'border-border bg-muted/30';
  const iconClass =
    tone === 'danger' ? 'text-destructive'
    : tone === 'warning' ? 'text-amber-600 dark:text-amber-400'
    : 'text-muted-foreground';

  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <div className={`flex items-center gap-1.5 text-xs font-medium ${iconClass}`}>
        {icon} {label}
      </div>
      <div className="text-2xl font-bold mt-1 tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function EventRow({ event }: { event: PerfEvent }) {
  if (event.kind === 'page-load') {
    return (
      <li className="flex items-start justify-between gap-3 px-4 py-2.5 text-xs">
        <div className="flex items-start gap-2 min-w-0">
          <Clock className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${event.slow ? 'text-amber-500' : 'text-muted-foreground'}`} />
          <div className="min-w-0">
            <div className="font-medium truncate">{event.route}</div>
            <div className="text-[10px] text-muted-foreground">
              {event.duration}ms{event.lcp ? ` · LCP ${event.lcp}ms` : ''}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          {event.slow && <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] mb-1">lento</Badge>}
          <div className="text-[10px] text-muted-foreground">{formatTime(event.ts)}</div>
        </div>
      </li>
    );
  }
  if (event.kind === 'network-error') {
    return (
      <li className="flex items-start justify-between gap-3 px-4 py-2.5 text-xs">
        <div className="flex items-start gap-2 min-w-0">
          <Wifi className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" />
          <div className="min-w-0">
            <div className="font-medium truncate">{event.method} {event.url}</div>
            <div className="text-[10px] text-muted-foreground truncate">
              {event.status || 'falha'}{event.message ? ` · ${event.message}` : ''}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <Badge variant="destructive" className="text-[10px] mb-1">{event.status || 'erro'}</Badge>
          <div className="text-[10px] text-muted-foreground">{formatTime(event.ts)}</div>
        </div>
      </li>
    );
  }
  return (
    <li className="flex items-start justify-between gap-3 px-4 py-2.5 text-xs">
      <div className="flex items-start gap-2 min-w-0">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
        <div className="min-w-0">
          <div className="font-medium truncate">{event.method} {event.url}</div>
          <div className="text-[10px] text-muted-foreground">{event.duration}ms</div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] mb-1">lento</Badge>
        <div className="text-[10px] text-muted-foreground">{formatTime(event.ts)}</div>
      </div>
    </li>
  );
}
