import { useState } from 'react';
import { ExternalLink, Megaphone, Monitor, Smartphone, X, ZoomIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppImage } from '@/components/ui/app-image';
import { cn } from '@/lib/utils';

type AdType = 'banner' | 'popup' | 'inline' | 'sidebar' | 'footer' | 'sponsor';

interface AdStudentPreviewProps {
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  adType: AdType;
}

const FORMAT_LABEL: Record<AdType, string> = {
  banner: 'Topo da página',
  inline: 'Entre seções do conteúdo',
  sidebar: 'Painel lateral fixo',
  footer: 'Rodapé do celular',
  popup: 'Pop-up central',
  sponsor: 'Página de Patrocínio',
};

function AdCaption({
  title,
  description,
  linkUrl,
  compact,
}: {
  title: string;
  description: string;
  linkUrl: string;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <h4
        className={cn(
          'font-semibold leading-snug text-foreground',
          compact ? 'line-clamp-2 text-sm' : 'text-base',
        )}
      >
        {title || 'Título do anúncio'}
      </h4>
      {(description || !title) && (
        <p
          className={cn(
            'whitespace-pre-line leading-5 text-muted-foreground',
            compact ? 'line-clamp-3 text-xs' : 'text-sm',
          )}
        >
          {description || 'A legenda do anúncio aparece aqui para o aluno.'}
        </p>
      )}
      {linkUrl ? (
        <span className="inline-flex items-center gap-1 pt-0.5 text-xs font-semibold text-primary">
          <ExternalLink className="h-3 w-3" /> Saiba mais
        </span>
      ) : (
        <span className="inline-flex pt-0.5 text-[11px] text-muted-foreground">
          Sem link — apenas informativo
        </span>
      )}
    </div>
  );
}

/**
 * Mostra como o anúncio será exibido na página do aluno, com imagem completa
 * e legenda, antes de salvar/publicar.
 */
export function AdStudentPreview({ title, description, imageUrl, linkUrl, adType }: AdStudentPreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>(
    adType === 'footer' ? 'mobile' : 'desktop',
  );
  const isMobile = device === 'mobile';
  const hasImage = Boolean(imageUrl.trim());

  const image = (className: string) =>
    hasImage ? (
      <AppImage
        src={imageUrl}
        alt={title || 'Prévia do anúncio'}
        className={cn('w-full rounded-lg bg-muted object-contain', className)}
        wrapperClassName="w-full"
        fallbackClassName={cn('w-full rounded-lg', className)}
      />
    ) : null;

  const body = () => {
    switch (adType) {
      case 'popup':
        return (
          <div className="mx-auto w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Megaphone className="h-3 w-3" /> Publicidade
              </span>
              <X className="h-4 w-4 text-muted-foreground" />
            </div>
            {image('max-h-48')}
            <div className={cn(hasImage && 'mt-3')}>
              <AdCaption title={title} description={description} linkUrl={linkUrl} />
            </div>
          </div>
        );
      case 'sidebar':
        return (
          <div className="ml-auto w-[260px] rounded-xl border border-border bg-card p-3 shadow-lg">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Publicidade
            </span>
            {image('max-h-40')}
            <div className={cn(hasImage && 'mt-2')}>
              <AdCaption title={title} description={description} linkUrl={linkUrl} compact />
            </div>
          </div>
        );
      case 'footer':
        return (
          <div className="w-full rounded-xl border border-border bg-card p-3 shadow-lg">
            <div className="flex gap-3">
              {hasImage && (
                <AppImage
                  src={imageUrl}
                  alt={title || 'Prévia do anúncio'}
                  className="h-16 w-16 shrink-0 rounded-lg bg-muted object-contain"
                  wrapperClassName="h-16 w-16 shrink-0"
                  fallbackClassName="h-16 w-16 shrink-0 rounded-lg"
                />
              )}
              <AdCaption title={title} description={description} linkUrl={linkUrl} compact />
            </div>
          </div>
        );
      default:
        // banner e inline
        return (
          <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {hasImage && (
              <AppImage
                src={imageUrl}
                alt={title || 'Prévia do anúncio'}
                className="max-h-56 w-full bg-muted object-contain"
                wrapperClassName="w-full"
                fallbackClassName="h-40 w-full"
              />
            )}
            <div className="p-4">
              <AdCaption title={title} description={description} linkUrl={linkUrl} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ZoomIn className="h-4 w-4 text-primary" />
          Prévia na página do aluno
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-background p-0.5">
          <Button
            type="button"
            size="sm"
            variant={device === 'desktop' ? 'secondary' : 'ghost'}
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => setDevice('desktop')}
            aria-label="Ver prévia em computador"
          >
            <Monitor className="h-3.5 w-3.5" /> Computador
          </Button>
          <Button
            type="button"
            size="sm"
            variant={device === 'mobile' ? 'secondary' : 'ghost'}
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => setDevice('mobile')}
            aria-label="Ver prévia em celular"
          >
            <Smartphone className="h-3.5 w-3.5" /> Celular
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{FORMAT_LABEL[adType]}</p>

      {/* Moldura simulando a tela do aluno */}
      <div
        className={cn(
          'mx-auto w-full rounded-xl border border-border/70 bg-background p-3',
          isMobile ? 'max-w-[340px]' : 'max-w-full',
        )}
      >
        <div className="mb-3 space-y-1.5" aria-hidden="true">
          <div className="h-2 w-24 rounded bg-muted" />
          <div className="h-2 w-full rounded bg-muted/60" />
          <div className="h-2 w-4/5 rounded bg-muted/60" />
        </div>
        {body()}
        <div className="mt-3 space-y-1.5" aria-hidden="true">
          <div className="h-2 w-full rounded bg-muted/60" />
          <div className="h-2 w-3/5 rounded bg-muted/60" />
        </div>
      </div>

      {!hasImage && (
        <Badge variant="outline" className="text-[11px]">
          Sem imagem — o aluno verá somente o texto
        </Badge>
      )}
    </div>
  );
}
