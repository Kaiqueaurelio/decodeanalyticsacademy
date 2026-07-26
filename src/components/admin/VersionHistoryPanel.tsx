import { useMemo, useState } from 'react';
import { History, Search, Download, Server, GitCommit, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CHANGELOG,
  CHANGE_KIND_LABEL,
  getBuildInfo,
  type ChangeKind,
} from '@/data/changelog';

const KIND_CLASS: Record<ChangeKind, string> = {
  feature: 'bg-primary/12 text-primary border-primary/30',
  fix: 'bg-destructive/12 text-destructive border-destructive/30',
  improvement: 'bg-accent/12 text-accent border-accent/30',
  security: 'bg-muted text-foreground border-border',
  content: 'bg-secondary text-secondary-foreground border-border',
};

const FILTERS: ({ id: 'all' } | { id: ChangeKind })[] = [
  { id: 'all' },
  { id: 'feature' },
  { id: 'improvement' },
  { id: 'fix' },
  { id: 'security' },
  { id: 'content' },
];

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function VersionHistoryPanel() {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | ChangeKind>('all');
  const build = useMemo(() => getBuildInfo(), []);

  const releases = useMemo(() => {
    const term = query.trim().toLowerCase();
    return CHANGELOG.map((release) => ({
      ...release,
      changes: release.changes.filter((c) => {
        if (kind !== 'all' && c.kind !== kind) return false;
        if (!term) return true;
        return (
          c.text.toLowerCase().includes(term) ||
          release.title.toLowerCase().includes(term) ||
          release.version.includes(term)
        );
      }),
    })).filter((release) => release.changes.length > 0);
  }, [query, kind]);

  const totalChanges = useMemo(
    () => CHANGELOG.reduce((sum, r) => sum + r.changes.length, 0),
    [],
  );

  const exportLog = () => {
    const lines = CHANGELOG.map(
      (r) =>
        `## ${r.version} — ${formatDate(r.date)}\n${r.title}\n` +
        r.changes.map((c) => `- [${CHANGE_KIND_LABEL[c.kind]}] ${c.text}`).join('\n'),
    ).join('\n\n');
    const blob = new Blob(
      [`# Histórico de versões\n\nBuild: ${build.version} (${build.environment})\n\n${lines}\n`],
      { type: 'text/markdown;charset=utf-8' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-versoes-${build.version}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" strokeWidth={2.5} />
            Histórico de versões
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {CHANGELOG.length} versões registradas · {totalChanges} alterações desde o lançamento.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportLog} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar log
        </Button>
      </div>

      {/* Build em execução */}
      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Versão em uso</p>
            <p className="text-lg font-bold mt-0.5">{build.version}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1">
              <Server className="h-3 w-3" /> Ambiente
            </p>
            <p className="text-sm font-medium mt-1 break-all">
              {build.environment} · {build.host || 'local'}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3" /> Publicado em
            </p>
            <p className="text-sm font-medium mt-1">
              {new Date(build.buildTime).toLocaleString('pt-BR')}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1">
              <GitCommit className="h-3 w-3" /> Identificador
            </p>
            <p className="text-sm font-mono mt-1 truncate" title={build.commitMessage || build.commit}>
              {build.commit.slice(0, 12)}
            </p>
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar alteração, versão ou recurso"
            className="pl-9"
            aria-label="Buscar no histórico de versões"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant={kind === f.id ? 'default' : 'outline'}
              onClick={() => setKind(f.id as 'all' | ChangeKind)}
              className="shrink-0 text-xs"
            >
              {f.id === 'all' ? 'Tudo' : CHANGE_KIND_LABEL[f.id as ChangeKind]}
            </Button>
          ))}
        </div>
      </div>

      {releases.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhuma alteração encontrada para esse filtro.
        </Card>
      )}

      {/* Linha do tempo */}
      <ol className="relative space-y-4 sm:pl-6">
        <span className="hidden sm:block absolute left-[7px] top-2 bottom-2 w-px bg-border" aria-hidden />
        {releases.map((release, index) => (
          <li key={release.version} className="relative">
            <span
              className={`hidden sm:block absolute -left-6 top-5 h-3.5 w-3.5 rounded-full border-2 border-background ${
                index === 0 ? 'bg-primary' : 'bg-muted-foreground/40'
              }`}
              aria-hidden
            />
            <Card className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold">v{release.version}</span>
                {index === 0 && <Badge className="text-[10px]">Atual</Badge>}
                <span className="text-xs text-muted-foreground">{formatDate(release.date)}</span>
              </div>
              <h3 className="mt-1 font-semibold">{release.title}</h3>
              <ul className="mt-3 space-y-2">
                {release.changes.map((c, i) => (
                  <li key={i} className="flex flex-wrap items-start gap-2 text-sm">
                    <span
                      className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${KIND_CLASS[c.kind]}`}
                    >
                      {CHANGE_KIND_LABEL[c.kind]}
                    </span>
                    <span className="flex-1 min-w-[12rem] text-muted-foreground">{c.text}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default VersionHistoryPanel;
