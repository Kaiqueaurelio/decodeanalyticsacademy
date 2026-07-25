import React, { useEffect } from 'react';
import { useAds } from '@/hooks/useAds';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppImage } from '@/components/ui/app-image';

interface AdBannerProps {
  position?: 'top' | 'bottom' | 'inline';
  className?: string;
}

export function AdBanner({ position = 'inline', className = '' }: AdBannerProps) {
  const { ads, loading, recordAdView, recordAdClick } = useAds('banner');
  const [currentAdIndex, setCurrentAdIndex] = React.useState(0);
  const [dismissed, setDismissed] = React.useState(false);

  const currentAd = ads[currentAdIndex];

  useEffect(() => {
    if (currentAd && !dismissed) {
      recordAdView(currentAd.id);
    }
  }, [currentAd, dismissed]);

  if (loading || ads.length === 0 || dismissed) return null;

  const handleClick = () => {
    if (currentAd) {
      recordAdClick(currentAd.id);
      window.open(currentAd.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  const handleNext = () => {
    setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    setDismissed(false);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-2xl border border-primary/45 bg-card/75 p-3 shadow-sm backdrop-blur sm:p-4 ${className}`}
      aria-label="Publicidade"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {currentAd.image_url && (
          <AppImage
            src={currentAd.image_url}
            alt={currentAd.title}
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
            className="mx-auto h-auto max-h-64 w-auto max-w-full rounded-xl object-contain sm:max-h-32 sm:max-w-[220px]"
            wrapperClassName="flex w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/40 sm:w-auto"
            fallbackLabel=""
          />
        )}


        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Publicidade</p>
            <button
              onClick={handleDismiss}
              type="button"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Ocultar publicidade"
            >
              <X size={15} />
            </button>
          </div>
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground sm:text-lg">
            {currentAd.title}
          </h3>
          {currentAd.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {currentAd.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
          <Button onClick={handleClick} size="sm" className="h-10 gap-2 px-4 font-bold">
            Saiba mais <ExternalLink size={14} />
          </Button>

          {ads.length > 1 && (
            <Button onClick={handleNext} variant="outline" size="sm" className="h-10 gap-1.5 px-3">
              Próximo <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </div>
    </motion.section>
  );
}
