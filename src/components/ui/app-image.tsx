import * as React from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type AppImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  fallbackLabel?: string;
  fallbackClassName?: string;
  wrapperClassName?: string;
};

function normalizeImageSrc(src?: string | null) {
  const value = src?.trim();
  if (!value) return null;
  if (value.startsWith('//')) return `https:${value}`;
  return value;
}

export const AppImage = React.forwardRef<HTMLImageElement, AppImageProps>(function AppImage(
  { src, alt = '', className, wrapperClassName, fallbackClassName, fallbackLabel = 'Imagem indisponível', onError, ...props },
  ref,
) {
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  const normalizedSrc = normalizeImageSrc(src);

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

  return (
    <img
      ref={ref}
      src={normalizedSrc}
      alt={alt}
      decoding="async"
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
      className={cn('block', className)}
      {...props}
    />
  );
});