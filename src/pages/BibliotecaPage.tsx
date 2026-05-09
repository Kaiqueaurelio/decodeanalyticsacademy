import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, FileText, Image as ImageIcon, Video, Music, FileSpreadsheet,
  Presentation, FileType, Link2, Library, Search, ExternalLink, Download,
  Eye, Share2, Copy, Star,
} from 'lucide-react';
import { ActionSheet, type ActionItem } from '@/components/ActionSheet';
import { SwipeableRow, type SwipeAction } from '@/components/SwipeableRow';
import { useLongPress } from '@/hooks/useLongPress';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMaterialFavorites } from '@/hooks/useMaterialFavorites';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Material = Tables<'materials'>;
type Category = Tables<'categories'>;

const TYPE_META: Record<string, { label: string; icon: any; hue: string }> = {
  pdf: { label: 'PDF', icon: FileText, hue: '0 84% 60%' },
  video: { label: 'Vídeo', icon: Video, hue: '270 91% 65%' },
  audio: { label: 'Áudio', icon: Music, hue: '142 76% 55%' },
  image: { label: 'Imagem', icon: ImageIcon, hue: '189 100% 50%' },
  gif: { label: 'GIF', icon: ImageIcon, hue: '189 100% 50%' },
  powerpoint: { label: 'Slides', icon: Presentation, hue: '24 95% 60%' },
  word: { label: 'Word', icon: FileType, hue: '210 100% 60%' },
  excel: { label: 'Excel', icon: FileSpreadsheet, hue: '142 76% 45%' },
  link: { label: 'Link', icon: Link2, hue: '189 100% 50%' },
  exam: { label: 'Prova', icon: FileText, hue: '0 84% 60%' },
  other: { label: 'Outro', icon: FileText, hue: '210 10% 60%' },
};

const TYPE_GROUPS: { key: string; label: string; types: string[] }[] = [
  { key: 'all', label: 'Todos', types: [] },
  { key: 'doc', label: 'PDFs & Docs', types: ['pdf', 'word', 'exam'] },
  { key: 'slide', label: 'Slides', types: ['powerpoint'] },
  { key: 'video', label: 'Vídeos', types: ['video'] },
  { key: 'audio', label: 'Áudios', types: ['audio'] },
  { key: 'image', label: 'Imagens', types: ['image', 'gif'] },
  { key: 'sheet', label: 'Planilhas', types: ['excel'] },
  { key: 'link', label: 'Links', types: ['link'] },
];

