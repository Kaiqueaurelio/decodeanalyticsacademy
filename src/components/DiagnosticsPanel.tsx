/**
 * DiagnosticsPanel — Página de diagnóstico do admin.
 *
 * Agrega tudo que coletamos client-side em uma única visão:
 *  - Logs de runtime (erros JS, rejeições, console.error)
 *  - Falhas de carregamento (chunks, network errors, slow fetches)
 *  - Desempenho por rota (tempo médio, navegações lentas)
 *  - Status do Modo Seguro
 *
 * Atualiza em tempo real ouvindo os eventos `decode:perf-update`,
 * `decode:runtime-update` e `decode:safe-mode-change`.
 */
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity, AlertTriangle, Trash2, RefreshCw, Rocket, ShieldAlert, Clock,
  Bug, Network, ChevronRight, CheckCircle2, ShieldCheck, KeyRound,
} from 'lucide-react';
import { getEvents, clearEvents, summarizeEvents, PERF_THRESHOLDS, type PerfEvent } from '@/lib/perf-monitor';
import {
  getRuntimeErrors, getRouteTimings, clearRuntimeLogs, bucketRoute,
  type RuntimeError, type RouteTiming,
} from '@/lib/runtime-logs';
import { getAuthEvents, clearAuthEvents, type AuthLogEntry } from '@/lib/auth-log';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { isSafeModeEnabled, isSafeModeManual, disableSafeMode, getRecentFailures } from '@/lib/safe-mode';
import { cn } from '@/lib/utils';

function useLiveData() {
  const [perfEvents, setPerfEvents] = useState<PerfEvent[]>(() => getEvents());
  const [errors, setErrors] = useState<RuntimeError[]>(() => getRuntimeErrors());
  const [timings, setTimings] = useState<RouteTiming[]>(() => getRouteTimings());
  const [authEvents, setAuthEvents] = useState<AuthLogEntry[]>(() => getAuthEvents());
  const [safeMode, setSafeMode] = useState({
    enabled: isSafeModeEnabled(),
    manual: isSafeModeManual(),
    failures: getRecentFailures(),
  });

  useEffect(() => {
    const refresh = () => {
      setPerfEvents(getEvents());
      setErrors(getRuntimeErrors());
      setTimings(getRouteTimings());
      setAuthEvents(getAuthEvents());
      setSafeMode({
        enabled: isSafeModeEnabled(),
        manual: isSafeModeManual(),
        failures: getRecentFailures(),
      });
    };
    window.addEventListener('decode:perf-update', refresh);
    window.addEventListener('decode:runtime-update', refresh);
    window.addEventListener('decode:auth-log-update', refresh);
    window.addEventListener('decode:safe-mode-change', refresh);
    const interval = setInterval(refresh, 5000);
    return () => {
      window.removeEventListener('decode:perf-update', refresh);
      window.removeEventListener('decode:runtime-update', refresh);
      window.removeEventListener('decode:auth-log-update', refresh);
      window.removeEventListener('decode:safe-mode-change', refresh);
      clearInterval(interval);
    };
  }, []);

  return { perfEvents, errors, timings, authEvents, safeMode };
}

/** Estatísticas agregadas por bucket de rota. */
function aggregateByRoute(timings: RouteTiming[], perfEvents: PerfEvent[], errors: RuntimeError[]) {
  const buckets = new Map<string, { count: number; totalMs: number; maxMs: number; slow: number; errors: number }>();
  const ensure = (k: string) => {
    if (!buckets.has(k)) buckets.set(k, { count: 0, totalMs: 0, maxMs: 0, slow: 0, errors: 0 });
    return buckets.get(k)!;
  };

  for (const t of timings) {
    const b = ensure(bucketRoute(t.route));
    b.count += 1;
    b.totalMs += t.duration;
    b.maxMs = Math.max(b.maxMs, t.duration);
  }

  for (const ev of perfEvents) {
    if (ev.kind === 'page-load') {
      const b = ensure(bucketRoute(ev.route));
      if (ev.slow) b.slow += 1;
    }
  }

  for (const e of errors) {
    const b = ensure(bucketRoute(e.route));
    b.errors += 1;
  }

  return Array.from(buckets.entries())
    .map(([route, data]) => ({
      route,
      count: data.count,
      avgMs: data.count ? Math.round(data.totalMs / data.count) : 0,
      maxMs: data.maxMs,
      slow: data.slow,
      errors: data.errors,
    }))
    .sort((a, b) => b.errors - a.errors || b.maxMs - a.maxMs);
}

