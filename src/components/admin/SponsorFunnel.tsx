import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

export type FunnelLead = {
  id: string;
  plan: string | null;
  channel: string;
  source: string;
  status: string;
  created_at: string;
};

export type FunnelEvent = {
  lead_id: string;
  kind: string;
};

const RANGES = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 0, label: 'Tudo' },
];

const GROUPS = [
  { value: 'plan', label: 'Por pacote' },
  { value: 'source', label: 'Por origem' },
];

const ADVANCED = new Set(['negociando', 'fechado']);
const CONTACT_CHANNELS = new Set(['whatsapp', 'email', 'copia', 'form']);

type Stage = { key: string; label: string; hint: string; count: number };

function pct(part: number, base: number) {
  if (!base) return 0;
  return Math.round((part / base) * 100);
}

function computeStages(leads: FunnelLead[], contacted: Set<string>): Stage[] {
  const cliques = leads.length;
  const registrados = leads.filter((l) => l.channel !== 'clique').length;
  const contatos = leads.filter(
    (l) => contacted.has(l.id) || CONTACT_CHANNELS.has(l.channel),
  ).length;
  const negociacao = leads.filter((l) => ADVANCED.has(l.status)).length;
  return [
    { key: 'clique', label: 'Clique no CTA', hint: 'interações registradas', count: cliques },
    { key: 'lead', label: 'Lead registrado', hint: 'briefing com dados', count: registrados },
    { key: 'contato', label: 'Contato enviado', hint: 'WhatsApp, e-mail ou anotação', count: contatos },
    { key: 'negociacao', label: 'Negociação avançada', hint: 'negociando ou fechado', count: negociacao },
  ];
}

export function SponsorFunnel({
  leads,
  events,
}: {
  leads: FunnelLead[];
  events: FunnelEvent[];
}) {
  const [range, setRange] = useState(30);
  const [groupBy, setGroupBy] = useState<'plan' | 'source'>('plan');

  const contacted = useMemo(() => new Set(events.map((e) => e.lead_id)), [events]);

  const scoped = useMemo(() => {
    if (!range) return leads;
    const from = Date.now() - range * 24 * 60 * 60 * 1000;
    return leads.filter((l) => new Date(l.created_at).getTime() >= from);
  }, [leads, range]);

  const stages = useMemo(() => computeStages(scoped, contacted), [scoped, contacted]);
  const top = stages[0]?.count ?? 0;

  const groups = useMemo(() => {
    const map = new Map<string, FunnelLead[]>();
    for (const l of scoped) {
      const key =
        groupBy === 'plan' ? l.plan?.trim() || 'Não definido' : l.source || 'não informado';
      const arr = map.get(key) ?? [];
      arr.push(l);
      map.set(key, arr);
    }
    return [...map.entries()]
      .map(([key, rows]) => ({ key, rows, stages: computeStages(rows, contacted) }))
      .sort((a, b) => b.rows.length - a.rows.length);
  }, [scoped, groupBy, contacted]);

  return (
    <Card className="border-border/60 bg-card/40">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-primary" strokeWidth={1.75} />
            Funil de conversão comercial
          </CardTitle>
          <CardDescription>
            Do clique no CTA até a negociação avançada, com perda em cada etapa.
          </CardDescription>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={range === r.value ? 'default' : 'outline'}
              onClick={() => setRange(r.value)}
              aria-label={`Ver funil de ${r.label}`}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {scoped.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sem interações no período selecionado.
          </p>
        ) : (
          <>
            <ol className="space-y-3">
              {stages.map((stage, i) => {
                const prev = i === 0 ? stage.count : stages[i - 1].count;
                const width = top ? Math.max((stage.count / top) * 100, 3) : 3;
                return (
                  <li key={stage.key}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">
                        <span className="mr-2 text-xs text-muted-foreground">{i + 1}.</span>
                        {stage.label}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {stage.count} · {pct(stage.count, top)}% do topo
                        {i > 0 ? ` · ${pct(stage.count, prev)}% da etapa anterior` : ''}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                      <span
                        className="block h-full rounded-full bg-primary transition-all"
                        style={{ width: `${width}%`, opacity: 1 - i * 0.18 }}
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{stage.hint}</p>
                  </li>
                );
              })}
            </ol>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Detalhe do funil
                </p>
                <div className="flex gap-1">
                  {GROUPS.map((g) => (
                    <Button
                      key={g.value}
                      size="sm"
                      variant={groupBy === g.value ? 'secondary' : 'ghost'}
                      onClick={() => setGroupBy(g.value as 'plan' | 'source')}
                      aria-label={`Agrupar funil ${g.label.toLowerCase()}`}
                    >
                      {g.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">
                        {groupBy === 'plan' ? 'Pacote' : 'Origem'}
                      </th>
                      <th className="py-2 pr-3 text-right font-medium">Cliques</th>
                      <th className="py-2 pr-3 text-right font-medium">Leads</th>
                      <th className="py-2 pr-3 text-right font-medium">Contatos</th>
                      <th className="py-2 pr-3 text-right font-medium">Negociação</th>
                      <th className="py-2 text-right font-medium">Conversão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => {
                      const [c, l, ct, n] = g.stages.map((s) => s.count);
                      return (
                        <tr key={g.key} className="border-b border-border/40 last:border-0">
                          <td className="py-2 pr-3 font-medium">{g.key}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{c}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{l}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{ct}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{n}</td>
                          <td className="py-2 text-right tabular-nums text-muted-foreground">
                            {pct(n, c)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
