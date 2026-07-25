import React, { useEffect, useMemo, useState } from 'react';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const supabase = supabaseTyped as any;

type AdType = 'banner' | 'popup' | 'inline' | 'sidebar' | 'footer';

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string;
  ad_type: AdType;
  is_active: boolean;
  display_duration: number;
  view_count: number;
  click_count: number;
  created_at?: string;
}

interface AdFormState {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  ad_type: AdType;
  display_duration: number;
  is_active: boolean;
}

const AD_TYPE_OPTIONS: { value: AdType; label: string; hint: string }[] = [
  { value: 'banner', label: 'Banner', hint: 'Topo e áreas de destaque' },
  { value: 'popup', label: 'Pop-up', hint: 'Aparece por alguns segundos' },
  { value: 'inline', label: 'Inline', hint: 'No meio do conteúdo' },
  { value: 'sidebar', label: 'Lateral', hint: 'Coluna desktop' },
  { value: 'footer', label: 'Rodapé', hint: 'Faixa fixa no mobile' },
];

const createEmptyForm = (): AdFormState => ({
  title: '',
  description: '',
  image_url: '',
  link_url: '',
  ad_type: 'banner',
  display_duration: 5,
  is_active: true,
});

const sortAds = (items: Ad[]) =>
  [...items].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

const mapAdToForm = (ad: Ad): AdFormState => ({
  title: ad.title,
  description: ad.description || '',
  image_url: ad.image_url || '',
  link_url: ad.link_url,
  ad_type: ad.ad_type,
  display_duration: ad.display_duration || 5,
  is_active: ad.is_active,
});

const formatErrorMessage = (error: any, fallback: string) =>
  error?.message || error?.details || error?.hint || fallback;

export function AdminAdsManager() {
  const { user, isAdmin } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
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
      [ad.title, ad.description || '', ad.link_url, ad.ad_type]
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
      const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAds(sortAds(data || []));
    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
      toast.error(formatErrorMessage(error, 'Não foi possível carregar os anúncios'));
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

    if (!title || !linkUrl) {
      toast.error('Título e URL de destino são obrigatórios');
      return false;
    }

    try {
      new URL(linkUrl);
    } catch {
      toast.error('Use uma URL válida, com https://');
      return false;
    }

    if (formData.image_url.trim()) {
      try {
        new URL(formData.image_url.trim());
      } catch {
        toast.error('A URL da imagem precisa ser válida');
        return false;
      }
    }

    return true;
  };

  const buildPayload = () => ({
    title: formData.title.trim(),
    description: formData.description.trim() || null,
    image_url: formData.image_url.trim() || null,
    link_url: formData.link_url.trim(),
    ad_type: formData.ad_type,
    display_duration: Math.min(30, Math.max(1, Number(formData.display_duration) || 5)),
    is_active: formData.is_active,
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
              ) : filteredAds.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center">
                  <Megaphone className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                  <p className="font-medium">Nenhum anúncio encontrado</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ajuste a busca ou clique em <strong>Novo</strong> para começar.
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
                              <Badge variant={ad.is_active ? 'default' : 'secondary'}>
                                {ad.is_active ? 'Ativo' : 'Pausado'}
                              </Badge>
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
                    <label className="text-sm font-medium">URL de destino</label>
                    <Input
                      type="url"
                      value={formData.link_url}
                      onChange={(e) => setFormData((current) => ({ ...current, link_url: e.target.value }))}
                      placeholder="https://exemplo.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Formato</label>
                    <Select
                      value={formData.ad_type}
                      onValueChange={(value: AdType) => setFormData((current) => ({ ...current, ad_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AD_TYPE_OPTIONS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label} · {item.hint}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