export default function BibliotecaPage() {
  const navigate = useNavigate();
  const { isFavorite, toggle: toggleFavorite } = useMaterialFavorites();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: mats }, { data: cats }] = await Promise.all([
        supabase.from('materials').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      ]);
      if (!active) return;
      setMaterials(mats ?? []);
      setCategories(cats ?? []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const group = TYPE_GROUPS.find(g => g.key === typeFilter);
    return materials.filter(m => {
      if (group && group.types.length > 0 && !group.types.includes(m.type)) return false;
      if (categoryFilter !== 'all' && m.category_id !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const inTitle = m.title?.toLowerCase().includes(q);
        const inDesc = m.description?.toLowerCase().includes(q);
        if (!inTitle && !inDesc) return false;
      }
      return true;
    });
  }, [materials, typeFilter, categoryFilter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: materials.length };
    TYPE_GROUPS.forEach(g => {
      if (g.key === 'all') return;
      c[g.key] = materials.filter(m => g.types.includes(m.type)).length;
    });
    return c;
  }, [materials]);

  const handleOpen = (m: Material) => {
    if (m.type === 'video') {
      navigate(`/video/${m.id}`);
      return;
    }
    if (m.file_url) window.open(m.file_url, '_blank', 'noopener,noreferrer');
  };

  const categoryName = (id: string | null) =>
    categories.find(c => c.id === id)?.name ?? 'Sem disciplina';

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-content-show">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Library className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">Biblioteca</h1>
              <p className="text-xs text-muted-foreground">
                {loading ? 'Carregando…' : `${materials.length} materiais disponíveis`}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título ou descrição…"
            className="pl-9"
          />
        </div>

        {/* Type chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
          {TYPE_GROUPS.map(g => {
            const active = typeFilter === g.key;
            const n = counts[g.key] ?? 0;
            return (
              <button
                key={g.key}
                onClick={() => setTypeFilter(g.key)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {g.label} <span className="opacity-70 ml-1">({n})</span>
              </button>
            );
          })}
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                categoryFilter === 'all'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card border-border/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              Todas as disciplinas
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setCategoryFilter(c.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                  categoryFilter === c.id
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card border-border/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl shimmer bg-card/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center border-dashed bg-card/30 backdrop-blur-sm rounded-3xl">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Library className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-base font-semibold">Nenhum material encontrado</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">Não encontramos nada com esses filtros. Tente buscar por outros termos.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
            {filtered.map((m, idx) => (
              <MaterialCard
                key={m.id}
                material={m}
                idx={idx}
                categoryName={categoryName(m.category_id)}
                onOpen={() => handleOpen(m)}
                isFavorite={isFavorite(m.id)}
                onToggleFavorite={async () => {
                  const nowFav = await toggleFavorite(m.id);
                  toast.success(nowFav ? '⭐ Adicionado aos favoritos' : 'Removido dos favoritos');
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Card individual com long-press → bottom sheet de ações
// ─────────────────────────────────────────────────────────
function MaterialCard({
  material: m,
  idx,
  categoryName,
  onOpen,
  isFavorite,
  onToggleFavorite,
}: {
  material: Material;
  idx: number;
  categoryName: string;
  onOpen: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void | Promise<void>;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useIsMobile();
  const meta = TYPE_META[m.type] ?? TYPE_META.other;
  const Icon = meta.icon;
  const longPress = useLongPress(() => setSheetOpen(true));

  const shareMaterial = async () => {
    const url = m.file_url || window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: m.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copiado');
      }
    } catch { /* cancelado */ }
  };

  const copyLink = async () => {
    if (!m.file_url) { toast.error('Sem link disponível'); return; }
    await navigator.clipboard.writeText(m.file_url);
    toast.success('Link copiado');
  };

  const actions: ActionItem[] = [
    {
      id: 'open',
      label: m.type === 'video' ? 'Assistir' : 'Abrir',
      description: meta.label,
      icon: Eye,
      variant: 'primary',
      onSelect: onOpen,
    },
    {
      id: 'favorite',
      label: isFavorite ? 'Remover dos favoritos' : 'Favoritar',
      description: isFavorite ? 'Já está nos favoritos' : 'Marcar para acesso rápido',
      icon: Star,
      onSelect: () => { void onToggleFavorite(); },
    },
    ...(m.file_url
      ? [{
          id: 'download',
          label: 'Baixar',
          description: 'Salvar no dispositivo',
          icon: Download,
          onSelect: () => window.open(m.file_url!, '_blank', 'noopener,noreferrer'),
        } as ActionItem]
      : []),
    { id: 'share', label: 'Compartilhar', icon: Share2, onSelect: shareMaterial },
    { id: 'copy', label: 'Copiar link', icon: Copy, disabled: !m.file_url, onSelect: copyLink },
  ];

  const swipeRightActions: SwipeAction[] = [
    { id: 'open', label: m.type === 'video' ? 'Ver' : 'Abrir', icon: Eye, variant: 'primary', onSelect: onOpen },
    { id: 'share', label: 'Enviar', icon: Share2, onSelect: shareMaterial },
    { id: 'more', label: 'Mais', icon: Copy, onSelect: () => setSheetOpen(true) },
  ];

  // Swipe → direita revela "Favoritar" em amarelo (estilo iOS Mail "Sinalizar")
  const swipeLeftActions: SwipeAction[] = [
    {
      id: 'favorite',
      label: isFavorite ? 'Desfav.' : 'Favorito',
      icon: Star,
      variant: 'warning',
      onSelect: () => { void onToggleFavorite(); },
    },
  ];

  const card = (
    <button
      onClick={(e) => {
        if (longPress.wasLongPress()) { e.preventDefault(); return; }
        onOpen();
      }}
      onTouchStart={longPress.onTouchStart}
      onTouchEnd={longPress.onTouchEnd}
      onTouchMove={longPress.onTouchMove}
      onTouchCancel={longPress.onTouchCancel}
      className="group relative text-left rounded-xl border border-border/60 bg-card p-4 hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-200 animate-card-enter overflow-hidden w-full"
      style={{ animationDelay: `${Math.min(idx, 12) * 40}ms` }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: `linear-gradient(135deg, hsl(${meta.hue} / 0.10) 0%, transparent 70%)` }}
      />
      <div className="relative flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `hsl(${meta.hue} / 0.12)`, color: `hsl(${meta.hue})` }}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">{meta.label}</Badge>
            <span className="text-[10px] text-muted-foreground truncate">{categoryName}</span>
            {isFavorite && (
              <Star
                className="h-3 w-3 ml-auto shrink-0"
                style={{ color: 'hsl(45 100% 55%)', fill: 'hsl(45 100% 55%)' }}
                aria-label="Favorito"
              />
            )}
          </div>
          <p className="text-sm font-semibold leading-snug line-clamp-2">{m.title}</p>
          {m.description && (
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{m.description}</p>
          )}
        </div>
      </div>
      <div className="relative flex items-center justify-end gap-1 mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-primary font-medium flex items-center gap-1">
          {m.type === 'video' ? 'Assistir' : 'Abrir'} <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </button>
  );

  return (
    <ActionSheet
      open={sheetOpen}
      onOpenChange={setSheetOpen}
      title={m.title}
      description={`${meta.label} • ${categoryName}`}
      actions={actions}
      trigger={
        <SwipeableRow rightActions={swipeRightActions} leftActions={swipeLeftActions} disabled={!isMobile}>
          {card}
        </SwipeableRow>
      }
    />
  );
}
