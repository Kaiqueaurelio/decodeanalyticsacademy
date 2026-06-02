import React, { useEffect } from 'react';
import { useAds } from '@/hooks/useAds';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { AppImage } from '@/components/ui/app-image';

/**
 * Bloco lateral de publicidade integrado ao layout.
 * Nao usa position fixed para nao cobrir conteudo, botoes ou listas do app.
 */
export function AdSidebar({ className = '' }: { className?: string }) {
  const { ads, recordAdView, recordAdClick } = useAds('sidebar');
  const visible = ads.slice(0, 1);

  useEffect(() => {
    visible.forEach((a) => recordAdView(a.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.length]);

  if (visible.length === 0) return null;

  return (
    <aside
      className={`hidden xl:block lg:pl-72 px-4 sm:px-6 lg:px-8 pb-8 ${className}`}
      aria-label="Publicidade"
    >
      <div className="mx-auto w-full max-w-[1400px]">
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
            className="group grid w-full max-w-md grid-cols-[92px_1fr] gap-4 rounded-2xl border border-primary/50 bg-card/70 p-4 text-left shadow-sm backdrop-blur transition-all hover:border-primary hover:bg-card"
          >
            {ad.image_url ? (
              <AppImage
                src={ad.image_url}
                alt={ad.title}
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
                className="h-24 w-24 rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
                wrapperClassName="h-24 w-24 rounded-xl overflow-hidden bg-muted"
                fallbackLabel="Imagem indisponível"
              />
            ) : (
              <div className="h-24 w-24 rounded-xl bg-primary/10" />
            )}

            <div className="min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Publicidade</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                  Ver <ExternalLink size={13} />
                </span>
              </div>
              <h4 className="line-clamp-2 text-base font-bold leading-snug text-foreground">{ad.title}</h4>
              {ad.description && (
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{ad.description}</p>
              )}
              <span className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition group-hover:bg-primary/90">
                Saiba mais <ExternalLink size={14} />
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </aside>
  );
}
