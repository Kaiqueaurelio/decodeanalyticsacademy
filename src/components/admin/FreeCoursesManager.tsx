import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Edit2, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react';
import { ICON_OPTIONS, iconFor } from '@/lib/free-course-icons';

type FreeCourseRow = {
  id: string;
  title: string;
  provider: string;
  area: string;
  description: string;
  workload: string;
  certificate: string;
  validity_note: string;
  link_url: string;
  status: 'available' | 'soon';
  featured: boolean;
  tags: string[];
  icon_key: string;
  sort_order: number;
  is_active: boolean;
};

const empty: Omit<FreeCourseRow, 'id'> = {
  title: '',
  provider: 'Curso gratuito validado pela faculdade',
  area: 'Programacao',
  description: '',
  workload: '',
  certificate: 'Certificado aceito mediante regras da faculdade',
  validity_note: '',
  link_url: '',
  status: 'available',
  featured: false,
  tags: [],
  icon_key: 'graduation',
  sort_order: 0,
  is_active: true,
};

export function FreeCoursesManager() {
  const [rows, setRows] = useState<FreeCourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FreeCourseRow | (Omit<FreeCourseRow, 'id'> & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('free_courses')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) toast.error('Erro ao carregar cursos: ' + error.message);
    setRows((data as FreeCourseRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing({ ...empty });
    setTagsInput('');
  };
  const openEdit = (row: FreeCourseRow) => {
    setEditing({ ...row });
    setTagsInput((row.tags || []).join(', '));
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return toast.error('Título é obrigatório');
    setSaving(true);
    const payload: any = {
      ...editing,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      link_url: editing.link_url?.trim() || '#',
    };
    delete (payload as any).id;
    const { error } = editing.id
      ? await (supabase as any).from('free_courses').update(payload).eq('id', editing.id)
      : await (supabase as any).from('free_courses').insert(payload);
    setSaving(false);
    if (error) return toast.error('Erro ao salvar: ' + error.message);
    toast.success(editing.id ? 'Curso atualizado' : 'Curso criado');
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este curso?')) return;
    const { error } = await (supabase as any).from('free_courses').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Curso excluído');
    load();
  };

  const toggleActive = async (row: FreeCourseRow) => {
    const { error } = await (supabase as any)
      .from('free_courses')
      .update({ is_active: !row.is_active })
      .eq('id', row.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Cursos Gratuitos</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Adicione, edite e publique cursos validados para horas complementares. Tudo pelo app.
            </p>
          </div>
          <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo curso</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum curso cadastrado ainda.</p>
          ) : (
            <div className="grid gap-3">
              {rows.map((row) => {
                const Icon = iconFor(row.icon_key);
                const ready = row.status === 'available' && row.link_url && row.link_url !== '#';
                return (
                  <div key={row.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">{row.area}</Badge>
                        {row.featured && <Badge className="text-[10px]">Destaque</Badge>}
                        <Badge variant={ready ? 'secondary' : 'outline'} className="text-[10px]">
                          {ready ? 'Disponível' : 'Sem link / soon'}
                        </Badge>
                        {!row.is_active && <Badge variant="destructive" className="text-[10px]">Oculto</Badge>}
                      </div>
                      <div className="font-semibold text-sm mt-1">{row.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{row.description}</div>
                      {row.link_url && row.link_url !== '#' && (
                        <a href={row.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-1 hover:underline">
                          <ExternalLink className="h-3 w-3" /> {row.link_url}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch checked={row.is_active} onCheckedChange={() => toggleActive(row)} />
                      <Button size="icon" variant="ghost" onClick={() => openEdit(row)}><Edit2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar curso' : 'Novo curso gratuito'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Título *</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Área</Label>
                  <Input value={editing.area} onChange={(e) => setEditing({ ...editing, area: e.target.value })} />
                </div>
                <div>
                  <Label>Carga horária</Label>
                  <Input placeholder="Ex.: 20h" value={editing.workload} onChange={(e) => setEditing({ ...editing, workload: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Provedor / origem</Label>
                <Input value={editing.provider} onChange={(e) => setEditing({ ...editing, provider: e.target.value })} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div>
                <Label>Link do curso *</Label>
                <Input placeholder="https://..." value={editing.link_url} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} />
                <p className="text-[11px] text-muted-foreground mt-1">Deixe vazio para "aguardando link".</p>
              </div>
              <div>
                <Label>Observação de validade</Label>
                <Textarea rows={2} value={editing.validity_note} onChange={(e) => setEditing({ ...editing, validity_note: e.target.value })} />
              </div>
              <div>
                <Label>Tags (separadas por vírgula)</Label>
                <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Python, Dados, Portfolio" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ícone</Label>
                  <Select value={editing.icon_key} onValueChange={(v) => setEditing({ ...editing, icon_key: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((o) => (
                        <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status} onValueChange={(v: any) => setEditing({ ...editing, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponível</SelectItem>
                      <SelectItem value="soon">Em breve</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 items-center">
                <div className="flex items-center gap-2"><Switch checked={editing.featured} onCheckedChange={(v) => setEditing({ ...editing, featured: v })} /> <Label>Destaque</Label></div>
                <div className="flex items-center gap-2"><Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /> <Label>Ativo</Label></div>
                <div>
                  <Label>Ordem</Label>
                  <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
