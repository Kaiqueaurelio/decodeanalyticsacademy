import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, ChevronRight, Download, FileText, Filter, Gauge } from 'lucide-react';
import { SPONSOR_LEAD_CHANNEL_LABEL, SPONSOR_LEAD_STATUS } from '@/lib/sponsor-leads';
import { exportSponsorCsv, exportSponsorPdf } from '@/lib/sponsor-export';

export type FunnelLead = {
  id: string;
  company: string;
  contact_name: string;
  email: string;
  plan: string | null;
  channel: string;
  source: string;
  status: string;
  created_at: string;
  cta_id?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
};

export type FunnelEvent = {
  lead_id: string;
  kind: string;
};

type Threshold = {
  id: string;
  dimension: string;
  key: string;
  stage: string;
  min_rate: number;
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

const STAGE_KEYS = ['clique', 'lead', 'contato', 'negociacao'] as const;
type StageKey = (typeof STAGE_KEYS)[number];

type Stage = { key: StageKey; label: string; hint: string; count: number };

const DEFAULT_MIN_RATE = 20;

function pct(part: number, base: number) {
  if (!base) return 0;
  return Math.round((part / base) * 100);
}

function isContacted(lead: FunnelLead, contacted: Set<string>) {
  return contacted.has(lead.id) || CONTACT_CHANNELS.has(lead.channel);
}

function stageLeads(leads: FunnelLead[], contacted: Set<string>, stage: StageKey) {
  switch (stage) {
    case 'clique':
      return leads;
    case 'lead':
      return leads.filter((l) => l.channel !== 'clique' || (l.contact_name !== 'Visitante' && l.email !== 'lead@decode.academy'));
    case 'contato':
      return leads.filter((l) => isContacted(l, contacted));
    case 'negociacao':
      return leads.filter((l) => ADVANCED.has(l.status));
  }
}

function computeStages(leads: FunnelLead[], contacted: Set<string>): Stage[] {
  const meta: { key: StageKey; label: string; hint: string }[] = [
    { key: 'clique', label: 'Clique no CTA', hint: 'interações registradas' },
    { key: 'lead', label: 'Lead registrado', hint: 'briefing com dados' },
    { key: 'contato', label: 'Contato enviado', hint: 'WhatsApp, e-mail ou anotação' },
    { key: 'negociacao', label: 'Negociação avançada', hint: 'negociando ou fechado' },
  ];
  return meta.map((m) => ({ ...m, count: stageLeads(leads, contacted, m.key).length }));
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export function SponsorFunnel({
  leads,
  events,
}: {
  leads: FunnelLead[];
  events: FunnelEvent[];
}) {
  const [range, setRange] = useState(30);
  const [groupBy, setGroupBy] = useState<'plan' | 'source'>('plan');
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [drill, setDrill] = useState<{ stage: Stage; group?: string } | null>(null);
  const [showLimits, setShowLimits] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const contacted = useMemo(() => new Set(events.map((e) => e.lead_id)), [events]);

  const loadThresholds = useCallback(async () => {
    const { data } = await supabase.from('sponsor_funnel_thresholds').select('*');
    setThresholds((data ?? []) as Threshold[]);
  }, []);

  useEffect(() => {
    void loadThresholds();
  }, [loadThresholds]);

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

  const limitFor = useCallback(
    (key: string) =>
      thresholds.find((t) => t.dimension === groupBy && t.key === key)?.min_rate ?? DEFAULT_MIN_RATE,
    [thresholds, groupBy],
  );

  const alerts = useMemo(
    () =>
      groups
        .filter((g) => g.rows.length >= 3)
        .map((g) => {
          const conv = pct(g.stages[3].count, g.stages[0].count);
          return { key: g.key, conv, limit: limitFor(g.key), total: g.rows.length };
        })
        .filter((a) => a.conv < a.limit),
    [groups, limitFor],
  );

  const saveLimit = async (key: string, value: number) => {
    const min_rate = Math.max(0, Math.min(100, Math.round(value)));
    const { error } = await supabase
      .from('sponsor_funnel_thresholds')
      .upsert(
        { dimension: groupBy, key, stage: 'negociacao', min_rate },
        { onConflict: 'dimension,key,stage' },
      );
    if (error) {
      toast.error('Não foi possível salvar o limite.');
      return;
    }
    toast.success(`Limite de ${key}: ${min_rate}%`);
    void loadThresholds();
  };

  const periodLabel = range ? `Últimos ${range} dias` : 'Todo o período';
  const groupLabel = groupBy === 'plan' ? 'Pacote' : 'Origem';
  const exportArgs = () =>
    [
      scoped,
      stages.map((s) => ({ label: s.label, count: s.count })),
      groups.map((g) => ({ key: g.key, counts: g.stages.map((s) => s.count) })),
      groupLabel,
      periodLabel,
    ] as const;

  const drillRows = useMemo(() => {
    if (!drill) return [];
    const base = drill.group
      ? scoped.filter(
          (l) =>
            (groupBy === 'plan' ? l.plan?.trim() || 'Não definido' : l.source || 'não informado') ===
            drill.group,
        )
      : scoped;
    return stageLeads(base, contacted, drill.stage.key).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [drill, scoped, contacted, groupBy]);

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
        <div className="flex flex-wrap gap-1">
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
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => exportSponsorCsv(...exportArgs())}
            aria-label="Baixar funil em CSV"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
            CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => exportSponsorPdf(...exportArgs())}
            aria-label="Baixar funil em PDF"
          >
            <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
            PDF
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {scoped.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sem interações no período selecionado.
          </p>
        ) : (
          <>
            {alerts.length > 0 && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-amber-500">
                  <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
                  Conversão abaixo do limite
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {alerts.map((a) => (
                    <li key={a.key}>
                      <span className="font-medium text-foreground">{a.key}</span>: {a.conv}% de
                      clique → negociação (limite {a.limit}%, {a.total} interações)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <ol className="space-y-3">
              {stages.map((stage, i) => {
                const prev = i === 0 ? stage.count : stages[i - 1].count;
                const width = top ? Math.max((stage.count / top) * 100, 3) : 3;
                return (
                  <li key={stage.key}>
                    <button
                      type="button"
                      onClick={() => setDrill({ stage })}
                      className="w-full rounded-lg p-1 text-left transition-colors hover:bg-muted/40"
                      aria-label={`Ver leads da etapa ${stage.label}`}
                    >
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
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        {stage.hint}
                        <ChevronRight className="h-3 w-3" strokeWidth={1.75} />
                        ver lista
                      </p>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Detalhe do funil
                </p>
                <div className="flex flex-wrap gap-1">
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
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5"
                    onClick={() => setShowLimits((v) => !v)}
                    aria-label="Configurar limites de alerta de conversão"
                  >
                    <Gauge className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Limites
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">{groupLabel}</th>
                      <th className="py-2 pr-3 text-right font-medium">Cliques</th>
                      <th className="py-2 pr-3 text-right font-medium">Leads</th>
                      <th className="py-2 pr-3 text-right font-medium">Contatos</th>
                      <th className="py-2 pr-3 text-right font-medium">Negociação</th>
                      <th className="py-2 pr-3 text-right font-medium">Conversão</th>
                      {showLimits && <th className="py-2 text-right font-medium">Limite %</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => {
                      const [c, l, ct, n] = g.stages.map((s) => s.count);
                      const conv = pct(n, c);
                      const limit = limitFor(g.key);
                      const low = g.rows.length >= 3 && conv < limit;
                      return (
                        <tr key={g.key} className="border-b border-border/40 last:border-0">
                          <td className="py-2 pr-3 font-medium">{g.key}</td>
                          {g.stages.map((s, idx) => (
                            <td key={s.key} className="py-2 pr-3 text-right tabular-nums">
                              <button
                                type="button"
                                className="underline-offset-4 hover:underline"
                                onClick={() => setDrill({ stage: s, group: g.key })}
                                aria-label={`Ver leads de ${g.key} na etapa ${s.label}`}
                              >
                                {[c, l, ct, n][idx]}
                              </button>
                            </td>
                          ))}
                          <td
                            className={`py-2 pr-3 text-right tabular-nums ${
                              low ? 'font-medium text-amber-500' : 'text-muted-foreground'
                            }`}
                          >
                            {conv}%
                          </td>
                          {showLimits && (
                            <td className="py-2 text-right">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                defaultValue={limit}
                                className="ml-auto h-8 w-20 text-right"
                                aria-label={`Limite mínimo de conversão para ${g.key}`}
                                value={draft[g.key] ?? String(limit)}
                                onChange={(e) =>
                                  setDraft((prev) => ({ ...prev, [g.key]: e.target.value }))
                                }
                                onBlur={(e) => void saveLimit(g.key, Number(e.target.value))}
                              />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {showLimits && (
                <p className="text-[11px] text-muted-foreground">
                  O alerta dispara quando a conversão clique → negociação fica abaixo do limite, com
                  pelo menos 3 interações no período. Padrão: {DEFAULT_MIN_RATE}%.
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={!!drill} onOpenChange={(open) => !open && setDrill(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {drill?.stage.label}
              {drill?.group ? ` · ${drill.group}` : ''}
            </DialogTitle>
            <DialogDescription>
              {drillRows.length} registro(s) · {periodLabel}
            </DialogDescription>
          </DialogHeader>
          {drillRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum lead nesta etapa.
            </p>
          ) : (
            <ul className="space-y-2">
              {drillRows.map((l) => (
                <li key={l.id} className="rounded-lg border border-border/50 bg-background/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{l.company}</p>
                    <span className="text-[11px] text-muted-foreground">{fmt(l.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {l.contact_name} · {l.email}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    <Badge variant="secondary">{l.plan || 'Não definido'}</Badge>
                    <Badge variant="outline">
                      {SPONSOR_LEAD_CHANNEL_LABEL[l.channel] ?? l.channel}
                    </Badge>
                    <Badge variant="outline">{l.cta_id || l.source}</Badge>
                    {l.utm_campaign && <Badge variant="outline">campanha: {l.utm_campaign}</Badge>}
                    {l.utm_source && <Badge variant="outline">utm: {l.utm_source}</Badge>}
                    <Badge variant="outline">
                      {SPONSOR_LEAD_STATUS.find((s) => s.value === l.status)?.label ?? l.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
