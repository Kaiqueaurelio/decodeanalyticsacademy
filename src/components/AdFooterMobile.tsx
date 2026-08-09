import React, { useEffect, useState } from 'react';
import { useAds } from '@/hooks/useAds';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { AdMediaPreview } from '@/components/AdMediaPreview';
import { AdImageLightbox } from '@/components/AdImageLightbox';

/**
 * Barra fina de anuncio fixa no rodape (apenas mobile).
 * - So aparece em rotas autenticadas (nao na landing/login)
 * - Pode ser fechada (memorizado por sessao)
 * - Rotaciona anuncios "footer" a cada 30s
 */
export function AdFooterMobile() {
  const location = useLocation();
  const { ads, recordAdView, recordAdClick } = useAds('footer');
  const [idx, setIdx] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() =>
    typeof window !== 'undefined' && sessionStorage.getItem('ad_footer_dismissed') === '1'
  );

  // Nao mostra em landing, login, reset
  const hiddenRoutes = ['/', '/login', '/reset-password'];
  const shouldHide = hiddenRoutes.includes(location.pathname);

  const current = ads[idx];

  useEffect(() => {
    if (current) recordAdView(current.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  useEffect(() => {
    if (ads.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % ads.length), 180_000); // Rotaciona a cada 3 min (era 90s)
    return () => clearInterval(t);
  }, [ads.length]);

  if (shouldHide || dismissed || !current) return null;

  const hasLink = Boolean(current.link_url);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 md:hidden border-t border-border/60 bg-card/95 backdrop-blur-md shadow-lg"
        role="complementary"
        aria-label="Anuncio"
      >
        <div className="flex items-center gap-2 px-3 py-2">
          {current.image_url && (
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label="Ampliar imagem do anúncio"
              className="shrink-0 rounded-md transition-transform duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <AdMediaPreview
                src={current.image_url}
                title={current.title}
                compact
                className="h-10 w-10 shrink-0"
              />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              recordAdClick(current.id);
              if (hasLink) window.open(current.link_url, '_blank', 'noopener,noreferrer');
            }}
            disabled={!hasLink}
            className="flex-1 min-w-0 text-left disabled:cursor-default"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary leading-none mb-0.5">
              Publicidade
            </p>
            <p className="text-xs font-semibold truncate text-foreground">{current.title}</p>
            {current.description && (
              <p className="text-[11px] text-muted-foreground truncate">{current.description}</p>
            )}
          </button>
          {hasLink && (
            <a
              href={current.link_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => recordAdClick(current.id)}
              className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold px-3 py-1.5 transition hover:bg-primary/90"
            >
              <ExternalLink size={11} /> Ver
            </a>
          )}

          <button
            onClick={() => {
              sessionStorage.setItem('ad_footer_dismissed', '1');
              setDismissed(true);
            }}
            className="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition"
            aria-label="Fechar anuncio"
          >
            <X size={14} />
          </button>
        </div>

        {current.image_url && (
          <AdImageLightbox
            open={zoomOpen}
            onClose={() => setZoomOpen(false)}
            src={current.image_url}
            title={current.title}
            description={current.description}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
