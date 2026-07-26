import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Handshake, RefreshCw, Search, Trash2, Clock, Mail, Phone, Globe } from 'lucide-react';
import { SponsorLeadsMetrics } from '@/components/admin/SponsorLeadsMetrics';
import { SponsorFunnel } from '@/components/admin/SponsorFunnel';
import { SPONSOR_LEAD_STATUS, SPONSOR_LEAD_CHANNEL_LABEL } from '@/lib/sponsor-leads';

type Lead = {
  id: string;
  company: string;
  contact_name: string;
  email: string;
  phone: string | null;
  site: string | null;
  plan: string | null;
  goal: string | null;
  period: string | null;
  budget: string | null;
  notes: string | null;
  channel: string;
  source: string;
  status: string;
  created_at: string;
  cta_id?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
};

type LeadEvent = {
  id: string;
  lead_id: string;
  kind: string;
  note: string;
  created_at: string;
};

const statusTone: Record<string, string> = {
  novo: 'bg-primary/15 text-primary border-primary/30',
  em_contato: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  negociando: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  fechado: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  perdido: 'bg-destructive/15 text-destructive border-destructive/30',
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export function SponsorLeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [openId, setOpenId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [leadsRes, eventsRes] = await Promise.all([
      supabase.from('sponsor_leads').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('sponsor_lead_events').select('*').order('created_at', { ascending: false }).limit(1000),
    ]);
    if (leadsRes.error) {
      setError(leadsRes.error.message);
      setLoading(false);
      return;
    }
    setLeads((leadsRes.data ?? []) as Lead[]);
    setEvents((eventsRes.data ?? []) as LeadEvent[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== 'todos' && l.status !== statusFilter) return false;
      if (!q) return true;
      return [l.company, l.contact_name, l.email, l.plan, l.goal]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [leads, query, statusFilter]);

  const counters = useMemo(() => {
    const base: Record<string, number> = { total: leads.length };
    for (const s of SPONSOR_LEAD_STATUS) base[s.value] = 0;
    for (const l of leads) base[l.status] = (base[l.status] ?? 0) + 1;
    return base;
  }, [leads]);

  const changeStatus = async (lead: Lead, status: string) => {
    const { error: err } = await supabase.from('sponsor_leads').update({ status }).eq('id', lead.id);
    if (err) {
      toast.error('Não foi possível atualizar a situação.');
      return;
    }
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    const label = SPONSOR_LEAD_STATUS.find((s) => s.value === status)?.label ?? status;
    const { data } = await supabase
      .from('sponsor_lead_events')
      .insert({ lead_id: lead.id, kind: 'status', note: `Situação alterada para "${label}".` })
      .select()
      .single();
    if (data) setEvents((prev) => [data as LeadEvent, ...prev]);
    toast.success(`Situação: ${label}`);
  };

  const addNote = async (lead: Lead) => {
    const note = noteDraft.trim();
    if (note.length < 2) {
      toast.error('Escreva a anotação do contato.');
      return;
    }
    const { data, error: err } = await supabase
      .from('sponsor_lead_events')
      .insert({ lead_id: lead.id, kind: 'nota', note: note.slice(0, 1000) })
      .select()
      .single();
    if (err) {
      toast.error('Não foi possível salvar a anotação.');
      return;
    }
    setEvents((prev) => [data as LeadEvent, ...prev]);
    setNoteDraft('');
    toast.success('Anotação registrada.');
  };

  const removeLead = async (lead: Lead) => {
    const { error: err } = await supabase.from('sponsor_leads').delete().eq('id', lead.id);
    if (err) {
      toast.error('Não foi possível remover.');
      return;
    }
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    if (openId === lead.id) setOpenId(null);
    toast.success('Registro removido.');
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" strokeWidth={1.75} />
            Interessados em patrocínio
          </CardTitle>
          <CardDescription>
            Cada briefing enviado e cada clique nos contatos comerciais fica registrado aqui.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} className="gap-2" aria-label="Recarregar interessados">
          <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
          Atualizar
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        {!loading && !error && <SponsorLeadsMetrics leads={leads} />}
        {!loading && !error && leads.length > 0 && (
          <SponsorFunnel
            leads={leads.map((l) => ({
              id: l.id,
              company: l.company,
              contact_name: l.contact_name,
              email: l.email,
              plan: l.plan,
              channel: l.channel,
              source: l.source,
              status: l.status,
              created_at: l.created_at,
              cta_id: l.cta_id,
              utm_source: l.utm_source,
              utm_medium: l.utm_medium,
              utm_campaign: l.utm_campaign,
            }))}
            events={events.map((e) => ({ lead_id: e.lead_id, kind: e.kind }))}
          />
        )}


        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">Total: {counters.total}</Badge>
          {SPONSOR_LEAD_STATUS.map((s) => (
            <Badge key={s.value} variant="outline" className={statusTone[s.value]}>
              {s.label}: {counters[s.value] ?? 0}
            </Badge>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por empresa, responsável ou e-mail"
              className="pl-9"
              aria-label="Buscar interessados"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-56" aria-label="Filtrar por situação">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as situações</SelectItem>
              {SPONSOR_LEAD_STATUS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading && <p className="py-8 text-center text-sm text-muted-foreground">Carregando registros…</p>}
        {!loading && error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível carregar: {error}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum interessado registrado ainda.
          </p>
        )}

        <div className="space-y-3">
          {filtered.map((lead) => {
            const open = openId === lead.id;
            const history = events.filter((e) => e.lead_id === lead.id);
            return (
              <div key={lead.id} className="rounded-xl border border-border/60 bg-card/40">
                <button
                  type="button"
                  onClick={() => { setOpenId(open ? null : lead.id); setNoteDraft(''); }}
                  className="flex w-full flex-col gap-2 p-4 text-left sm:flex-row sm:items-center sm:justify-between"
                  aria-label={`Abrir detalhes de ${lead.company}`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{lead.company}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {lead.contact_name} · {lead.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {lead.plan && <Badge variant="secondary" className="text-[11px]">{lead.plan}</Badge>}
                    <Badge variant="outline" className="text-[11px]">
                      {SPONSOR_LEAD_CHANNEL_LABEL[lead.channel] ?? lead.channel}
                    </Badge>
                    <Badge variant="outline" className={`text-[11px] ${statusTone[lead.status] ?? ''}`}>
                      {SPONSOR_LEAD_STATUS.find((s) => s.value === lead.status)?.label ?? lead.status}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{fmt(lead.created_at)}</span>
                  </div>
                </button>

                {open && (
                  <div className="space-y-4 border-t border-border/60 p-4">
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      {lead.phone && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" strokeWidth={1.75} /> {lead.phone}
                        </p>
                      )}
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" strokeWidth={1.75} /> {lead.email}
                      </p>
                      {lead.site && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="h-3.5 w-3.5" strokeWidth={1.75} /> {lead.site}
                        </p>
                      )}
                      {lead.period && <p className="text-muted-foreground">Período: {lead.period}</p>}
                      {lead.budget && <p className="text-muted-foreground">Investimento: {lead.budget}</p>}
                    </div>

                    {lead.goal && (
                      <div className="rounded-lg bg-muted/40 p-3 text-sm">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">Objetivo</span>
                        <p className="mt-1 whitespace-pre-wrap">{lead.goal}</p>
                      </div>
                    )}
                    {lead.notes && (
                      <div className="rounded-lg bg-muted/40 p-3 text-sm">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">Observações</span>
                        <p className="mt-1 whitespace-pre-wrap">{lead.notes}</p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Select value={lead.status} onValueChange={(v) => void changeStatus(lead, v)}>
                        <SelectTrigger className="sm:w-56" aria-label="Alterar situação do interessado">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SPONSOR_LEAD_STATUS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-destructive sm:ml-auto"
                        onClick={() => void removeLead(lead)}
                        aria-label={`Remover registro de ${lead.company}`}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        Remover
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Histórico de contato
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Textarea
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Ex.: liguei hoje, pediu proposta por e-mail."
                          rows={2}
                          maxLength={1000}
                          aria-label="Nova anotação de contato"
                        />
                        <Button onClick={() => void addNote(lead)} className="sm:self-end" aria-label="Registrar anotação">
                          Registrar
                        </Button>
                      </div>

                      {history.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nenhum contato registrado ainda.</p>
                      ) : (
                        <ul className="space-y-2">
                          {history.map((ev) => (
                            <li key={ev.id} className="rounded-lg border border-border/50 bg-background/40 p-3 text-sm">
                              <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <Clock className="h-3 w-3" strokeWidth={1.75} />
                                {fmt(ev.created_at)} · {ev.kind === 'status' ? 'situação' : 'anotação'}
                              </span>
                              <p className="mt-1 whitespace-pre-wrap">{ev.note}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
