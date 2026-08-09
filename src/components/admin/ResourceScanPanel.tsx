/**
 * ResourceScanPanel — Varredura de componentes ausentes e recursos externos/internos.
 *
 * Roda a análise do DOM + validação HTTP (HEAD) de imagens, fontes, CSS,
 * scripts e ícones, consolidando um relatório único exportável em JSON.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ScanLine, Image as ImageIcon, Type, FileCode2, Braces, Star, CheckCircle2,
  AlertTriangle, Download, Loader2, Boxes,
} from 'lucide-react';
import { runResourceScan, type ResourceKind, type ScanReport } from '@/lib/asset-scan';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const KIND_META: Record<ResourceKind, { label: string; icon: typeof ImageIcon }> = {
  image: { label: 'Imagens', icon: ImageIcon },
  font: { label: 'Fontes', icon: Type },
  stylesheet: { label: 'Folhas de estilo', icon: FileCode2 },
  script: { label: 'Scripts', icon: Braces },
  icon: { label: 'Ícones / Manifest', icon: Star },
  other: { label: 'Outros', icon: Boxes },
};

const APP_ROUTES = [
  '/', '/login', '/dashboard', '/apostilas', '/exercicios', '/simulado', '/flashcards',
  '/biblioteca', '/livros', '/cursos', '/calculadora', '/comunidade', '/tira-duvidas',
  '/noticias', '/ella', '/perfil', '/desempenho', '/admin',
];

export function ResourceScanPanel() {
  const [report, setReport] = useState<ScanReport | null>(null);
  const [running, setRunning] = useState(false);

  const scan = async () => {
    setRunning(true);
    try {
      const result = await runResourceScan(APP_ROUTES);
      setReport(result);
      if (result.resumo.comFalha === 0 && result.resumo.componentesAusentes === 0) {
        toast.success('Varredura concluída: nenhum recurso ausente.');
      } else {
        toast.warning(`Varredura concluída: ${result.resumo.comFalha} recurso(s) com problema.`);
      }
    } catch (err) {
      toast.error('Falha ao executar a varredura', {
        description: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    } finally {
      setRunning(false);
    }
  };

  const exportReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `varredura-recursos-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const failing = report?.recursos.filter((r) => !r.ok) ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanLine className="h-4 w-4 text-primary" />
              Varredura de Componentes e Recursos
            </CardTitle>
            <CardDescription className="text-xs">
              Analisa a árvore renderizada e valida imagens, fontes, CSS, scripts e ícones via HTTP.
            </CardDescription>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" onClick={scan} disabled={running} className="gap-2">
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanLine className="h-3.5 w-3.5" />}
              {running ? 'Analisando…' : 'Executar varredura'}
            </Button>
            <Button size="sm" variant="outline" onClick={exportReport} disabled={!report} className="gap-2">
              <Download className="h-3.5 w-3.5" />
              JSON
            </Button>
          </div>
        </CardHeader>

        {report && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric label="Recursos" value={report.resumo.totalRecursos} />
              <Metric label="Com falha" value={report.resumo.comFalha} tone={report.resumo.comFalha ? 'bad' : 'good'} />
              <Metric
                label="Componentes ausentes"
                value={report.resumo.componentesAusentes}
                tone={report.resumo.componentesAusentes ? 'bad' : 'good'}
              />
              <Metric label="Caminhos esperados" value={report.caminhosEsperados.length} />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(KIND_META) as ResourceKind[]).map((kind) => {
                const stats = report.resumo.porTipo[kind];
                if (!stats?.total) return null;
                const Icon = KIND_META[kind].icon;
                return (
                  <div key={kind} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                      {KIND_META[kind].label}
                    </span>
                    <Badge variant={stats.falhas ? 'destructive' : 'secondary'} className="text-[10px]">
                      {stats.total - stats.falhas}/{stats.total} OK
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {report && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Componentes renderizados</CardTitle>
              <CardDescription className="text-xs">Comparação entre a árvore esperada e o DOM atual ({report.rota}).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {report.componentes.map((c) => (
                <div key={c.seletor} className="flex items-center justify-between gap-3 rounded-md border border-border/50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{c.nome}</p>
                    <p className="truncate font-mono text-[10px] text-muted-foreground">{c.seletor}</p>
                  </div>
                  {c.encontrado ? (
                    <Badge variant="secondary" className="shrink-0 gap-1 text-[10px]">
                      <CheckCircle2 className="h-3 w-3" /> Renderizado
                    </Badge>
                  ) : (
                    <Badge variant={c.obrigatorio ? 'destructive' : 'outline'} className="shrink-0 gap-1 text-[10px]">
                      <AlertTriangle className="h-3 w-3" /> {c.obrigatorio ? 'Ausente' : 'Não nesta rota'}
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recursos com problema</CardTitle>
              <CardDescription className="text-xs">Caminho esperado e status HTTP retornado.</CardDescription>
            </CardHeader>
            <CardContent>
              {failing.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Todos os {report.resumo.totalRecursos} recursos responderam com sucesso.
                </p>
              ) : (
                <ScrollArea className="max-h-72">
                  <div className="space-y-1.5 pr-3">
                    {failing.map((r, i) => (
                      <div key={`${r.caminho_esperado}-${i}`} className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="text-[10px]">{KIND_META[r.kind].label}</Badge>
                          <Badge variant="destructive" className="text-[10px]">
                            HTTP {r.status_http || '—'}
                          </Badge>
                        </div>
                        <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">{r.caminho_esperado}</p>
                        {r.detalhe && <p className="mt-0.5 text-[10px] text-destructive">{r.detalhe}</p>}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Caminhos esperados</CardTitle>
              <CardDescription className="text-xs">
                Assets e rotas declarados no código-fonte. Destacados os que não foram localizados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <div className="space-y-1 pr-3">
                  {report.caminhosEsperados.map((p) => {
                    const missing = report.caminhosNaoEncontrados.includes(p);
                    return (
                      <p
                        key={p}
                        className={cn(
                          'break-all rounded px-2 py-1 font-mono text-[10px]',
                          missing ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground',
                        )}
                      >
                        {p}
                      </p>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: 'good' | 'bad' }) {
  return (
    <div className="rounded-lg border border-border/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('text-lg font-semibold', tone === 'bad' && 'text-destructive', tone === 'good' && 'text-emerald-500')}>
        {value}
      </p>
    </div>
  );
}
