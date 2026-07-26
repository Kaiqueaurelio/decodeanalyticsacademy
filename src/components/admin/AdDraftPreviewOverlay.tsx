import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { ExternalLink, Eye, Megaphone, X } from 'lucide-react';
import { AppImage } from '@/components/ui/app-image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const AD_DRAFT_PREVIEW_KEY = 'decode:ad-draft-preview';
export const AD_DRAFT_PREVIEW_PARAM = 'ad_preview';

export interface AdDraftPreview {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  ad_type: 'banner' | 'popup' | 'inline' | 'sidebar' | 'footer';
}

function readDraft(): AdDraftPreview | null {
  try {
    const raw = sessionStorage.getItem(AD_DRAFT_PREVIEW_KEY);
    return raw ? (JSON.parse(raw) as AdDraftPreview) : null;
  } catch {
    return null;
  }
}

function Caption({ draft, compact }: { draft: AdDraftPreview; compact?: boolean }) {
  return (
    <div className="min-w-0 space-y-1">
      <h4 className={cn('font-semibold leading-snug text-foreground', compact ? 'line-clamp-2 text-sm' : 'text-base')}>
        {draft.title || 'Título do anúncio'}
      </h4>
      {draft.description && (
        <p
          className={cn(
            'whitespace-pre-line leading-5 text-muted-foreground',
            compact ? 'line-clamp-3 text-xs' : 'text-sm',
          )}
        >
          {draft.description}
        </p>
      )}
      {draft.link_url && (
        <span className="inline-flex items-center gap-1 pt-0.5 text-xs font-semibold text-primary">
          <ExternalLink className="h-3 w-3" /> Saiba mais
        </span>
      )}
    </div>
  );
}

/**
 * Renderiza o anúncio em rascunho dentro da própria página do aluno,
 * exatamente na posição em que ele apareceria, antes de publicar.
 */
export function AdDraftPreviewOverlay() {
  const location = useLocation();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<AdDraftPreview | null>(null);

  const active = new URLSearchParams(location.search).get(AD_DRAFT_PREVIEW_PARAM) === '1';

  useEffect(() => {
    setDraft(active ? readDraft() : null);
  }, [active, location.pathname]);

  if (!active || !draft) return null;

  const close = () => {
    sessionStorage.removeItem(AD_DRAFT_PREVIEW_KEY);
    setDraft(null);
    const params = new URLSearchParams(location.search);
    params.delete(AD_DRAFT_PREVIEW_PARAM);
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  };

  const hasImage = Boolean(draft.image_url?.trim());

  const image = (className: string, wrapper?: string) =>
    hasImage ? (
      <AppImage
        src={draft.image_url}
        alt={draft.title || 'Prévia do anúncio'}
        className={cn('rounded-lg bg-muted object-contain', className)}
        wrapperClassName={wrapper}
        fallbackClassName={cn('rounded-lg', className)}
      />
    ) : null;

  const card = (() => {
    switch (draft.ad_type) {
      case 'popup':
        return (
          <div className="fixed inset-0 z-[95] flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Megaphone className="h-3 w-3" /> Publicidade
                </span>
                <button type="button" onClick={close} aria-label="Fechar prévia">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              {image('max-h-[50vh] w-full', 'w-full')}
              <div className={cn(hasImage && 'mt-4')}>
                <Caption draft={draft} />
              </div>
            </div>
          </div>
        );
      case 'footer':
        return (
          <div className="fixed inset-x-3 bottom-20 z-[95] rounded-xl border border-border bg-card p-3 shadow-2xl md:inset-x-auto md:right-5 md:w-[380px]">
            <div className="flex gap-3">
              {image('h-16 w-16 shrink-0', 'h-16 w-16 shrink-0')}
              <Caption draft={draft} compact />
            </div>
          </div>
        );
      case 'banner':
      case 'inline':
        return (
          <div className="fixed inset-x-4 top-20 z-[95] mx-auto max-w-3xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            {image('max-h-64 w-full', 'w-full')}
            <div className="p-4">
              <Caption draft={draft} />
            </div>
          </div>
        );
      default:
        return (
          <div className="fixed bottom-5 right-5 z-[95] w-[270px] rounded-xl border border-border bg-card p-3 shadow-2xl">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Publicidade
            </span>
            {image('max-h-44 w-full', 'w-full')}
            <div className={cn(hasImage && 'mt-2')}>
              <Caption draft={draft} compact />
            </div>
          </div>
        );
    }
  })();

  return createPortal(
    <>
      {card}
      <div className="fixed inset-x-0 top-0 z-[96] flex items-center justify-center gap-3 border-b border-primary/40 bg-primary/10 px-4 py-2 text-xs font-medium text-foreground backdrop-blur">
        <span className="inline-flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-primary" />
          Pré-visualização do anúncio — ainda não publicado
        </span>
        <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={close}>
          Encerrar prévia
        </Button>
      </div>
    </>,
    document.body,
  );
}
