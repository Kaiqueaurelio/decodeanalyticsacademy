import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileUp, Sparkles, Trash2, Plus, Loader2, Calendar as CalIcon, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  event_type: string;
  subject: string | null;
  source_pdf_url: string | null;
}

interface Draft {
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  event_type: string;
  subject?: string;
}

const EVENT_TYPES = [
  { value: 'prova', label: 'Prova', color: 'bg-destructive/15 text-destructive border-destructive/30' },
  { value: 'trabalho', label: 'Trabalho', color: 'bg-warning/15 text-warning border-warning/30' },
  { value: 'atividade', label: 'Atividade', color: 'bg-primary/15 text-primary border-primary/30' },
  { value: 'seminario', label: 'Seminário', color: 'bg-accent/15 text-accent-foreground border-accent/30' },
  { value: 'entrega', label: 'Entrega', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  { value: 'aula', label: 'Aula', color: 'bg-muted-foreground/15 text-muted-foreground border-border' },
];

const typeStyle = (t: string) => EVENT_TYPES.find(e => e.value === t)?.color || EVENT_TYPES[2].color;

export function CalendarEventsAdmin() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [defaultSubject, setDefaultSubject] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState<Draft>({ title: '', event_date: '', event_type: 'prova' });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('calendar_events').select('*').order('event_date', { ascending: true });
    if (error) toast.error('Erro ao carregar eventos');
    else setEvents((data as CalendarEvent[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const onPdfUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('PDF muito grande (máx 10MB)');
      return;
    }
    setExtracting(true);
    try {
      const reader = new FileReader();
      const pdfBase64: string = await new Promise((res, rej) => {
        reader.onload = () => res((reader.result as string).split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('extract-calendar-events', {
        body: { pdfBase64, defaultSubject: defaultSubject || undefined },
      });
      if (error) throw error;
      const extracted: Draft[] = data?.events ?? [];
      if (extracted.length === 0) {
        toast.warning('Nenhum evento encontrado no PDF');
      } else {
        toast.success(`${extracted.length} evento(s) detectado(s) — revise abaixo`);
        setDrafts(extracted);
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Falha ao extrair eventos');
    } finally {
      setExtracting(false);
    }
  };

  const updateDraft = (i: number, patch: Partial<Draft>) => {
    setDrafts(d => d?.map((x, idx) => idx === i ? { ...x, ...patch } : x) ?? null);
  };
  const removeDraft = (i: number) => setDrafts(d => d?.filter((_, idx) => idx !== i) ?? null);

  const saveAllDrafts = async () => {
    if (!drafts || drafts.length === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error('Sessão expirada');
    const rows = drafts
      .filter(d => d.title && d.event_date)
      .map(d => ({
        title: d.title,
        description: d.description || null,
        event_date: d.event_date,
        event_time: d.event_time || null,
        event_type: d.event_type,
        subject: d.subject || null,
        created_by: user.id,
      }));
    const { error } = await supabase.from('calendar_events').insert(rows);
    if (error) return toast.error('Erro ao salvar: ' + error.message);
    toast.success(`${rows.length} evento(s) salvos no calendário`);
    setDrafts(null);
    load();
  };

  const saveManual = async () => {
    if (!manual.title || !manual.event_date) return toast.error('Preencha título e data');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('calendar_events').insert({
      title: manual.title,
      description: manual.description || null,
      event_date: manual.event_date,
      event_time: manual.event_time || null,
      event_type: manual.event_type,
      subject: manual.subject || null,
      created_by: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success('Evento adicionado');
    setManualOpen(false);
    setManual({ title: '', event_date: '', event_type: 'prova' });
    load();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Excluir este evento?')) return;
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Evento removido');
    load();
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Importar cronograma (PDF)</h3>
        </div>
        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div>
            <Label className="text-xs">Disciplina padrão (opcional)</Label>
            <Input
              placeholder="Ex: Cálculo I"
              value={defaultSubject}
              onChange={e => setDefaultSubject(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs invisible">Upload</Label>
            <Button
              type="button"
              disabled={extracting}
              className="gradient-primary text-primary-foreground"
              onClick={() => document.getElementById('cal-pdf-input')?.click()}
            >
              {extracting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando…</> : <><FileUp className="h-4 w-4 mr-2" /> Subir PDF</>}
            </Button>
            <input
              id="cal-pdf-input" type="file" accept=".pdf,application/pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onPdfUpload(f); e.target.value = ''; }}
            />
          </div>
          <div>
            <Button variant="outline" onClick={() => setManualOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Manual
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Suba o cronograma da disciplina e a IA extrai provas, trabalhos e entregas. Você revisa e confirma antes de salvar.
        </p>
      </Card>

      {drafts && (
        <Card className="p-5 border-primary/40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-primary" /> Revisar eventos extraídos ({drafts.length})
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setDrafts(null)}>Cancelar</Button>
              <Button size="sm" className="gradient-primary text-primary-foreground" onClick={saveAllDrafts}>
                Salvar todos
              </Button>
            </div>
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {drafts.map((d, i) => (
              <div key={i} className="grid sm:grid-cols-[1fr_140px_110px_140px_auto] gap-2 items-end p-3 border rounded-lg bg-muted/20">
                <div>
                  <Label className="text-[11px]">Título</Label>
                  <Input value={d.title} onChange={e => updateDraft(i, { title: e.target.value })} className="h-9" />
                </div>
                <div>
                  <Label className="text-[11px]">Data</Label>
                  <Input type="date" value={d.event_date} onChange={e => updateDraft(i, { event_date: e.target.value })} className="h-9" />
                </div>
                <div>
                  <Label className="text-[11px]">Hora</Label>
                  <Input type="time" value={d.event_time ?? ''} onChange={e => updateDraft(i, { event_time: e.target.value })} className="h-9" />
                </div>
                <div>
                  <Label className="text-[11px]">Tipo</Label>
                  <Select value={d.event_type} onValueChange={v => updateDraft(i, { event_type: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeDraft(i)} className="h-9 w-9 p-0">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <CalIcon className="h-4 w-4 text-primary" /> Eventos cadastrados ({events.length})
          </h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum evento ainda</p>
        ) : (
          <div className="space-y-2">
            {events.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] ${typeStyle(ev.event_type)}`}>
                      {EVENT_TYPES.find(t => t.value === ev.event_type)?.label ?? ev.event_type}
                    </Badge>
                    <span className="font-medium text-sm truncate">{ev.title}</span>
                    {ev.subject && <span className="text-xs text-muted-foreground">· {ev.subject}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(ev.event_date + 'T12:00:00'), "EEE, d 'de' MMM yyyy", { locale: ptBR })}
                    {ev.event_time && ` · ${ev.event_time.slice(0, 5)}`}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteEvent(ev.id)} className="h-8 w-8 p-0">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo evento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Título</Label>
              <Input value={manual.title} onChange={e => setManual({ ...manual, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Data</Label>
                <Input type="date" value={manual.event_date} onChange={e => setManual({ ...manual, event_date: e.target.value })} /></div>
              <div><Label className="text-xs">Hora</Label>
                <Input type="time" value={manual.event_time ?? ''} onChange={e => setManual({ ...manual, event_time: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Tipo</Label>
                <Select value={manual.event_type} onValueChange={v => setManual({ ...manual, event_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select></div>
              <div><Label className="text-xs">Disciplina</Label>
                <Input value={manual.subject ?? ''} onChange={e => setManual({ ...manual, subject: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Descrição</Label>
              <Input value={manual.description ?? ''} onChange={e => setManual({ ...manual, description: e.target.value })} /></div>
            <Button className="w-full gradient-primary text-primary-foreground" onClick={saveManual}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
