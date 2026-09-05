/**
 * AdminContentCenterPage — Central de Conteúdo.
 * Lista apostilas, suas páginas salvas (conteúdo + data) e os alunos,
 * com ações de editar, ocultar/publicar e excluir sem abrir o banco.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';
import {
  ArrowLeft, FileText, Loader2, Pencil, Trash2, Eye, EyeOff, Users, Search, AlertTriangle, Plus,
} from 'lucide-react';
import { getApostilaPageSavedDate, getLocalDateIso } from '@/lib/apostila-pages';
import { cn } from '@/lib/utils';

interface PageRow {
  id: string;
  apostila_id: string;
  title: string;
  content: string | null;
  position: number;
  saved_date: string | null;
  created_at: string;
  updated_at: string;
}

interface ApostilaRow {
  id: string;
  title: string;
  category: string;
  published: boolean;
  content: string | null;
  updated_at: string;
}

const EMPTY_LIMIT = 40; // menos que isso = página em branco

function isEmptyContent(content?: string | null) {
  return (content || '').replace(/<[^>]*>/g, '').trim().length < EMPTY_LIMIT;
}

function formatDate(iso: string | null) {
  if (!iso) return 'sem data';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function AdminContentCenterPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [onlyEmpty, setOnlyEmpty] = useState(false);
  const [editing, setEditing] = useState<PageRow | null>(null);
  const [draft, setDraft] = useState('');
  const [draftTitle, setDraftTitle] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-content-center'],
    queryFn: async () => {
      const [apostilasRes, pagesRes] = await Promise.all([
        supabase.from('apostilas').select('id,title,category,published,content,updated_at').order('title'),
        supabase.from('apostila_pages').select('id,apostila_id,title,content,position,saved_date,created_at,updated_at').order('position'),
      ]);
      if (apostilasRes.error) throw apostilasRes.error;
      if (pagesRes.error) throw pagesRes.error;
      return {
        apostilas: (apostilasRes.data || []) as ApostilaRow[],
        pages: (pagesRes.data || []) as PageRow[],
      };
    },
  });

  const { data: students } = useQuery({
    queryKey: ['admin-content-center-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,user_id,full_name,email,ra,course,semester,is_blocked,content_scope,created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const savePage = useMutation({
    mutationFn: async (payload: { id: string; title: string; content: string }) => {
      const { error } = await supabase
        .from('apostila_pages')
        .update({ title: payload.title, content: payload.content, saved_date: getLocalDateIso() })
        .eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Página salva');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['admin-content-center'] });
    },
    onError: (e: unknown) => toast.error(`Não deu para salvar: ${(e as Error).message}`),
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('apostila_pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Página excluída');
      qc.invalidateQueries({ queryKey: ['admin-content-center'] });
    },
    onError: (e: unknown) => toast.error(`Não deu para excluir: ${(e as Error).message}`),
  });

  const togglePublished = useMutation({
    mutationFn: async (payload: { id: string; published: boolean }) => {
      const { error } = await supabase.from('apostilas').update({ published: payload.published }).eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-content-center'] }),
    onError: (e: unknown) => toast.error(`Não deu para alterar: ${(e as Error).message}`),
  });

  const deleteApostila = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('apostilas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Apostila excluída');
      qc.invalidateQueries({ queryKey: ['admin-content-center'] });
    },
    onError: (e: unknown) => toast.error(`Não deu para excluir: ${(e as Error).message}`),
  });

  const createPage = useMutation({
    mutationFn: async (apostilaId: string) => {
      const position = (data?.pages.filter((p) => p.apostila_id === apostilaId).length || 0) + 1;
      const { data: inserted, error } = await supabase
        .from('apostila_pages')
        .insert({ apostila_id: apostilaId, title: `Nova Página — ${formatDate(getLocalDateIso())}`, content: '', position, saved_date: getLocalDateIso() })
        .select('id,apostila_id,title,content,position,saved_date,created_at,updated_at')
        .single();
      if (error) throw error;
      return inserted as PageRow;
    },
    onSuccess: (page) => {
      qc.invalidateQueries({ queryKey: ['admin-content-center'] });
      setEditing(page);
      setDraft('');
      setDraftTitle(page.title);
    },
    onError: (e: unknown) => toast.error(`Não deu para criar: ${(e as Error).message}`),
  });

  const grouped = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    return data.apostilas
      .map((a) => {
        const pages = data.pages
          .filter((p) => p.apostila_id === a.id)
          .sort((x, y) => x.position - y.position);
        const emptyPages = pages.filter((p) => isEmptyContent(p.content));
        const hasContent = pages.some((p) => !isEmptyContent(p.content)) || !isEmptyContent(a.content);
        return { apostila: a, pages, emptyPages, hasContent };
      })
      .filter((g) => (term ? g.apostila.title.toLowerCase().includes(term) || g.apostila.category.toLowerCase().includes(term) : true))
      .filter((g) => (onlyEmpty ? !g.hasContent || g.emptyPages.length > 0 : true));
  }, [data, search, onlyEmpty]);

  const withContent = grouped.filter((g) => g.hasContent);
  const withoutContent = grouped.filter((g) => !g.hasContent);

  const openEditor = (page: PageRow) => {
    setEditing(page);
    setDraft(page.content || '');
    setDraftTitle(page.title);
  };

  const renderGroup = (g: (typeof grouped)[number]) => (
    <AccordionItem key={g.apostila.id} value={g.apostila.id} className="border rounded-lg px-3">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex flex-1 flex-wrap items-center gap-2 text-left pr-2">
          <span className="font-semibold">{g.apostila.title}</span>
          <Badge variant="outline" className="text-[10px]">{g.apostila.category}</Badge>
          <Badge variant={g.pages.length ? 'secondary' : 'destructive'} className="text-[10px]">
            {g.pages.length} página{g.pages.length === 1 ? '' : 's'}
          </Badge>
          {g.emptyPages.length > 0 && (
            <Badge variant="destructive" className="text-[10px]">{g.emptyPages.length} em branco</Badge>
          )}
          {!g.apostila.published && <Badge variant="outline" className="text-[10px]">oculta</Badge>}
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-3 pb-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/admin/apostilas/${g.apostila.id}`)}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar apostila
          </Button>
          <Button size="sm" variant="outline" onClick={() => createPage.mutate(g.apostila.id)} disabled={createPage.isPending}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Nova página
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => togglePublished.mutate({ id: g.apostila.id, published: !g.apostila.published })}
          >
            {g.apostila.published ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
            {g.apostila.published ? 'Ocultar' : 'Mostrar'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => {
              if (window.confirm(`Excluir "${g.apostila.title}" e todas as páginas?`)) deleteApostila.mutate(g.apostila.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
          </Button>
        </div>

        {g.pages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma página salva ainda.</p>
        ) : (
          <div className="space-y-2">
            {g.pages.map((p) => {
              const empty = isEmptyContent(p.content);
              const chars = (p.content || '').length;
              return (
                <div
                  key={p.id}
                  className={cn(
                    'flex flex-wrap items-center gap-2 rounded-md border p-3',
                    empty && 'border-destructive/40 bg-destructive/5',
                  )}
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.title || 'Sem título'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(getApostilaPageSavedDate(p))} · {chars.toLocaleString('pt-BR')} caracteres
                      {empty && ' · em branco'}
                    </p>
                  </div>
                  <Button size="sm" variant={empty ? 'default' : 'outline'} onClick={() => openEditor(p)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> {empty ? 'Preencher' : 'Editar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (window.confirm(`Excluir a página "${p.title}"?`)) deletePage.mutate(p.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Central de Conteúdo</h1>
          <p className="text-sm text-muted-foreground">Apostilas, páginas salvas e alunos em um só lugar.</p>
        </div>
      </div>

      <Tabs defaultValue="apostilas">
        <TabsList>
          <TabsTrigger value="apostilas">Apostilas & Páginas</TabsTrigger>
          <TabsTrigger value="alunos">Alunos</TabsTrigger>
        </TabsList>

        <TabsContent value="apostilas" className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar matéria..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant={onlyEmpty ? 'default' : 'outline'} onClick={() => setOnlyEmpty((v) => !v)}>
              <AlertTriangle className="h-4 w-4 mr-1" /> Só as vazias
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Com conteúdo ({withContent.length})</CardTitle>
                  <CardDescription>Matérias com páginas salvas e texto dentro.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="space-y-2">
                    {withContent.map(renderGroup)}
                  </Accordion>
                  {withContent.length === 0 && <p className="text-sm text-muted-foreground">Nada por aqui.</p>}
                </CardContent>
              </Card>

              <Card className="border-destructive/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" /> Sem conteúdo ({withoutContent.length})
                  </CardTitle>
                  <CardDescription>Recrie ou preencha para os alunos verem.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="space-y-2">
                    {withoutContent.map(renderGroup)}
                  </Accordion>
                  {withoutContent.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma matéria vazia.</p>}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="alunos" className="pt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Alunos ({students?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(students || []).map((s) => (
                <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-md border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.full_name || 'Sem nome'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.email} {s.ra ? `· RA ${s.ra}` : ''} {s.semester ? `· ${s.semester}º sem` : ''}
                    </p>
                  </div>
                  {s.is_blocked && <Badge variant="destructive" className="text-[10px]">bloqueado</Badge>}
                  <Badge variant="outline" className="text-[10px]">{s.content_scope}</Badge>
                </div>
              ))}
              {(students || []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum aluno cadastrado.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar página</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="Título da página" />
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escreva o conteúdo da aula aqui..."
              className="min-h-[320px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">{draft.length.toLocaleString('pt-BR')} caracteres</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button
              onClick={() => editing && savePage.mutate({ id: editing.id, title: draftTitle, content: draft })}
              disabled={savePage.isPending}
            >
              {savePage.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
