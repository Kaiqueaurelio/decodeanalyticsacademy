import { useEffect, useState } from 'react';
import { X, ExternalLink, Share2, Loader2, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

interface ReaderResult {
  ok: boolean;
  title: string;
  byline: string | null;
  siteName: string | null;
  image: string | null;
  publishedAt: string | null;
  contentHtml: string;
  textLength: number;
  error?: string;
}

interface Props {
  item: NewsItem;
  onClose: () => void;
}

function estimateReadTime(chars: number): number {
  const words = chars / 5;
  return Math.max(1, Math.round(words / 220));
}

export function InAppNewsReader({ item, onClose }: Props) {
  const [data, setData] = useState<ReaderResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res, error: err } = await supabase.functions.invoke<ReaderResult>('news-reader', {
          body: { url: item.link },
        });
        if (cancelled) return;
        if (err) throw err;
        if (res?.ok && res.contentHtml) {
          setData(res);
        } else {
          setError(res?.error || 'Não foi possível carregar a matéria.');
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Falha ao buscar conteúdo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item.link]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const share = async () => {
    const shareData = { title: item.title, text: item.summary, url: item.link };
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share(shareData);
      } catch {
        /* user cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(item.link);
      } catch {
        /* ignore */
      }
    }
  };

  const title = data?.title || item.title;
  const image = data?.image || item.image;
  const publishedAt = data?.publishedAt || item.publishedAt;
  const readTime = data ? estimateReadTime(data.textLength) : null;

  return (
    <div className="fixed inset-0 z-[90] bg-background animate-in fade-in duration-200 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur bg-background/85 border-b border-border">
        <div className="max-w-3xl mx-auto px-3 py-2 flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-primary truncate">{item.source}</p>
            {readTime && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {readTime} min de leitura
              </p>
            )}
          </div>
          <button
            onClick={share}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Compartilhar"
            title="Compartilhar"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {/* Hero */}
          <div className="mb-4 flex flex-wrap gap-2 items-center text-[11px]">
            <span className="rounded-full bg-primary/15 text-primary font-semibold px-2.5 py-1">
              {item.source}
            </span>
            {item.category && item.category !== 'Geral' && (
              <span className="rounded-full bg-muted text-foreground/80 font-semibold px-2.5 py-1">
                {item.category}
              </span>
            )}
            {publishedAt && (
              <span className="text-muted-foreground">
                {new Date(publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-3">{title}</h1>
          {data?.byline && (
            <p className="text-xs text-muted-foreground mb-4">Por {data.byline}</p>
          )}

          {image && (
            <div className="mb-6 rounded-2xl overflow-hidden bg-muted aspect-[16/9]">
              <img src={image} alt="" className="w-full h-full object-cover" loading="eager" />
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando matéria completa…
              </div>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200 flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Não conseguimos extrair o texto desta matéria.</p>
                  <p className="text-xs opacity-80 mt-1">{item.summary || 'Você pode abrir no site original.'}</p>
                </div>
              </div>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5"
              >
                <ExternalLink className="h-4 w-4" /> Abrir no site original
              </a>
            </div>
          )}

          {!loading && !error && data && (
            <div
              className="news-article prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-[15px] prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl prose-img:my-4"
              dangerouslySetInnerHTML={{ __html: data.contentHtml }}
            />
          )}

          <div className="mt-10 pt-6 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Fonte: {item.source}</span>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              Ver no site original <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}
