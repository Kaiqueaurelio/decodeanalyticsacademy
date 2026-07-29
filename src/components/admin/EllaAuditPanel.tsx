import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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

const OUTCOME_LABEL: Record<string, string> = {
  success: 'Concluída',
  error: 'Falhou',
  denied: 'Negada',
  unknown: 'Indefinida',
};

export function EllaAuditPanel() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [onlyDenied, setOnlyDenied] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('ella_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (err) setError('Não foi possível carregar os registros de auditoria.');
    setRows((data as AuditRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (onlyDenied && r.allowed) return false;
      if (!q) return true;
      return (
        r.tool_name.toLowerCase().includes(q) ||
        r.user_role.toLowerCase().includes(q) ||
        (r.result_summary ?? '').toLowerCase().includes(q) ||
        r.request_id.toLowerCase().includes(q)
      );
    });
  }, [rows, query, onlyDenied]);

  const deniedCount = rows.filter((r) => !r.allowed).length;

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
              Auditoria da assistente
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Toda ação solicitada à Ella é autorizada no servidor e registrada aqui — com usuário, papel,
              ferramenta, parâmetros e resultado.
            </p>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar por ferramenta, papel ou resultado…"
              className="h-10 pl-9"
              aria-label="Filtrar registros de auditoria"
            />
          </div>
          <Button
            variant={onlyDenied ? 'default' : 'outline'}
            size="sm"
            className="h-10"
            onClick={() => setOnlyDenied((v) => !v)}
          >
            Somente negadas
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && !loading && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum registro por enquanto.</p>
        )}

        <ScrollArea className="max-h-[520px]">
          <div className="space-y-2 pr-2">
            {filtered.map((r) => (
              <div
                key={r.id}
                className={`rounded-lg border p-3 text-sm ${r.allowed ? 'border-border/60' : 'border-destructive/50 bg-destructive/5'}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold">{r.tool_name}</span>
                  <Badge variant={r.allowed ? 'secondary' : 'destructive'} className="text-[10px]">
                    {OUTCOME_LABEL[r.outcome] ?? r.outcome}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {r.user_role === 'admin' ? 'Administrador' : 'Aluno'}
                  </Badge>
                  {r.content_scope !== 'full' && (
                    <Badge variant="outline" className="text-[10px]">escopo: {r.content_scope}</Badge>
                  )}
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>

                {(r.denial_reason || r.result_summary) && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {r.denial_reason ?? r.result_summary}
                  </p>
                )}

                <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground/70">
                  req {r.request_id.slice(0, 8)} · user {r.user_id.slice(0, 8)} ·{' '}
                  {JSON.stringify(r.params ?? {}).slice(0, 160)}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default EllaAuditPanel;
