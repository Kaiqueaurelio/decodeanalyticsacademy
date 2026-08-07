import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Handshake, RefreshCw, Search, Trash2, Clock, Mail, Phone, Globe, LayoutDashboard } from 'lucide-react';
import { SponsorLeadsMetrics } from '@/components/admin/SponsorLeadsMetrics';
import { SponsorFunnel } from '@/components/admin/SponsorFunnel';
import { SPONSOR_LEAD_STATUS, SPONSOR_LEAD_CHANNEL_LABEL } from '@/lib/sponsor-leads';
import { ConversionComparisonCharts } from '@/components/admin/ConversionComparisonCharts';
import { useAds } from '@/hooks/useAds';

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
  const [showCharts, setShowCharts] = useState(false);
  const { ads } = useAds();

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
            Acompanhe o funil de vendas: briefings recebidos, contatos realizados e contratos fechados.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showCharts ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => setShowCharts(!showCharts)} 
            className="gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            {showCharts ? "Ver Lista" : "Ver Gráficos"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void load()} className="gap-2" aria-label="Recarregar interessados">
            <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
            Atualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {!loading && !error && showCharts && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
            <SponsorLeadsMetrics leads={leads} />
            <ConversionComparisonCharts ads={ads} leads={leads} />
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
          </div>
        )}

        {!loading && !error && !showCharts && leads.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <SponsorLeadsMetrics leads={leads} />
          </div>
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

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Histórico da Negociação
                        </p>
                        <Badge variant="outline" className="text-[9px] opacity-70">
                          {history.length} interações
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Textarea
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Registrar próximo passo (ex: Agendamos call, Enviamos PDF...)"
                          rows={2}
                          maxLength={1000}
                          className="bg-background/50 text-xs"
                          aria-label="Nova anotação de contato"
                        />
                        <Button 
                          onClick={() => void addNote(lead)} 
                          size="sm"
                          className="sm:self-end h-auto py-3 px-6 font-bold text-xs" 
                          aria-label="Registrar anotação"
                        >
                          Salvar Nota
                        </Button>
                      </div>

                      {history.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-6 text-center">
                          <Handshake className="mx-auto h-8 w-8 text-muted-foreground/20 mb-2" />
                          <p className="text-xs text-muted-foreground font-medium">Inicie o contato com o interessado.</p>
                        </div>
                      ) : (
                        <div className="relative ml-2 border-l border-primary/20 pl-4 space-y-4 py-2">
                          {history.map((ev) => (
                            <div key={ev.id} className="relative">
                              <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                              <div className="rounded-xl border border-border/50 bg-background/60 p-3 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="outline" className="text-[9px] bg-primary/5 uppercase font-black">
                                    {ev.kind === 'status' ? 'Sistema' : 'Nota Admin'}
                                  </Badge>
                                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                                    <Clock className="h-3 w-3" />
                                    {fmt(ev.created_at)}
                                  </span>
                                </div>
                                <p className="text-xs leading-relaxed text-foreground/90 font-medium">{ev.note}</p>
                              </div>
                            </div>
                          ))}
                        </div>
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