export function DiagnosticsPanel() {
  const { perfEvents, errors, timings, authEvents, safeMode } = useLiveData();
  const auth = useAuth();
  const { data: profile } = useUserProfile(auth.user?.id);
  const scope = profile?.content_scope ?? 'full';
  const allowedAreas = scope === 'enem_only'
    ? ['Dashboard', 'Apostilas ENEM', 'Exercícios', 'Revisão', 'Desempenho', 'Perfil', 'Ella (Tutora ENEM)']
    : ['Dashboard', 'Todas as apostilas', 'Exercícios', 'Simulados', 'Flashcards', 'Biblioteca', 'Livros', 'Cursos', 'Calculadora', 'Comunidade', 'Tira-dúvidas', 'Notícias', 'Ella', 'Perfil'];
  const summary = useMemo(() => summarizeEvents(perfEvents), [perfEvents]);
  const routeStats = useMemo(() => aggregateByRoute(timings, perfEvents, errors), [timings, perfEvents, errors]);

  const networkErrors = perfEvents.filter((e): e is Extract<PerfEvent, { kind: 'network-error' }> => e.kind === 'network-error');
  const slowFetches = perfEvents.filter((e): e is Extract<PerfEvent, { kind: 'slow-fetch' }> => e.kind === 'slow-fetch');
  const slowLoads = perfEvents.filter((e): e is Extract<PerfEvent, { kind: 'page-load' }> => e.kind === 'page-load' && e.slow);

  const lastRefresh = useMemo(
    () => [...authEvents].reverse().find((e) => e.event === 'refresh_success' || e.event === 'refresh_settled'),
    [authEvents],
  );

  const clearAll = () => {
    clearEvents();
    clearRuntimeLogs();
    clearAuthEvents();
  };

  return (
    <div className="space-y-4">
      {/* Cards de status no topo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Bug className="h-4 w-4" />}
          label="Erros runtime"
          value={errors.length}
          tone={errors.length > 5 ? 'danger' : errors.length > 0 ? 'warn' : 'ok'}
        />
        <StatCard
          icon={<Network className="h-4 w-4" />}
          label="Falhas de rede"
          value={networkErrors.length}
          tone={networkErrors.length > 5 ? 'danger' : networkErrors.length > 0 ? 'warn' : 'ok'}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Carregamentos lentos"
          value={slowLoads.length + slowFetches.length}
          tone={slowLoads.length > 0 ? 'warn' : 'ok'}
        />
        <StatCard
          icon={<Rocket className="h-4 w-4" />}
          label="Carregamento médio"
          value={`${summary.avgLoad}ms`}
          tone={summary.avgLoad > PERF_THRESHOLDS.pageLoad ? 'warn' : 'ok'}
        />
      </div>

      {/* Banner do Modo Seguro */}
      {safeMode.enabled && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Modo Seguro {safeMode.manual ? 'ativado manualmente' : 'ativado automaticamente'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Componentes pesados estão desativados. {safeMode.failures.length} falha(s) recente(s) na sessão.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => disableSafeMode()}>
              Desativar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 justify-between">
        <p className="text-xs text-muted-foreground">
          Atualiza em tempo real · sessão atual ({summary.total + errors.length + timings.length} eventos)
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Recarregar
          </Button>
          <Button size="sm" variant="outline" onClick={clearAll}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Limpar logs
          </Button>
        </div>
      </div>

      {/* Conteúdo em abas */}
      <Tabs defaultValue="auth" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="auth" className="gap-1.5 text-xs"><ShieldCheck className="h-3.5 w-3.5" />Auth</TabsTrigger>
          <TabsTrigger value="routes" className="gap-1.5 text-xs"><Activity className="h-3.5 w-3.5" />Rotas</TabsTrigger>
          <TabsTrigger value="errors" className="gap-1.5 text-xs"><Bug className="h-3.5 w-3.5" />Erros ({errors.length})</TabsTrigger>
          <TabsTrigger value="network" className="gap-1.5 text-xs"><Network className="h-3.5 w-3.5" />Rede ({networkErrors.length + slowFetches.length})</TabsTrigger>
          <TabsTrigger value="loads" className="gap-1.5 text-xs"><Clock className="h-3.5 w-3.5" />Loads ({summary.pageLoads})</TabsTrigger>
        </TabsList>

        {/* Auth */}
        <TabsContent value="auth" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" /> Estado de autenticação
              </CardTitle>
              <CardDescription className="text-xs">Sessão atual, expiração do token e histórico do fluxo de auth.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <InfoTile label="Status" value={auth.status} tone={auth.status === 'authenticated' ? 'ok' : auth.status === 'unauthenticated' ? 'danger' : 'warn'} />
                <InfoTile label="Papel" value={auth.isAdmin ? 'admin' : auth.user ? 'aluno' : '—'} />
                <InfoTile label="Escopo" value={scope} tone={scope === 'enem_only' ? 'warn' : 'ok'} />
                <InfoTile label="Bloqueado" value={auth.isBlocked ? 'sim' : 'não'} tone={auth.isBlocked ? 'danger' : 'ok'} />
              </div>

              <div className="border border-border/60 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Áreas acessíveis ({allowedAreas.length})</span>
                  <Badge variant="outline" className="text-[10px] font-mono">{scope === 'enem_only' ? 'restrito ao ENEM' : 'acesso completo'}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allowedAreas.map((area) => (
                    <Badge key={area} variant="outline" className="text-[10px] font-normal">{area}</Badge>
                  ))}
                </div>
              </div>

              <div className="border border-border/60 rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Usuário</span><span className="font-mono truncate max-w-[60%] text-right">{auth.user?.email ?? '—'}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">RA</span><span className="font-mono truncate max-w-[60%] text-right">{profile?.ra ?? '—'}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">User ID</span><span className="font-mono truncate max-w-[60%] text-right">{auth.user?.id ?? '—'}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Renovando</span><span className="font-mono">{auth.isRefreshingToken ? 'sim' : 'não'}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Token expira em</span><span className="font-mono">{formatExpiry(auth.session?.expires_at)}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Última renovação</span><span className="font-mono">{lastRefresh ? formatTime(lastRefresh.ts) : '—'}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Sessão hidratada</span><span className="font-mono">{auth.isSessionHydrated ? 'sim' : 'não'}</span></div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">Histórico do fluxo ({authEvents.length})</p>
                <Button size="sm" variant="ghost" onClick={() => void auth.refreshSession()}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Renovar agora
                </Button>
              </div>

              {authEvents.length === 0 ? (
                <EmptyState message="Nenhum evento de auth capturado nesta sessão." />
              ) : (
                <ScrollArea className="h-[280px] pr-2">
                  <div className="space-y-1">
                    {[...authEvents].reverse().map((e, i) => (
                      <div key={i} className="border border-border/60 rounded p-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className={cn(
                            'text-[10px] font-mono',
                            e.event.includes('error') && 'text-destructive border-destructive/40',
                            e.event.includes('success') && 'text-[hsl(var(--success))] border-[hsl(var(--success))]/40',
                          )}>
                            {e.event}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{formatTime(e.ts)}</span>
                        </div>
                        {e.data && Object.keys(e.data).length > 0 && (
                          <pre className="mt-1 text-[10px] text-muted-foreground overflow-x-auto font-mono">
                            {JSON.stringify(e.data, null, 0)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        {/* Rotas */}
        <TabsContent value="routes" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Desempenho por rota</CardTitle>
              <CardDescription className="text-xs">Tempo de permanência, carregamentos lentos e erros agregados.</CardDescription>
            </CardHeader>
            <CardContent>
              {routeStats.length === 0 ? (
                <EmptyState message="Nenhuma navegação registrada ainda — use o app para coletar dados." />
              ) : (
                <div className="space-y-2">
                  {routeStats.map((r) => (
                    <div key={r.route} className="border border-border/60 rounded-lg p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-3.5 w-3.5 text-primary" />
                          <span className="font-medium text-sm capitalize">{r.route}</span>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {r.errors > 0 && <Badge variant="outline" className="text-destructive border-destructive/40 text-[10px] gap-1"><Bug className="h-2.5 w-2.5" />{r.errors}</Badge>}
                          {r.slow > 0 && <Badge variant="outline" className="text-[10px] gap-1" style={{ color: 'hsl(var(--primary))' }}><Clock className="h-2.5 w-2.5" />{r.slow} lento(s)</Badge>}
                          <Badge variant="outline" className="text-[10px]">{r.count} navegação(ões)</Badge>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                        <div>Médio: <span className="font-mono text-foreground">{formatDuration(r.avgMs)}</span></div>
                        <div>Máximo: <span className="font-mono text-foreground">{formatDuration(r.maxMs)}</span></div>
                        <div>Status: <span className={cn('font-medium', r.errors > 0 ? 'text-destructive' : r.slow > 0 ? 'text-primary' : 'text-[hsl(var(--success))]')}>{r.errors > 0 ? 'instável' : r.slow > 0 ? 'lento' : 'ok'}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Erros runtime */}
        <TabsContent value="errors" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Logs de runtime</CardTitle>
              <CardDescription className="text-xs">Erros de JavaScript, rejeições não tratadas e mensagens de console.error.</CardDescription>
            </CardHeader>
            <CardContent>
              {errors.length === 0 ? (
                <EmptyState message="Nenhum erro de runtime registrado nesta sessão." success />
              ) : (
                <ScrollArea className="h-[400px] pr-2">
                  <div className="space-y-1.5">
                    {[...errors].reverse().map((e, i) => (
                      <div key={i} className="border border-border/60 rounded p-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className={cn(
                            'text-[10px]',
                            e.kind === 'error' && 'text-destructive border-destructive/40',
                            e.kind === 'rejection' && 'text-primary border-primary/40',
                            e.kind === 'console' && 'text-muted-foreground',
                          )}>
                            {e.kind}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {bucketRoute(e.route)} · {formatTime(e.ts)}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-foreground break-words">{e.message}</p>
                        {e.source && <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{e.source}</p>}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rede */}
        <TabsContent value="network" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Falhas e lentidão de rede</CardTitle>
              <CardDescription className="text-xs">Requisições com status &gt;= 400 e fetches acima de {PERF_THRESHOLDS.fetch}ms.</CardDescription>
            </CardHeader>
            <CardContent>
              {networkErrors.length + slowFetches.length === 0 ? (
                <EmptyState message="Nenhuma falha de rede registrada." success />
              ) : (
                <ScrollArea className="h-[400px] pr-2">
                  <div className="space-y-1.5">
                    {[...networkErrors, ...slowFetches]
                      .sort((a, b) => b.ts - a.ts)
                      .map((e, i) => (
                        <div key={i} className="border border-border/60 rounded p-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className={cn(
                                'text-[10px]',
                                e.kind === 'network-error' ? 'text-destructive border-destructive/40' : 'text-primary border-primary/40',
                              )}>
                                {e.kind === 'network-error' ? `${e.status || 'ERR'}` : 'lento'}
                              </Badge>
                              <span className="font-mono text-[10px] text-muted-foreground">{e.method}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{formatTime(e.ts)}</span>
                          </div>
                          <p className="mt-1 font-mono text-[11px] break-words text-foreground">{e.url}</p>
                          {e.kind === 'network-error' && e.message && (
                            <p className="text-[10px] text-destructive mt-0.5">{e.message}</p>
                          )}
                          {e.kind === 'slow-fetch' && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{formatDuration(e.duration)}</p>
                          )}
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loads */}
        <TabsContent value="loads" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Carregamentos de página</CardTitle>
              <CardDescription className="text-xs">Tempo total de load e LCP por rota visitada.</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.pageLoads === 0 ? (
                <EmptyState message="Nenhum carregamento de página capturado." />
              ) : (
                <ScrollArea className="h-[400px] pr-2">
                  <div className="space-y-1.5">
                    {perfEvents
                      .filter((e): e is Extract<PerfEvent, { kind: 'page-load' }> => e.kind === 'page-load')
                      .reverse()
                      .map((e, i) => (
                        <div key={i} className={cn(
                          'border rounded p-2 text-xs',
                          e.slow ? 'border-primary/40 bg-primary/5' : 'border-border/60',
                        )}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] text-foreground">{e.route}</span>
                            <span className="text-[10px] text-muted-foreground">{formatTime(e.ts)}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                            <span>Load: <span className="font-mono text-foreground">{formatDuration(e.duration)}</span></span>
                            {e.lcp !== undefined && <span>LCP: <span className="font-mono text-foreground">{formatDuration(e.lcp)}</span></span>}
                            {e.slow && <Badge variant="outline" className="text-[9px] text-primary border-primary/40">lento</Badge>}
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: 'ok' | 'warn' | 'danger';
}) {
  const toneClass = {
    ok: 'text-[hsl(var(--success))]',
    warn: 'text-primary',
    danger: 'text-destructive',
  }[tone];
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
          <span className={toneClass}>{icon}</span>
          {label}
        </div>
        <p className={cn('text-xl font-semibold mt-1 font-mono', toneClass)}>{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message, success }: { message: string; success?: boolean }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      {success ? (
        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--success))] opacity-60" />
      ) : (
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
      )}
      <p className="text-xs">{message}</p>
    </div>
  );
}

function InfoTile({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'ok' | 'warn' | 'danger' | 'neutral' }) {
  const toneClass = {
    ok: 'text-[hsl(var(--success))]',
    warn: 'text-primary',
    danger: 'text-destructive',
    neutral: 'text-foreground',
  }[tone];
  return (
    <div className="border border-border/60 rounded-lg p-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn('text-sm font-mono font-medium mt-0.5', toneClass)}>{value}</p>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatExpiry(expiresAt: number | undefined): string {
  if (!expiresAt) return '—';
  const ms = expiresAt * 1000 - Date.now();
  if (ms <= 0) return 'expirado';
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}min`;
}
