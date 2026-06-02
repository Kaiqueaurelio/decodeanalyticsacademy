import * as React from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toPromoMediaUrl } from '@/lib/promo-media';

type AppImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  fallbackLabel?: string;
  fallbackClassName?: string;
  wrapperClassName?: string;
  maxRetries?: number;
};

const PUBLIC_IMAGE_BUCKETS = ['materials', 'ads', 'announcements', 'apostilas', 'avatars'];

function normalizeImageSrc(src?: string | null) {
  const value = src?.trim();
  if (!value) return null;
  if (value.startsWith('//')) return `https:${value}`;
  return value;
}

function buildSupabasePublicUrl(bucket: string, path: string) {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  if (!baseUrl) return null;
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${cleanBase}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

function buildImageCandidates(src?: string | null) {
  const proxied = toPromoMediaUrl(src);
  const normalized = normalizeImageSrc(proxied ?? src);
  if (!normalized) return [];

  const candidates = new Set<string>();
  const addCandidate = (value?: string | null) => {
    const next = value?.trim();
    if (next) candidates.add(next);
  };

  addCandidate(normalized);
  addCandidate(encodeURI(normalized));

  if (/^(blob:|data:)/i.test(normalized)) {
    return Array.from(candidates);
  }

  const pushStoragePathVariants = (path: string) => {
    const normalizedPath = path.replace(/^\/+/, '');
    PUBLIC_IMAGE_BUCKETS.forEach((bucket) => {
      addCandidate(buildSupabasePublicUrl(bucket, normalizedPath));
    });
  };

  if (/^https?:\/\//i.test(normalized)) {
    try {
      const url = new URL(normalized);
      const marker = '/storage/v1/object/public/';
      const markerIndex = url.pathname.indexOf(marker);

      if (markerIndex >= 0) {
        const storagePath = url.pathname.slice(markerIndex + marker.length).replace(/^\/+/, '');
        const [bucket, ...pathParts] = storagePath.split('/');
        const objectPath = pathParts.join('/');

        if (bucket && objectPath) {
          pushStoragePathVariants(objectPath);

          if (!objectPath.startsWith('ads/')) {
            pushStoragePathVariants(`ads/${objectPath}`);
          }
          if (!objectPath.startsWith('apostila-images/')) {
            pushStoragePathVariants(`apostila-images/${objectPath}`);
          }
        }
      }
    } catch {
      // Ignora URLs invalidas e mantem somente a original.
    }

    return Array.from(candidates);
  }

  pushStoragePathVariants(normalized);
  if (!normalized.startsWith('ads/')) {
    pushStoragePathVariants(`ads/${normalized}`);
  }
  if (!normalized.startsWith('apostila-images/')) {
    pushStoragePathVariants(`apostila-images/${normalized}`);
  }

  return Array.from(candidates);
}

function withRetryParam(src: string, retryKey: number) {
  if (!retryKey || /^(blob:|data:)/i.test(src)) return src;
  return `${src}${src.includes('?') ? '&' : '?'}_r=${retryKey}`;
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
  const [candidateIndex, setCandidateIndex] = React.useState(0);
  const [blobFallbackUrl, setBlobFallbackUrl] = React.useState<string | null>(null);
  const retryCountRef = React.useRef(0);
  const retryTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const blobFallbackAttemptedRef = React.useRef(false);
  const blobUrlRef = React.useRef<string | null>(null);

  const candidateSrcs = React.useMemo(() => buildImageCandidates(src), [src]);
  const activeCandidate = blobFallbackUrl ?? candidateSrcs[candidateIndex] ?? null;

  // Reseta estado a cada mudanca real de src
  React.useEffect(() => {
    setFailed(false);
    setRetryKey(0);
    setCandidateIndex(0);
    setBlobFallbackUrl(null);
    retryCountRef.current = 0;
    blobFallbackAttemptedRef.current = false;
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [src]);

  const tryBlobFallback = React.useCallback(async () => {
    if (!activeCandidate || blobFallbackAttemptedRef.current || /^(blob:|data:)/i.test(activeCandidate)) {
      return false;
    }

    blobFallbackAttemptedRef.current = true;

    try {
      const response = await fetch(activeCandidate, { cache: 'no-store', mode: 'cors' });
      if (!response.ok) return false;

      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) return false;

      const objectUrl = URL.createObjectURL(blob);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = objectUrl;

      setBlobFallbackUrl(objectUrl);
      setFailed(false);
      setRetryKey(0);
      retryCountRef.current = 0;
      return true;
    } catch {
      return false;
    }
  }, [activeCandidate]);

  if (!activeCandidate || failed) {
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

  const finalSrc = withRetryParam(activeCandidate, retryKey);

  return (
    <img
      ref={ref}
      key={`${candidateIndex}-${retryKey}-${blobFallbackUrl ? 'blob' : 'url'}`}
      src={finalSrc}
      alt={alt}
      decoding="async"
      onLoad={(event) => {
        retryCountRef.current = 0;
        onLoad?.(event);
      }}
      onError={(event) => {
        if (!blobFallbackUrl && candidateIndex < candidateSrcs.length - 1) {
          retryCountRef.current = 0;
          setRetryKey(0);
          setCandidateIndex((index) => index + 1);
          return;
        }

        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          const delay = 400 * retryCountRef.current;
          if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
          retryTimerRef.current = setTimeout(() => {
            setRetryKey((k) => k + 1);
          }, delay);
          return;
        }

        void tryBlobFallback().then((resolved) => {
          if (resolved) return;
          setFailed(true);
          onError?.(event);
        });
      }}
      className={cn('block', className)}
      {...props}
    />
  );
});
