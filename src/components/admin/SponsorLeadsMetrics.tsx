import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, MessageCircle, Mail } from 'lucide-react';

export type MetricLead = {
  plan: string | null;
  channel: string;
  source: string;
  status: string;
  created_at: string;
};

const RANGES = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 0, label: 'Tudo' },
];

const CLOSED = new Set(['negociando', 'fechado']);

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function SponsorLeadsMetrics({ leads }: { leads: MetricLead[] }) {
  const [range, setRange] = useState(30);

  const scoped = useMemo(() => {
    if (!range) return leads;
    const from = Date.now() - range * 24 * 60 * 60 * 1000;
    return leads.filter((l) => new Date(l.created_at).getTime() >= from);
  }, [leads, range]);

  const totals = useMemo(() => {
    const whatsapp = scoped.filter((l) => l.channel === 'whatsapp').length;
    const email = scoped.filter((l) => l.channel === 'email').length;
    const copia = scoped.filter((l) => l.channel === 'copia').length;
    const qualified = scoped.filter((l) => CLOSED.has(l.status)).length;
    return { total: scoped.length, whatsapp, email, copia, qualified };
  }, [scoped]);

  const byPlan = useMemo(() => {
    const map = new Map<string, { plan: string; whatsapp: number; email: number; other: number; total: number }>();
    for (const l of scoped) {
      const plan = l.plan?.trim() || 'Não definido';
      const row = map.get(plan) ?? { plan, whatsapp: 0, email: 0, other: 0, total: 0 };
      if (l.channel === 'whatsapp') row.whatsapp += 1;
      else if (l.channel === 'email') row.email += 1;
      else row.other += 1;
      row.total += 1;
      map.set(plan, row);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [scoped]);

  const bySource = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of scoped) map.set(l.source, (map.get(l.source) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [scoped]);

  const max = Math.max(1, ...byPlan.map((r) => r.total));

  return (
    <Card className="border-border/60 bg-card/40">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" strokeWidth={1.75} />
            Métricas de interesse comercial
          </CardTitle>
          <CardDescription>Cliques e briefings por pacote e por canal de contato.</CardDescription>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={range === r.value ? 'default' : 'outline'}
              onClick={() => setRange(r.value)}
              aria-label={`Ver métricas de ${r.label}`}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Interações" value={totals.total} hint="cliques + briefings" />
          <Stat
            label="WhatsApp"
            value={totals.whatsapp}
            hint={`${pct(totals.whatsapp, totals.total)}% do total`}
            icon={<MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />}
          />
          <Stat
            label="E-mail"
            value={totals.email}
            hint={`${pct(totals.email, totals.total)}% do total`}
            icon={<Mail className="h-3.5 w-3.5" strokeWidth={1.75} />}
          />
          <Stat
            label="Em negociação"
            value={totals.qualified}
            hint={`${pct(totals.qualified, totals.total)}% de conversão`}
          />
        </div>

        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Por pacote
          </p>
          {byPlan.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem interações no período.</p>
          ) : (
            <ul className="space-y-3">
              {byPlan.map((row) => (
                <li key={row.plan}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{row.plan}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {row.total} · WhatsApp {row.whatsapp} · E-mail {row.email}
                      {row.other > 0 ? ` · Outros ${row.other}` : ''}
                    </span>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-muted/50">
                    <span
                      className="bg-primary"
                      style={{ width: `${(row.whatsapp / max) * 100}%` }}
                      aria-hidden="true"
                    />
                    <span
                      className="bg-primary/45"
                      style={{ width: `${(row.email / max) * 100}%` }}
                      aria-hidden="true"
                    />
                    <span
                      className="bg-muted-foreground/40"
                      style={{ width: `${(row.other / max) * 100}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {bySource.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Por origem
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {bySource.map(([src, count]) => (
                <span key={src} className="rounded-full border border-border/60 px-3 py-1 text-muted-foreground">
                  {src}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: number;
  hint: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-3">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <p className="mt-1 font-display text-2xl leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
