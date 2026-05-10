import React, { useEffect } from 'react';
import { useAds } from '@/hooks/useAds';
import { motion } from 'framer-motion';
import { ExternalLink, X } from 'lucide-react';

/**
 * Coluna lateral de anúncios — só aparece em telas largas (>= xl).
 * Mostra até 2 anúncios "sidebar" empilhados.
 */
export function AdSidebar({ className = '' }: { className?: string }) {
  const { ads, recordAdView, recordAdClick } = useAds('sidebar');
  const [dismissed, setDismissed] = React.useState(false);

  const visible = ads.slice(0, 2);

  useEffect(() => {
    visible.forEach((a) => recordAdView(a.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.length]);

  if (dismissed || visible.length === 0) return null;

  return (
    <aside
      className={`hidden xl:flex flex-col gap-3 w-[170px] fixed right-4 top-24 z-30 max-h-[calc(100vh-7rem)] overflow-y-auto ${className}`}
      aria-label="Publicidade"
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Publicidade
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground/60 hover:text-muted-foreground transition"
          aria-label="Ocultar anúncios"
        >
          <X size={12} />
        </button>
      </div>

      {visible.map((ad, i) => (
        <motion.button
          key={ad.id}
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => {
            recordAdClick(ad.id);
            window.open(ad.link_url, '_blank', 'noopener,noreferrer');
          }}
          className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden text-left hover:border-primary/40 hover:shadow-md transition-all"
        >
          {ad.image_url && (
            <div className="aspect-square overflow-hidden bg-muted">
              <img
                src={ad.image_url}
                alt={ad.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
          <div className="p-3 space-y-1">
            <h4 className="text-xs font-semibold text-foreground line-clamp-2">{ad.title}</h4>
            {ad.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-2">{ad.description}</p>
            )}
            <div className="flex items-center gap-1 text-[10px] text-primary font-medium pt-1">
              <ExternalLink size={10} /> Saiba mais
            </div>
          </div>
        </motion.button>
      ))}
    </aside>
  );
}
