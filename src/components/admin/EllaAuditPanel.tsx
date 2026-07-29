import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw, Search, FileDown, FileText, X } from 'lucide-react';
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
import { exportAuditCsv, exportAuditPdf, outcomeLabel, roleLabel } from '@/lib/audit-export';

type AuditRow = {
  id: string;
  request_id: string;
  user_id: string;
  user_role: string;
  content_scope: string;
  tool_name: string;
  params: Record<string, unknown> | null;
  allowed: boolean;
  denial_reason: string | null;
  outcome: string;
  result_summary: string | null;
  created_at: string;
};

type ProfileLite = { user_id: string; full_name: string | null; ra: string | null; email: string | null };

type Period = '24h' | '7d' | '30d' | 'all' | 'custom';

const PERIOD_LABEL: Record<Period, string> = {
  '24h': 'Últimas 24 horas',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  all: 'Todo o histórico',
  custom: 'Período personalizado',
};

const OUTCOMES = ['success', 'error', 'denied', 'unknown'] as const;

/** Converte o período escolhido em um intervalo ISO para consultar o banco. */
function periodRange(period: Period, from: string, to: string): { gte?: string; lte?: string } {
  if (period === 'all') return {};
  if (period === 'custom') {
    return {
      gte: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
      lte: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
    };
  }
  const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
  return { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString() };
}

