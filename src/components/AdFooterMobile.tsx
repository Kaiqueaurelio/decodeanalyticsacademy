import React, { useEffect, useState } from 'react';
import { useAds } from '@/hooks/useAds';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { AppImage } from '@/components/ui/app-image';

/**
 * Barra fina de anúncio fixa no rodapé (apenas mobile).
 * - Só aparece em rotas autenticadas (não na landing/login)
 * - Pode ser fechada (memorizado por sessão)
 * - Rotaciona anúncios "footer" a cada 30s
 */
export function AdFooterMobile() {
  const location = useLocation();
  const { ads, recordAdView, recordAdClick } = useAds('footer');
  const [idx, setIdx] = useState(0);
  const [dismissed, setDismissed] = useState(() =>
    typeof window !== 'undefined' && sessionStorage.getItem('ad_footer_dismissed') === '1'
  );

  // Não mostra em landing, login, reset
  const hiddenRoutes = ['/', '/login', '/reset-password'];
  const shouldHide = hiddenRoutes.includes(location.pathname);

  const current = ads[idx];

  useEffect(() => {
    if (current) recordAdView(current.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  useEffect(() => {
    if (ads.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % ads.length), 30_000);
    return () => clearInterval(t);
  }, [ads.length]);

  if (shouldHide || dismissed || !current) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border/60 bg-card/95 backdrop-blur-md shadow-lg"
        role="complementary"
        aria-label="Anúncio"
      >
        <div className="flex items-center gap-2 px-3 py-2">
          {current.image_url && (
            <AppImage
              src={current.image_url}
              alt=""
              referrerPolicy="no-referrer"
              loading="lazy"
              className="h-10 w-10 rounded-md object-cover shrink-0"
              wrapperClassName="h-10 w-10 rounded-md shrink-0"
              fallbackLabel=""
            />
          )}
          <button
            type="button"
            onClick={() => {
              recordAdClick(current.id);
              window.open(current.link_url, '_blank', 'noopener,noreferrer');
            }}
            className="flex-1 min-w-0 text-left"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary leading-none mb-0.5">
              Publicidade
            </p>
            <p className="text-xs font-semibold truncate text-foreground">{current.title}</p>
            {current.description && (
              <p className="text-[11px] text-muted-foreground truncate">{current.description}</p>
            )}
          </button>
          <a
            href={current.link_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordAdClick(current.id)}
            className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold px-3 py-1.5"
          >
            <ExternalLink size={11} /> Ver
          </a>
          <button
            onClick={() => {
              sessionStorage.setItem('ad_footer_dismissed', '1');
              setDismissed(true);
            }}
            className="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Fechar anúncio"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
