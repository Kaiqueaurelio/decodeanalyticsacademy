import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { useAds } from '@/hooks/useAds';
import { AdMediaPreview } from '@/components/AdMediaPreview';

const HIDDEN_ROUTES = ['/', '/login', '/reset-password'];
const APP_CONTENT_PREFIXES = [
  '/dashboard',
  '/profile',
  '/apostila',
  '/biblioteca',
  '/livros',
  '/calculadora',
  '/cursos',
  '/messages',
  '/community',
  '/admin',
];

export function PersistentAdSpot() {
  const location = useLocation();
  const { ads, recordAdView, recordAdClick } = useAds('inline', location.pathname);
  const [idx, setIdx] = useState(0);

  const current = ads[idx];
  const shouldHide =
    HIDDEN_ROUTES.includes(location.pathname) ||
    APP_CONTENT_PREFIXES.some((route) => location.pathname.startsWith(route));

  useEffect(() => {
    if (!current || shouldHide) return;
    recordAdView(current.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, shouldHide]);

  useEffect(() => {
    if (ads.length < 2) return;
    const timer = window.setInterval(() => setIdx((value) => (value + 1) % ads.length), 45_000);
    return () => window.clearInterval(timer);
  }, [ads.length]);

  if (shouldHide || !current) return null;

  const openAd = () => {
    recordAdClick(current.id);
    window.open(current.link_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      className="hidden lg:block fixed bottom-5 right-5 z-40 w-[250px] rounded-xl border border-border/70 bg-card/92 p-3 shadow-xl backdrop-blur-xl"
      aria-label="Publicidade persistente"
    >
      <button type="button" onClick={openAd} className="group block w-full text-left">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Publicidade</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
            <ExternalLink className="h-3 w-3" /> Ver
          </span>
        </div>
        <div className="flex gap-3">
          {current.image_url && (
            <AdMediaPreview src={current.image_url} title={current.title} compact className="h-14 w-14 shrink-0 rounded-lg" />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground group-hover:text-primary">
              {current.title}
            </h3>
            {current.description && (
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{current.description}</p>
            )}
          </div>
        </div>
      </button>
    </motion.aside>
  );
}
