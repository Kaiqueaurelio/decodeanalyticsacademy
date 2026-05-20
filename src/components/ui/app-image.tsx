import * as React from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type AppImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  fallbackLabel?: string;
  fallbackClassName?: string;
  wrapperClassName?: string;
  maxRetries?: number;
};

function normalizeImageSrc(src?: string | null) {
  const value = src?.trim();
  if (!value) return null;
  if (value.startsWith('//')) return `https:${value}`;
  return value;
}

export const AppImage = React.forwardRef<HTMLImageElement, AppImageProps>(function AppImage(
  {
    src,
    alt = '',
    className,
    wrapperClassName,
    fallbackClassName,
    fallbackLabel = 'Imagem indisponível',
    onError,
    onLoad,
    maxRetries = 2,
    ...props
  },
  ref,
) {
  const [failed, setFailed] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);
  const retryCountRef = React.useRef(0);
  const retryTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizedSrc = normalizeImageSrc(src);

  // Reseta estado a cada mudança real de src
  React.useEffect(() => {
    setFailed(false);
    setRetryKey(0);
    retryCountRef.current = 0;
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [normalizedSrc]);

  if (!normalizedSrc || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground',
          wrapperClassName,
          fallbackClassName,
        )}
        role="img"
        aria-label={alt || fallbackLabel}
      >
        <span className="inline-flex items-center gap-2 text-xs sm:text-sm">
          <ImageOff className="h-4 w-4" />
          {fallbackLabel}
        </span>
      </div>
    );
  }

  // Cache-buster apenas em tentativas de retry — primeira tentativa usa URL limpa (aproveita cache)
  const finalSrc =
    retryKey > 0 ? `${normalizedSrc}${normalizedSrc.includes('?') ? '&' : '?'}_r=${retryKey}` : normalizedSrc;

  return (
    <img
      ref={ref}
      key={retryKey}
      src={finalSrc}
      alt={alt}
      decoding="async"
      onLoad={(event) => {
        retryCountRef.current = 0;
        onLoad?.(event);
      }}
      onError={(event) => {
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          const delay = 400 * retryCountRef.current;
          if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
          retryTimerRef.current = setTimeout(() => {
            setRetryKey((k) => k + 1);
          }, delay);
          return;
        }
        setFailed(true);
        onError?.(event);
      }}
      className={cn('block', className)}
      {...props}
    />
  );
});
