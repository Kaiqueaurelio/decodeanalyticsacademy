import React, { useState, useEffect } from 'react';
import { useAds } from '@/hooks/useAds';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { AdMediaPreview } from '@/components/AdMediaPreview';
import { AdImageLightbox, AdZoomButton } from '@/components/AdImageLightbox';

// Rotas publicas onde o popup nunca deve aparecer (bloqueia login/landing)
const PUBLIC_ROUTES = ['/', '/login', '/reset-password', '/termos', '/anuncie', '/patrocine'];


const AUTO_CLOSE_SECONDS = 25;

interface AdPopupProps {
  trigger?: 'onLoad' | 'onScroll' | 'onExit';
  delay?: number; // em ms
}

export function AdPopup({ trigger = 'onLoad', delay = 2000 }: AdPopupProps) {
  const location = useLocation();
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
  const { ads, loading, recordAdView, recordAdClick } = useAds('popup');
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(AUTO_CLOSE_SECONDS);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  // Fecha imediatamente se o usuario navegar para uma rota publica
  useEffect(() => {
    if (isPublicRoute) setIsVisible(false);
  }, [isPublicRoute]);



  const COOLDOWN_MS = 3 * 60 * 1000; // 3 min entre popups
  const STORAGE_KEY = 'popup_ad_last_shown';

  const currentAd = ads[currentAdIndex];

  const canShowNow = () => {
    try {
      const last = Number(localStorage.getItem(STORAGE_KEY) || 0);
      return Date.now() - last > COOLDOWN_MS;
    } catch {
      return true;
    }
  };

  // Mostra na carga + reagenda a cada cooldown
  useEffect(() => {
    if (loading || ads.length === 0 || trigger !== 'onLoad') return;

    const showAd = () => {
      if (!canShowNow() || document.hidden) return;
      // Rotaciona ad
      setCurrentAdIndex((i) => {
        const next = (i + 1) % ads.length;
        const ad = ads[next];
        if (ad) recordAdView(ad.id);
        return next;
      });
      setTimeLeft(AUTO_CLOSE_SECONDS);
      setIsVisible(true);
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    };

    const initial = setTimeout(showAd, delay);
    const interval = setInterval(showAd, COOLDOWN_MS + 5000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, ads.length, trigger, delay]);

  // Countdown do pop-up
  useEffect(() => {
    if (!isVisible || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsVisible(false);
          return AUTO_CLOSE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, timeLeft]);

  const handleClick = () => {
    if (currentAd) {
      recordAdClick(currentAd.id);
      if (currentAd.link_url) window.open(currentAd.link_url, '_blank');
    }
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const hasLink = Boolean(currentAd?.link_url);
  const isTextOnly = Boolean(currentAd) && !currentAd?.image_url;

  return (
    <AnimatePresence>
      {isVisible && currentAd && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[92vh] my-auto rounded-2xl bg-card shadow-2xl flex flex-col overflow-hidden border border-border/60"
          >
            {/* Botao de Fechar (X) sempre visivel, acima de tudo */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-20 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white shadow-lg ring-2 ring-white/40 transition-all"
              aria-label="Fechar anuncio"
            >
              <X size={20} />
            </button>

            {/* Area scrollavel (midia + texto) */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {currentAd.image_url && (
                <div className="relative w-full flex items-center justify-center bg-muted/30 p-3">
                  <AdMediaPreview
                    src={currentAd.image_url}
                    title={currentAd.title}
                    className="max-h-[62vh] w-auto max-w-full h-auto object-contain mx-auto"
                  />
                  <AdZoomButton onClick={() => setZoomOpen(true)} className="absolute bottom-4 left-4" />
                </div>
              )}

              {isTextOnly ? (
                <div className="px-6 py-8 sm:px-8 sm:py-10">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    <Megaphone size={12} aria-hidden="true" /> Aviso
                  </span>
                  <h2 className="mt-5 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                    {currentAd.title}
                  </h2>
                  {currentAd.description && (
                    <p className="mt-4 whitespace-pre-line text-base leading-7 text-muted-foreground">
                      {currentAd.description}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-5 sm:p-6 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                      Publicidade
                    </p>
                    <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                      {currentAd.title}
                    </h2>
                    {currentAd.description && (
                      <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                        {currentAd.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer fixo com botoes sempre visiveis */}
            <div className="shrink-0 border-t border-border/60 bg-card/95 backdrop-blur p-4 space-y-2">
              <div className="flex gap-3">
                {hasLink ? (
                  <Button
                    onClick={handleClick}
                    className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                  >
                    <ExternalLink size={16} />
                    Saiba Mais
                  </Button>
                ) : null}
                <Button
                  onClick={handleClose}
                  variant={hasLink ? 'outline' : 'default'}
                  className={hasLink ? 'flex-1' : 'w-full'}
                >
                  Fechar
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Fecha automaticamente em{' '}
                <span className="font-bold text-primary">{timeLeft}s</span>
              </p>
            </div>

            {/* Barra de Progresso */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / AUTO_CLOSE_SECONDS) * 100}%` }}
                className="h-full bg-primary"
              />
            </div>
            {currentAd.image_url && (
              <AdImageLightbox
                open={zoomOpen}
                onClose={() => setZoomOpen(false)}
                src={currentAd.image_url}
                title={currentAd.title}
                description={currentAd.description}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