export function EllaAuditPanel() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [tools, setTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<'all' | 'admin' | 'user'>('all');
  const [outcome, setOutcome] = useState<'all' | (typeof OUTCOMES)[number]>('all');
  const [tool, setTool] = useState<string>('all');
  const [period, setPeriod] = useState<Period>('7d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [onlyDenied, setOnlyDenied] = useState(false);
  const [limit, setLimit] = useState('200');

  const load = async () => {
    setLoading(true);
    setError(null);

    const { gte, lte } = periodRange(period, from, to);
    let q = supabase
      .from('ella_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (gte) q = q.gte('created_at', gte);
    if (lte) q = q.lte('created_at', lte);
    if (role !== 'all') q = q.eq('user_role', role);
    if (outcome !== 'all') q = q.eq('outcome', outcome);
    if (tool !== 'all') q = q.eq('tool_name', tool);
    if (onlyDenied) q = q.eq('allowed', false);

    const { data, error: err } = await q.returns<AuditRow[]>();
    if (err) {
      setError('Não foi possível carregar os registros de auditoria.');
      setRows([]);
      setLoading(false);
      return;
    }

    const list = data ?? [];
    setRows(list);
    setTools((prev) => [...new Set([...prev, ...list.map((r) => r.tool_name)])].sort());

    // Nomes dos usuários envolvidos, para busca e exportação legível.
    const ids = [...new Set(list.map((r) => r.user_id))].slice(0, 300);
    if (ids.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, full_name, ra, email')
        .in('user_id', ids)
        .returns<ProfileLite[]>();
      const map: Record<string, ProfileLite> = {};
      for (const p of profs ?? []) map[p.user_id] = p;
      setProfiles(map);
    } else {
      setProfiles({});
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
    // Recarrega sempre que um filtro de servidor muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, outcome, tool, period, from, to, onlyDenied, limit]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const p = profiles[r.user_id];
      return (
        r.tool_name.toLowerCase().includes(q) ||
        r.user_role.toLowerCase().includes(q) ||
        (r.result_summary ?? '').toLowerCase().includes(q) ||
        (r.denial_reason ?? '').toLowerCase().includes(q) ||
        r.request_id.toLowerCase().includes(q) ||
        r.user_id.toLowerCase().includes(q) ||
        (p?.full_name ?? '').toLowerCase().includes(q) ||
        (p?.ra ?? '').toLowerCase().includes(q) ||
        (p?.email ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, profiles, query]);

  const deniedCount = filtered.filter((r) => !r.allowed).length;

  const filterLabel = useMemo(() => {
    const parts: string[] = [
      period === 'custom'
        ? `Período ${from || 'início'} a ${to || 'hoje'}`
        : PERIOD_LABEL[period],
    ];
    if (role !== 'all') parts.push(`Papel: ${roleLabel(role)}`);
    if (outcome !== 'all') parts.push(`Resultado: ${outcomeLabel(outcome)}`);
    if (tool !== 'all') parts.push(`Ação: ${tool}`);
    if (onlyDenied) parts.push('Somente negadas');
    if (query.trim()) parts.push(`Busca: "${query.trim()}"`);
    return parts.join(' · ');
  }, [period, from, to, role, outcome, tool, onlyDenied, query]);

  const exportRows = () =>
    filtered.map((r) => ({
      ...r,
      user_name: profiles[r.user_id]?.full_name ?? null,
      user_ra: profiles[r.user_id]?.ra ?? null,
    }));

  const resetFilters = () => {
    setQuery('');
    setRole('all');
    setOutcome('all');
    setTool('all');
    setPeriod('7d');
    setFrom('');
    setTo('');
    setOnlyDenied(false);
    setLimit('200');
  };

  const hasFilters =
    query.trim() !== '' || role !== 'all' || outcome !== 'all' || tool !== 'all' || period !== '7d' || onlyDenied;

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
              Auditoria da assistente
            </CardTitle>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              Toda ação solicitada à Ella é autorizada no servidor e registrada aqui — com usuário, papel,
              ferramenta, parâmetros e resultado. Use os filtros para consultar e exportar.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {deniedCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <ShieldAlert className="h-3 w-3" />
                {deniedCount} negada{deniedCount > 1 ? 's' : ''}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-9 gap-2">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              disabled={filtered.length === 0}
              onClick={() => exportAuditCsv(exportRows(), filterLabel)}
            >
              <FileDown className="h-3.5 w-3.5" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              disabled={filtered.length === 0}
              onClick={() => exportAuditPdf(exportRows(), filterLabel)}
            >
              <FileText className="h-3.5 w-3.5" />
              PDF
            </Button>
          </div>
        </div>

        {/* Filtros avançados */}
        <div className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="audit-search" className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="audit-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nome, RA, e-mail, ação ou requisição…"
                className="h-10 pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Papel</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="user">Aluno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Resultado</Label>
            <Select value={outcome} onValueChange={(v) => setOutcome(v as typeof outcome)}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {OUTCOMES.map((o) => (
                  <SelectItem key={o} value={o}>{outcomeLabel(o)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Tipo de ação</Label>
            <Select value={tool} onValueChange={setTool}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {tools.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Período</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
                  <SelectItem key={p} value={p}>{PERIOD_LABEL[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {period === 'custom' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="audit-from" className="text-[11px] uppercase tracking-wide text-muted-foreground">De</Label>
                <Input id="audit-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="audit-to" className="text-[11px] uppercase tracking-wide text-muted-foreground">Até</Label>
                <Input id="audit-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10" />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Registros</Label>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['100', '200', '500', '1000'].map((n) => (
                  <SelectItem key={n} value={n}>Até {n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button
              variant={onlyDenied ? 'default' : 'outline'}
              size="sm"
              className="h-10 flex-1"
              onClick={() => setOnlyDenied((v) => !v)}
            >
              Somente negadas
            </Button>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-10 gap-1" onClick={resetFilters}>
                <X className="h-3.5 w-3.5" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          {loading ? 'Carregando…' : `${filtered.length} registro(s) · ${filterLabel}`}
        </p>
      </CardHeader>

      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && !loading && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum registro para os filtros selecionados.
          </p>
        )}

        <ScrollArea className="max-h-[520px]">
          <div className="space-y-2 pr-2">
            {filtered.map((r) => {
              const p = profiles[r.user_id];
              return (
                <div
                  key={r.id}
                  className={`rounded-lg border p-3 text-sm ${r.allowed ? 'border-border/60' : 'border-destructive/50 bg-destructive/5'}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold">{r.tool_name}</span>
                    <Badge variant={r.allowed ? 'secondary' : 'destructive'} className="text-[10px]">
                      {outcomeLabel(r.outcome)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{roleLabel(r.user_role)}</Badge>
                    {r.content_scope !== 'full' && (
                      <Badge variant="outline" className="text-[10px]">escopo: {r.content_scope}</Badge>
                    )}
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs font-medium">
                    {p?.full_name?.trim() || `Usuário ${r.user_id.slice(0, 8)}`}
                    {p?.ra && <span className="ml-1 font-normal text-muted-foreground">· RA {p.ra}</span>}
                  </p>

                  {(r.denial_reason || r.result_summary) && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {r.denial_reason ?? r.result_summary}
                    </p>
                  )}

                  <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground/70">
                    req {r.request_id.slice(0, 8)} · user {r.user_id.slice(0, 8)} ·{' '}
                    {JSON.stringify(r.params ?? {}).slice(0, 160)}
                  </p>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default EllaAuditPanel;
