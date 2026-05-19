import React, { useState, useEffect } from 'react';
import { useAds, type Ad } from '@/hooks/useAds';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppImage } from '@/components/ui/app-image';

interface AdPopupProps {
  trigger?: 'onLoad' | 'onScroll' | 'onExit';
  delay?: number; // em ms
}

export function AdPopup({ trigger = 'onLoad', delay = 2000 }: AdPopupProps) {
  const { ads, loading, recordAdView, recordAdClick } = useAds('popup');
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(8);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

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
      setTimeLeft(8);
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
          return 8;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, timeLeft]);

  const handleClick = () => {
    if (currentAd) {
      recordAdClick(currentAd.id);
      window.open(currentAd.link_url, '_blank');
    }
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && currentAd && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md rounded-2xl bg-white dark:bg-card shadow-2xl overflow-hidden"
          >
            {/* Imagem do Anúncio */}
            {currentAd.image_url && (
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                <AppImage
                  src={currentAd.image_url}
                  alt={currentAd.title}
                  referrerPolicy="no-referrer"
                  loading="eager"
                  className="w-full h-full object-cover"
                  wrapperClassName="w-full h-full"
                  fallbackLabel="Imagem do anúncio indisponível"
                />
              </div>
            )}

            {/* Conteúdo */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                  Publicidade Patrocinada
                </p>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {currentAd.title}
                </h2>
                {currentAd.description && (
                  <p className="text-sm text-muted-foreground">
                    {currentAd.description}
                  </p>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleClick}
                  className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                >
                  <ExternalLink size={16} />
                  Saiba Mais
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>

              {/* Countdown */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Fecha automaticamente em{' '}
                  <span className="font-bold text-primary">{timeLeft}s</span>
                </p>
              </div>
            </div>

            {/* Botão de Fechar (X) */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-all"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            {/* Barra de Progresso */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / 8) * 100}%` }}
                className="h-full bg-primary"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
