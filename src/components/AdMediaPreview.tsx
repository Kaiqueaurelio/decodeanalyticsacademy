import { Image, Mic, Video } from 'lucide-react';
import { AppImage } from '@/components/ui/app-image';
import { cn } from '@/lib/utils';

export type AdMediaKind = 'image' | 'video' | 'audio';

export function getAdMediaKind(url: string): AdMediaKind {
  const value = url.toLowerCase();
  if (/\.(mp4|mov|webm|m4v|avi|mkv)(\?|#|$)/.test(value)) return 'video';
  if (/\.(mp3|wav|m4a|ogg|aac)(\?|#|$)/.test(value)) return 'audio';
  return 'image';
}

interface AdMediaPreviewProps {
  src: string;
  title: string;
  compact?: boolean;
  className?: string;
  imageClassName?: string;
  wrapperClassName?: string;
}

export function AdMediaPreview({
  src,
  title,
  compact = false,
  className,
  imageClassName,
  wrapperClassName,
}: AdMediaPreviewProps) {
  const kind = getAdMediaKind(src);

  if (kind === 'video') {
    if (compact) {
      return (
        <div className={cn('flex items-center justify-center rounded-md bg-black text-white', className)}>
          <Video className="h-4 w-4" />
        </div>
      );
    }

    return (
      <video
        src={src}
        title={title}
        controls
        playsInline
        className={cn('h-full w-full bg-black object-contain', className)}
      />
    );
  }

  if (kind === 'audio') {
    if (compact) {
      return (
        <div className={cn('flex items-center justify-center rounded-md bg-primary/15 text-primary', className)}>
          <Mic className="h-4 w-4" />
        </div>
      );
    }

    return (
      <div className={cn('flex h-full w-full items-center justify-center bg-muted p-5', className)}>
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <Mic className="h-4 w-4 text-primary" />
            {title}
          </div>
          <audio src={src} controls className="w-full" />
        </div>
      </div>
    );
  }

  return (
    <AppImage
      src={src}
      alt={title}
      referrerPolicy="strict-origin-when-cross-origin"
      loading={compact ? 'lazy' : 'eager'}
      className={cn(compact ? 'h-10 w-10 rounded-md object-cover shrink-0' : 'h-full w-full object-cover', imageClassName || className)}
      wrapperClassName={cn(compact ? 'h-10 w-10 rounded-md shrink-0' : 'h-full w-full', wrapperClassName)}
      fallbackLabel={compact ? '' : 'Midia do anuncio indisponivel'}
    />
  );
}
