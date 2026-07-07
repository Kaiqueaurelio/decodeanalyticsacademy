import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Newspaper, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { InAppNewsReader } from '@/components/news/InAppNewsReader';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  link: string;
  image: string | null;
  source: string;
  publishedAt: string;
  category: string;
}

interface NewsResponse {
  items: NewsItem[];
  errors: string[];
  fetchedAt: string;
}

const CACHE_KEY = 'decode_tech_news_cache_v1';
const REFRESH_MS = 15 * 60 * 1000;

const FILTERS = [
  'Todos',
  'Inteligência Artificial',
  'Computadores',
  'Windows',
  'Linux',
  'Hardware',
  'Segurança',
  'Programação',
  'Smartphones',
  'Apple',
  'Android',
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d}d`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

function loadCache(): NewsResponse | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as NewsResponse) : null;
  } catch {
    return null;
  }
}

function saveCache(data: NewsResponse) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

export default function NewsPage() {
  const cached = useMemo(() => loadCache(), []);
  const [items, setItems] = useState<NewsItem[]>(cached?.items ?? []);
  const [errors, setErrors] = useState<string[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(cached?.fetchedAt ?? null);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('Todos');
  const [viewer, setViewer] = useState<NewsItem | null>(null);
  const [viewerFailed, setViewerFailed] = useState(false);
  const [pullY, setPullY] = useState(0);
  const startY = useRef<number | null>(null);
  const dragging = useRef(false);

  const fetchNews = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke<NewsResponse>('tech-news');
      if (error) throw error;
      if (data && Array.isArray(data.items)) {
        setItems(data.items);
        setErrors(data.errors || []);
        setFetchedAt(data.fetchedAt);
        saveCache(data);
      }
    } catch {
      setErrors((e) => (e.length ? e : ['network']));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(!!cached);
    const t = setInterval(() => fetchNews(true), REFRESH_MS);
    return () => clearInterval(t);
  }, [fetchNews, cached]);

  // Pull-to-refresh (mobile)
  useEffect(() => {
    if (typeof window === 'undefined' || !('ontouchstart' in window)) return;
    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || viewer) return;
      startY.current = e.touches[0].clientY;
      dragging.current = true;
    };
    const onMove = (e: TouchEvent) => {
      if (!dragging.current || startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) return setPullY(0);
      setPullY(Math.min(90, dy * 0.5));
    };
    const onEnd = () => {
      if (!dragging.current) return;
      dragging.current = false;
      startY.current = null;
      if (pullY >= 60 && !refreshing) fetchNews();
      setPullY(0);
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [pullY, refreshing, viewer, fetchNews]);

  const filtered = useMemo(
    () => (filter === 'Todos' ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );

  const openViewer = (item: NewsItem) => {
    setViewer(item);
  };


  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Pull indicator */}
      {pullY > 0 && (
        <div
          aria-hidden
          className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
          style={{ transform: `translateY(${pullY - 30}px)` }}
        >
          <div className="mt-2 h-9 w-9 rounded-full bg-card border border-border shadow-lg flex items-center justify-center">
            <RefreshCw className="h-4 w-4 text-primary" style={{ transform: `rotate(${pullY * 4}deg)` }} />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Newspaper className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold truncate">Notícias de Tecnologia</h1>
              {fetchedAt && (
                <p className="text-[11px] text-muted-foreground truncate">
                  Atualizado {timeAgo(fetchedAt)} · {items.length} notícias
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => fetchNews()}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            aria-label="Atualizar"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </button>
        </div>

        {/* Filters */}
        <div className="max-w-5xl mx-auto px-4 pb-3 -mt-1">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {FILTERS.map((f) => {
              const active = f === filter;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border',
                    active
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/30'
                      : 'bg-card hover:bg-muted border-border text-foreground/80',
                  )}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5">
        {errors.length > 0 && !loading && items.length > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Alguns portais estão indisponíveis: <b>{errors.join(', ')}</b>. Mostrando o restante.
            </span>
          </div>
        )}

        {loading && items.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border overflow-hidden animate-pulse">
                <div className="h-40 bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2">
                <WifiOff className="h-8 w-8" />
                <p>Sem conexão e sem cache. Tente novamente.</p>
              </div>
            ) : (
              <p>Nenhuma notícia nesta categoria no momento.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <NewsCard key={item.id} item={item} onOpen={() => openViewer(item)} />
            ))}
          </div>
        )}

        <p className="text-center text-[11px] text-muted-foreground/60 mt-10">
          Atualização automática a cada 15 minutos. Puxe para baixo para atualizar.
        </p>
      </main>

      {/* WebView modal */}
      {viewer && (
        <div className="fixed inset-0 z-[80] bg-background/95 backdrop-blur flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <button
              onClick={() => setViewer(null)}
              className="p-2 rounded-lg hover:bg-muted"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{viewer.source}</p>
              <p className="text-[11px] text-muted-foreground truncate">{viewer.title}</p>
            </div>
            <button
              onClick={() => openExternal(viewer.link)}
              className="p-2 rounded-lg hover:bg-muted"
              aria-label="Abrir no navegador"
              title="Abrir no navegador"
            >
              <ExternalLink className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 relative bg-white">
            {!viewerFailed ? (
              <iframe
                key={viewer.id}
                src={viewer.link}
                title={viewer.title}
                className="absolute inset-0 w-full h-full border-0"
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onError={() => setViewerFailed(true)}
              />
            ) : (
              <FallbackOpen url={viewer.link} onOpen={() => openExternal(viewer.link)} />
            )}
            {/* Bloqueio de X-Frame-Options: oferecer sempre abrir no navegador */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <button
                onClick={() => openExternal(viewer.link)}
                className="rounded-full bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 shadow-lg flex items-center gap-2"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Não carregou? Abrir no navegador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewsCard({ item, onOpen }: { item: NewsItem; onOpen: () => void }) {
  const [imgOk, setImgOk] = useState(!!item.image);
  return (
    <button
      onClick={onOpen}
      className="group text-left rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all flex flex-col"
    >
      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
        {imgOk && item.image ? (
          <img
            src={item.image}
            alt=""
            loading="lazy"
            onError={() => setImgOk(false)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
            <Newspaper className="h-10 w-10 text-primary/60" />
          </div>
        )}
        <span className="absolute top-2 left-2 rounded-full bg-black/70 backdrop-blur text-white text-[10px] font-semibold px-2 py-1">
          {item.source}
        </span>
        {item.category && item.category !== 'Geral' && (
          <span className="absolute top-2 right-2 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-semibold px-2 py-1">
            {item.category}
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2">
        <h3 className="font-bold text-sm leading-snug line-clamp-3 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        {item.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
        )}
        <p className="text-[11px] text-muted-foreground/70 mt-auto pt-1">{timeAgo(item.publishedAt)}</p>
      </div>
    </button>
  );
}

function FallbackOpen({ url, onOpen }: { url: string; onOpen: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center bg-background">
      <ExternalLink className="h-10 w-10 text-primary" />
      <p className="text-sm font-semibold">Este site não permite pré-visualização.</p>
      <p className="text-xs text-muted-foreground break-all">{url}</p>
      <button
        onClick={onOpen}
        className="mt-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold px-5 py-2"
      >
        Abrir no navegador
      </button>
    </div>
  );
}
