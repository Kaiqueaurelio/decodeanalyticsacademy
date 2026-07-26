import React, { useEffect, useState } from 'react';
import { useAds } from '@/hooks/useAds';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ExternalLink, X, Megaphone } from 'lucide-react';
import { AppImage } from '@/components/ui/app-image';

/**
 * Painel de publicidade FIXO na lateral direita (desktop xl+).
 * - Sempre visível durante a rolagem
 * - Mantém a proporção original da imagem (object-contain, sem corte)
 * - Rotaciona anúncios a cada 20s quando há mais de um
 * - Pode ser recolhido (mini-tab) ou fechado por sessão
 */
export function AdSidebar({ className = '' }: { className?: string }) {
  const { ads, recordAdView, recordAdClick } = useAds('sidebar');
  const [idx, setIdx] = useState(0);

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('ad_sidebar_dismissed') === '1';
  });
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('ad_sidebar_collapsed') === '1';
  });

  const current = ads[idx];

  // Rotaciona anúncios
  useEffect(() => {
    if (ads.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % ads.length), 60_000);
    return () => clearInterval(t);
  }, [ads.length]);

  // Registra view do anúncio atual
  useEffect(() => {
    if (current) recordAdView(current.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  if (dismissed || !current) return null;

  const handleClick = () => {
    try {
      recordAdClick(current.id);
      if (current.link_url) window.open(current.link_url, '_blank', 'noopener,noreferrer');
    } catch {
      /* ignore */
    }
  };

  const handleDismiss = () => {
    try {
      sessionStorage.setItem('ad_sidebar_dismissed', '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem('ad_sidebar_collapsed', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Mini-tab quando recolhido (fica sempre visível para reabrir)
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label="Mostrar publicidade"
        className={`fixed right-0 top-1/2 z-30 hidden xl:flex -translate-y-1/2 items-center gap-1.5 rounded-l-xl border border-primary/50 border-r-0 bg-card/95 px-2 py-3 text-xs font-bold text-primary shadow-lg backdrop-blur transition hover:bg-card ${className}`}
      >
        <Megaphone size={14} />
        <span className="writing-vertical">AD</span>
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        className={`fixed right-4 top-1/2 z-30 hidden xl:flex -translate-y-1/2 w-[300px] max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-primary/45 bg-card/95 shadow-xl backdrop-blur ${className}`}
        aria-label="Publicidade"
      >
        <header className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <Megaphone size={13} /> Publicidade
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Recolher publicidade"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <ChevronRight size={14} />
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Fechar publicidade"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <button
            type="button"
            onClick={handleClick}
            className="group flex w-full flex-col gap-3 p-3 text-left"
          >
            {current.image_url ? (
              <AppImage
                src={current.image_url}
                alt={current.title}
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
                className="mx-auto h-auto max-h-[45vh] w-auto max-w-full rounded-xl object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                wrapperClassName="flex w-full items-center justify-center overflow-hidden rounded-xl bg-muted/40"
                fallbackLabel="Imagem indisponível"
              />
            ) : null}

            <div className="space-y-1.5">
              <h4 className="line-clamp-3 text-sm font-bold leading-snug text-foreground">
                {current.title}
              </h4>
              {current.description && (
                <p className="line-clamp-4 text-xs leading-5 text-muted-foreground">
                  {current.description}
                </p>
              )}
            </div>

            <span className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground transition group-hover:bg-primary/90">
              Saiba mais <ExternalLink size={13} />
            </span>
          </button>
        </div>

        {ads.length > 1 && (
          <footer className="flex items-center justify-center gap-1 border-t border-border/60 py-1.5">
            {ads.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                }`}
              />
            ))}
          </footer>
        )}
      </motion.aside>
    </AnimatePresence>
  );
}
