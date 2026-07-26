import React, { useEffect, useMemo, useState } from 'react';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  AlertTriangle,
  Clock3,
  ExternalLink,
  Eye,
  LayoutTemplate,
  Loader2,
  Megaphone,
  MousePointerClick,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdImageUploadButton } from './AdImageUploadButton';
import { AppImage } from '@/components/ui/app-image';
import { cn } from '@/lib/utils';
import { AdStudentPreview } from '@/components/admin/AdStudentPreview';


const supabase = supabaseTyped as any;

type AdType = 'banner' | 'popup' | 'inline' | 'sidebar' | 'footer';

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  ad_type: AdType;
  position?: number;

  is_active: boolean;
  display_duration: number;
  view_count: number;
  click_count: number;
  created_at?: string;
  start_date?: string | null;
  end_date?: string | null;
}

interface AdFormState {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  ad_type: AdType;
  position: number;
  display_duration: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

const AD_TYPE_OPTIONS: { value: AdType; label: string; hint: string; where: string }[] = [
  { value: 'banner', label: 'Topo', hint: 'Banner de destaque', where: 'Aparece no topo das páginas, acima do conteúdo.' },
  { value: 'inline', label: 'Entre seções', hint: 'No meio do conteúdo', where: 'Inserido entre blocos de conteúdo durante a navegação.' },
  { value: 'sidebar', label: 'Lateral', hint: 'Coluna fixa (desktop)', where: 'Painel fixo à direita, sempre visível na rolagem.' },
  { value: 'footer', label: 'Rodapé', hint: 'Faixa fixa (mobile)', where: 'Barra fina fixa na parte inferior no celular.' },
  { value: 'popup', label: 'Pop-up', hint: 'Sobreposto', where: 'Janela central sobre a tela, fecha automaticamente.' },
];

// Mini-wireframe indicando onde o anúncio cai no layout.
function PlacementDiagram({ type }: { type: AdType }) {
  const block = 'absolute rounded-[2px] bg-primary';
  return (
    <div className="relative h-12 w-full overflow-hidden rounded-md border border-border/70 bg-muted/40">
      <div className="absolute inset-x-1 top-1 h-1.5 rounded-[2px] bg-muted-foreground/25" />
      <div className="absolute inset-x-1 top-4 bottom-1 rounded-[2px] bg-muted-foreground/15" />
      {type === 'banner' && <span className={cn(block, 'inset-x-1 top-1 h-1.5')} />}
      {type === 'inline' && <span className={cn(block, 'inset-x-3 top-1/2 h-2 -translate-y-1/2')} />}
      {type === 'sidebar' && <span className={cn(block, 'right-1 top-4 bottom-1 w-3')} />}
      {type === 'footer' && <span className={cn(block, 'inset-x-1 bottom-1 h-2')} />}
      {type === 'popup' && <span className={cn(block, 'left-1/2 top-1/2 h-6 w-10 -translate-x-1/2 -translate-y-1/2')} />}
    </div>
  );
}

// Converte ISO -> valor aceito por <input type="datetime-local"> (horário local).
const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIso = (local: string) => {
  const value = local.trim();
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const scheduleState = (ad: Pick<Ad, 'is_active' | 'start_date' | 'end_date'>) => {
  if (!ad.is_active) return { label: 'Pausado', variant: 'secondary' as const };
  const now = Date.now();
  if (ad.start_date && new Date(ad.start_date).getTime() > now) {
    return { label: 'Agendado', variant: 'outline' as const };
  }
  if (ad.end_date && new Date(ad.end_date).getTime() < now) {
    return { label: 'Expirado', variant: 'destructive' as const };
  }
  return { label: 'No ar', variant: 'default' as const };
};

const createEmptyForm = (): AdFormState => ({
  title: '',
  description: '',
  image_url: '',
  link_url: '',
  ad_type: 'banner',
  position: 0,
  display_duration: 5,
  is_active: true,
  start_date: '',
  end_date: '',
});

const sortAds = (items: Ad[]) =>
  [...items].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

const mapAdToForm = (ad: Ad): AdFormState => ({
  title: ad.title,
  description: ad.description || '',
  image_url: ad.image_url || '',
  link_url: ad.link_url || '',
  ad_type: ad.ad_type,
  position: ad.position ?? 0,
  display_duration: ad.display_duration || 5,
  is_active: ad.is_active,
  start_date: toLocalInput(ad.start_date),
  end_date: toLocalInput(ad.end_date),
});


const formatErrorMessage = (error: any, fallback: string) =>
  error?.message || error?.details || error?.hint || fallback;

export function AdminAdsManager() {
  const { user, isAdmin } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState<AdFormState>(createEmptyForm());

  useEffect(() => {
    if (!isAdmin) return;
    void loadAds();
  }, [isAdmin]);

  const selectedAd = useMemo(
    () => ads.find((ad) => ad.id === editingId) ?? null,
    [ads, editingId],
  );

  const filteredAds = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return ads;
    return ads.filter((ad) =>
      [ad.title, ad.description || '', ad.link_url || '', ad.ad_type]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [ads, search]);

  const stats = useMemo(() => {
    const active = ads.filter((ad) => ad.is_active).length;
    const withImage = ads.filter((ad) => Boolean(ad.image_url)).length;
    return {
      total: ads.length,
      active,
      inactive: ads.length - active,
      withImage,
    };
  }, [ads]);

  const loadAds = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAds(sortAds(data || []));
    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
      const message = formatErrorMessage(error, 'Não foi possível carregar os anúncios');
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetEditor = () => {
    setEditingId(null);
    setFormData(createEmptyForm());
  };

  const startEditing = (ad: Ad) => {
    setEditingId(ad.id);
    setFormData(mapAdToForm(ad));
  };

  const validateForm = () => {
    const title = formData.title.trim();
    const linkUrl = formData.link_url.trim();

    if (!title) {
      toast.error('Informe o título do anúncio');
      return false;
    }

    if (linkUrl) {
      try {
        new URL(linkUrl);
      } catch {
        toast.error('Use uma URL válida, com https://');
        return false;
      }
    }

    if (formData.image_url.trim()) {
      try {
        new URL(formData.image_url.trim());
      } catch {
        toast.error('A URL da imagem precisa ser válida');
        return false;
      }
    }

    const startIso = toIso(formData.start_date);
    const endIso = toIso(formData.end_date);
    if (startIso && endIso && new Date(endIso) <= new Date(startIso)) {
      toast.error('O fim da exibição precisa ser depois do início');
      return false;
    }

    return true;
  };

  const buildPayload = () => ({
    title: formData.title.trim(),
    description: formData.description.trim() || null,
    image_url: formData.image_url.trim() || null,
    link_url: formData.link_url.trim() || null,
    ad_type: formData.ad_type,
    position: Math.max(0, Number(formData.position) || 0),
    display_duration: Math.min(30, Math.max(1, Number(formData.display_duration) || 5)),
    is_active: formData.is_active,
    start_date: toIso(formData.start_date),
    end_date: toIso(formData.end_date),
  });



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const payload = buildPayload();

      if (editingId) {
        const { data, error } = await supabase
          .from('ads')
          .update(payload)
          .eq('id', editingId)
          .select('*')
          .single();

        if (error) throw error;

        setAds((current) => sortAds(current.map((ad) => (ad.id === editingId ? { ...ad, ...data } : ad))));
        toast.success('Anúncio atualizado com sucesso');
      } else {
        const { data, error } = await supabase
          .from('ads')
          .insert({ ...payload, created_by: user?.id })
          .select('*')
          .single();

        if (error) throw error;

        setAds((current) => sortAds([data, ...current]));
        setEditingId(data.id);
        setFormData(mapAdToForm(data));
        toast.success('Anúncio criado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao salvar anúncio:', error);
      toast.error(formatErrorMessage(error, 'Não foi possível salvar este anúncio'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (ad: Ad) => {
    try {
      setBusyId(ad.id);
      const nextActive = !ad.is_active;
      const { data, error } = await supabase
        .from('ads')
        .update({ is_active: nextActive })
        .eq('id', ad.id)
        .select('*')
        .single();

      if (error) throw error;

      setAds((current) => current.map((item) => (item.id === ad.id ? { ...item, ...data } : item)));

      if (editingId === ad.id) {
        setFormData((current) => ({ ...current, is_active: nextActive }));
      }

      toast.success(nextActive ? 'Anúncio ativado' : 'Anúncio pausado');
    } catch (error) {
      console.error('Erro ao atualizar anúncio:', error);
      toast.error(formatErrorMessage(error, 'Não foi possível alterar o status'));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setBusyId(deleteTarget.id);
      const deletedId = deleteTarget.id;
      const { error } = await supabase.from('ads').delete().eq('id', deletedId);
      if (error) throw error;

      const remaining = ads.filter((ad) => ad.id !== deletedId);
      setAds(remaining);
      if (editingId === deletedId) {
        resetEditor();
      }

      setDeleteTarget(null);
      toast.success('Anúncio excluído com sucesso');
    } catch (error) {
      console.error('Erro ao deletar anúncio:', error);
      toast.error(formatErrorMessage(error, 'Não foi possível excluir este anúncio'));
    } finally {
      setBusyId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gerenciador de Anúncios</h2>
            <p className="text-muted-foreground">Agora você edita, ativa e remove tudo a partir de uma lista simples.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Card className="min-w-[140px] border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="min-w-[140px] border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Ativos</p>
                <p className="mt-1 text-2xl font-semibold text-primary">{stats.active}</p>
              </CardContent>
            </Card>
            <Card className="min-w-[140px] border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Com imagem</p>
                <p className="mt-1 text-2xl font-semibold">{stats.withImage}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="border-border/60">
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Anúncios cadastrados</CardTitle>
                  <CardDescription>Selecione um anúncio para editar ou crie um novo.</CardDescription>
                </div>
                <Button type="button" size="sm" onClick={resetEditor} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Novo
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por título, link ou tipo"
                  className="pl-9"
                />
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando anúncios...
                </div>
              ) : loadError ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-10 text-center">
                  <AlertTriangle className="mx-auto mb-3 h-6 w-6 text-destructive" />
                  <p className="font-medium text-destructive">Falha ao carregar anúncios</p>
                  <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-4 gap-1.5"
                    onClick={() => void loadAds()}
                  >
                    <RefreshCw className="h-4 w-4" /> Tentar novamente
                  </Button>
                </div>
              ) : filteredAds.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center">
                  <Megaphone className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                  <p className="font-medium">
                    {ads.length === 0 ? 'Nenhum anúncio cadastrado' : 'Nenhum resultado para essa busca'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ads.length === 0
                      ? 'Clique em Novo para criar o primeiro anúncio.'
                      : 'Ajuste os termos ou limpe a busca para ver todos os anúncios.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAds.map((ad) => {
                    const isSelected = editingId === ad.id;
                    const isBusy = busyId === ad.id;

                    return (
                      <div
                        key={ad.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => startEditing(ad)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            startEditing(ad);
                          }
                        }}
                        className={cn(
                          'rounded-lg border p-4 text-left transition-all',
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/30 hover:bg-muted/30',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-semibold">{ad.title}</p>
                              <Badge variant="outline">{AD_TYPE_OPTIONS.find((item) => item.value === ad.ad_type)?.label}</Badge>
                              <Badge variant={scheduleState(ad).variant}>{scheduleState(ad).label}</Badge>
                              {(ad.start_date || ad.end_date) && (
                                <span className="text-[11px] text-muted-foreground">
                                  {ad.start_date ? new Date(ad.start_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'agora'}
                                  {' → '}
                                  {ad.end_date ? new Date(ad.end_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'sem fim'}
                                </span>
                              )}
                            </div>
                            {ad.description && (
                              <p className="line-clamp-2 text-sm text-muted-foreground">{ad.description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3.5 w-3.5" /> {ad.view_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <MousePointerClick className="h-3.5 w-3.5" /> {ad.click_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock3 className="h-3.5 w-3.5" /> {ad.display_duration}s
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <Switch
                              checked={ad.is_active}
                              onCheckedChange={() => void toggleActive(ad)}
                              disabled={isBusy}
                              onClick={(event) => event.stopPropagation()}
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  startEditing(ad);
                                }}
                              >
                                <PencilLine className="h-3.5 w-3.5" /> Editar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="gap-1.5"
                                disabled={isBusy}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDeleteTarget(ad);
                                }}
                              >
                                {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>{editingId ? 'Editar anúncio' : 'Novo anúncio'}</CardTitle>
                  <CardDescription>
                    {editingId
                      ? 'Altere os campos abaixo e salve quando terminar.'
                      : 'Preencha os dados ao lado e publique quando estiver pronto.'}
                  </CardDescription>
                </div>

                {selectedAd && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{selectedAd.view_count} visualizações</Badge>
                    <Badge variant="outline">{selectedAd.click_count} cliques</Badge>
                    <Badge variant={selectedAd.is_active ? 'default' : 'secondary'}>
                      {selectedAd.is_active ? 'Ativo' : 'Pausado'}
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-xl border border-border/70 bg-muted/25 p-4">
                  <p className="text-sm font-medium text-foreground">Modelos rápidos</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Comece por um formato pronto. Você pode ajustar tudo depois.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 transition-colors duration-200 hover:border-primary/60 hover:text-primary"
                      onClick={() =>
                        setFormData((current) => ({
                          ...current,
                          ad_type: 'popup',
                          image_url: '',
                          link_url: '',
                        }))
                      }
                    >
                      <LayoutTemplate className="h-3.5 w-3.5" />
                      Pop-up somente texto
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 transition-colors duration-200 hover:border-primary/60 hover:text-primary"
                      onClick={() => setFormData((current) => ({ ...current, ad_type: 'sidebar' }))}
                    >
                      <LayoutTemplate className="h-3.5 w-3.5" />
                      Lateral com imagem
                    </Button>
                  </div>
                  {formData.ad_type === 'popup' && !formData.image_url.trim() && (
                    <p className="mt-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs leading-5 text-foreground">
                      Modo aviso ativo: sem imagem e sem link, o aluno verá apenas o título e o texto
                      em um pop-up limpo e centralizado.
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Título</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData((current) => ({ ...current, title: e.target.value }))}
                      placeholder="Ex.: Curso de Python com desconto"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      URL de destino <span className="text-muted-foreground">(opcional)</span>
                    </label>
                    <Input
                      type="url"
                      value={formData.link_url}
                      onChange={(e) => setFormData((current) => ({ ...current, link_url: e.target.value }))}
                      placeholder="Deixe em branco para anúncio apenas informativo"
                    />
                    <p className="text-xs text-muted-foreground">
                      Sem link, o anúncio é exibido apenas como aviso e não abre nada ao ser clicado.
                    </p>
                  </div>


                  <div className="space-y-3 sm:col-span-2">
                    <div>
                      <label className="text-sm font-medium">Posição no layout</label>
                      <p className="text-xs text-muted-foreground">
                        Escolha onde este anúncio será exibido para o aluno.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                      {AD_TYPE_OPTIONS.map((item) => {
                        const active = formData.ad_type === item.value;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setFormData((current) => ({ ...current, ad_type: item.value }))}
                            className={cn(
                              'rounded-lg border p-2 text-left transition',
                              active
                                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                : 'border-border bg-card hover:border-primary/50',
                            )}
                          >
                            <PlacementDiagram type={item.value} />
                            <p className="mt-2 text-sm font-semibold text-foreground">{item.label}</p>
                            <p className="text-[11px] leading-4 text-muted-foreground">{item.hint}</p>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {AD_TYPE_OPTIONS.find((item) => item.value === formData.ad_type)?.where}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ordem na posição</label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData((current) => ({
                          ...current,
                          position: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Menor número aparece primeiro quando há vários anúncios no mesmo lugar.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duração (segundos)</label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={formData.display_duration}
                      onChange={(e) =>
                        setFormData((current) => ({
                          ...current,
                          display_duration: Math.min(30, Math.max(1, Number(e.target.value) || 1)),
                        }))
                      }
                    />
                  </div>

                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Status do anúncio</p>
                    <p className="text-xs text-muted-foreground">Desative quando quiser pausar sem excluir.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{formData.is_active ? 'Ativo' : 'Pausado'}</span>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData((current) => ({ ...current, is_active: checked }))}
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock3 className="h-4 w-4 text-primary" />
                    Janela de exibição (opcional)
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Defina quando o anúncio começa e para de aparecer. Deixe em branco para exibir sempre
                    enquanto estiver ativo.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="ad-start-date">
                        Início
                      </label>
                      <Input
                        id="ad-start-date"
                        type="datetime-local"
                        value={formData.start_date}
                        onChange={(e) => setFormData((current) => ({ ...current, start_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="ad-end-date">
                        Fim
                      </label>
                      <Input
                        id="ad-end-date"
                        type="datetime-local"
                        value={formData.end_date}
                        onChange={(e) => setFormData((current) => ({ ...current, end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  {(formData.start_date || formData.end_date) && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={scheduleState({ is_active: formData.is_active, start_date: toIso(formData.start_date), end_date: toIso(formData.end_date) }).variant}>
                        {scheduleState({ is_active: formData.is_active, start_date: toIso(formData.start_date), end_date: toIso(formData.end_date) }).label}
                      </Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setFormData((current) => ({ ...current, start_date: '', end_date: '' }))}
                      >
                        Limpar agendamento
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData((current) => ({ ...current, description: e.target.value }))}
                    placeholder="Explique rapidamente o que o aluno encontra ao clicar."
                  />
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Imagem do anúncio</label>
                      <p className="text-xs text-muted-foreground">
                        Você pode enviar um arquivo ou colar uma URL pública. A prévia aparece ao lado.
                      </p>
                      <AdImageUploadButton
                        currentImageUrl={formData.image_url}
                        onImageUploaded={(url) => setFormData((current) => ({ ...current, image_url: url }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">URL da imagem</label>
                      <Input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData((current) => ({ ...current, image_url: e.target.value }))}
                        placeholder="https://exemplo.com/banner.jpg"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <LayoutTemplate className="h-4 w-4 text-primary" />
                      Prévia rápida
                    </div>

                    {formData.image_url ? (
                      <AppImage
                        src={formData.image_url}
                        alt={formData.title || 'Prévia do anúncio'}
                        className="h-44 w-full rounded-lg object-cover"
                        wrapperClassName="h-44 w-full"
                        fallbackClassName="h-44 w-full"
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center rounded-lg border border-dashed border-border bg-background text-sm text-muted-foreground">
                        Sem imagem selecionada
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="line-clamp-2 font-semibold">{formData.title || 'Título do anúncio'}</p>
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {formData.description || 'A descrição aparecerá aqui para facilitar a revisão antes de salvar.'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{AD_TYPE_OPTIONS.find((item) => item.value === formData.ad_type)?.label}</Badge>
                        <Badge variant={formData.is_active ? 'default' : 'secondary'}>
                          {formData.is_active ? 'Ativo' : 'Pausado'}
                        </Badge>
                      </div>
                      {formData.link_url && (
                        <a
                          href={formData.link_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Testar link
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <AdStudentPreview
                  title={formData.title}
                  description={formData.description}
                  imageUrl={formData.image_url}
                  linkUrl={formData.link_url}
                  adType={formData.ad_type}
                />


                <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-muted-foreground">
                    {editingId ? 'As alterações serão aplicadas neste anúncio.' : 'Ao salvar, o anúncio já fica disponível no painel.'}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {editingId && (
                      <Button type="button" variant="outline" onClick={resetEditor}>
                        Novo anúncio
                      </Button>
                    )}
                    {editingId && selectedAd && (
                      <Button type="button" variant="destructive" onClick={() => setDeleteTarget(selectedAd)}>
                        <Trash2 className="h-4 w-4" /> Excluir
                      </Button>
                    )}
                    <Button type="submit" disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      {editingId ? 'Salvar alterações' : 'Criar anúncio'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Você está removendo "${deleteTarget.title}". Essa ação não pode ser desfeita.`
                : 'Essa ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyId === deleteTarget?.id}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busyId === deleteTarget?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Excluir anúncio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
