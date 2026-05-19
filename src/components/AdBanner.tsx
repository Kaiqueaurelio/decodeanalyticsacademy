import React, { useEffect } from 'react';
import { useAds, type Ad } from '@/hooks/useAds';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';
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
      window.open(currentAd.link_url, '_blank');
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-lg border border-border/50 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-4 flex items-center gap-4 ${className}`}
    >
      {/* Imagem do Anúncio */}
      {currentAd.image_url && (
        <div className="shrink-0">
          <AppImage
            src={currentAd.image_url}
            alt={currentAd.title}
            referrerPolicy="no-referrer"
            className="h-16 w-24 object-cover rounded-md"
            wrapperClassName="h-16 w-24 rounded-md"
            fallbackLabel=""
          />
        </div>
      )}

      {/* Conteúdo do Anúncio */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
          Publicidade
        </p>
        <h3 className="text-sm font-bold text-foreground mb-1 truncate">
          {currentAd.title}
        </h3>
        {currentAd.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {currentAd.description}
          </p>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          onClick={handleClick}
          size="sm"
          className="gap-1.5 bg-primary hover:bg-primary/90"
        >
          <ExternalLink size={14} />
          <span className="hidden sm:inline">Saiba mais</span>
        </Button>

        {ads.length > 1 && (
          <Button
            onClick={handleNext}
            variant="outline"
            size="sm"
            className="hidden sm:flex"
          >
            Próximo
          </Button>
        )}

        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <X size={16} />
        </Button>
      </div>
    </motion.div>
  );
}
