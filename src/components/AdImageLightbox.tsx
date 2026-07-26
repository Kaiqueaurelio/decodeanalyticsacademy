import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';
import { AppImage } from '@/components/ui/app-image';
import { cn } from '@/lib/utils';

interface AdImageLightboxProps {
  open: boolean;
  onClose: () => void;
  src: string;
  title: string;
  description?: string | null;
}

/**
 * Visualizador em tela cheia para a midia de um anuncio.
 * Garante que qualquer imagem (alta, larga, pequena) seja lida por completo,
 * mantendo proporcao original e exibindo a legenda logo abaixo.
 */
export function AdImageLightbox({ open, onClose, src, title, description }: AdImageLightboxProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label={`Anúncio ampliado: ${title}`}
          onClick={onClose}
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto overscroll-contain bg-background/95 p-4 backdrop-blur-md sm:p-8"
        >
          <motion.figure
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="my-auto flex w-full max-w-3xl flex-col gap-5 rounded-2xl border border-border/70 bg-card p-4 shadow-2xl sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Publicidade
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar imagem ampliada"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <X size={16} />
              </button>
            </div>

            <AppImage
              src={src}
              alt={title}
              referrerPolicy="strict-origin-when-cross-origin"
              className="mx-auto h-auto max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
              wrapperClassName="flex w-full items-center justify-center rounded-xl bg-muted/30 p-2"
              fallbackLabel="Imagem indisponível"
            />

            <figcaption className="space-y-2">
              <h2 className="text-lg font-bold leading-snug text-foreground sm:text-xl">{title}</h2>
              {description && (
                <p className="text-sm leading-6 text-muted-foreground">{description}</p>
              )}
            </figcaption>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Botao padrao "Ampliar" usado pelos formatos de anuncio. */
export function AdZoomButton({
  onClick,
  className,
  label = 'Ampliar imagem',
}: {
  onClick: () => void;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/90 px-2.5 py-1.5 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur transition-colors duration-200 hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
        className,
      )}
    >
      <ZoomIn size={13} aria-hidden="true" /> Ampliar
    </button>
  );
}
