import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppImage } from '@/components/ui/app-image';
import { Image, Loader2, X, Video, Mic } from 'lucide-react';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/invoke-function';
import { toPromoMediaUrl } from '@/lib/promo-media';

interface Props {
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string | null;
  accept?: string;
  label?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'all';
  maxSizeMb?: number;
  showPreview?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const ACCEPT_BY_TYPE = {
  image: 'image/*',
  video: 'video/*',
  audio: 'audio/*',
  all: 'image/*,video/*,audio/*',
};

const LABEL_BY_TYPE = {
  image: 'Enviar Imagem',
  video: 'Enviar Video',
  audio: 'Enviar Audio',
  all: 'Enviar Midia',
};

const IconByType = {
  image: Image,
  video: Video,
  audio: Mic,
  all: Image,
};

function getKind(fileOrUrl: File | string): 'image' | 'video' | 'audio' | 'file' {
  const value = typeof fileOrUrl === 'string' ? fileOrUrl.toLowerCase() : fileOrUrl.type.toLowerCase();
  if (value.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)(\?|#|$)/.test(value)) return 'image';
  if (value.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi|mkv)(\?|#|$)/.test(value)) return 'video';
  if (value.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|aac|webm)(\?|#|$)/.test(value)) return 'audio';
  return 'file';
}

export function AdImageUploadButton({
  onImageUploaded,
  currentImageUrl,
  accept,
  label,
  mediaType = 'image',
  maxSizeMb = mediaType === 'image' ? 5 : 50,
  showPreview = true,
  variant = 'outline',
  size = 'sm',
  className,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(toPromoMediaUrl(currentImageUrl));
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = IconByType[mediaType];

  useEffect(() => {
    setPreviewUrl(toPromoMediaUrl(currentImageUrl));
  }, [currentImageUrl]);

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = () => reject(reader.error || new Error('Falha ao ler arquivo'));
      reader.readAsDataURL(file);
    });

  const handleUpload = async (file: File) => {
    const kind = getKind(file);
    if (mediaType !== 'all' && kind !== mediaType) {
      toast.error(`Selecione um arquivo de ${mediaType === 'image' ? 'imagem' : mediaType === 'video' ? 'video' : 'audio'}`);
      return;
    }
    if (kind === 'file') {
      toast.error('Selecione uma imagem, video ou audio valido');
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`O arquivo deve ter no maximo ${maxSizeMb}MB`);
      return;
    }

    setUploading(true);
    const ext = (file.name.split('.').pop() || kind).toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext || kind}`;

    try {
      const base64Data = await fileToBase64(file);
      const { data, error } = await invokeFunction<{ publicUrl: string }>('promo-media', {
        body: { fileName, contentType: file.type || `${kind}/${ext || kind}`, base64Data },
        errorTitle: 'Erro ao enviar midia',
        showToast: false,
      });

      if (error) throw new Error(error.message || 'Falha ao enviar a midia');
      const publicUrl = data?.publicUrl;
      if (!publicUrl) {
        toast.error('A midia foi enviada, mas a URL nao foi retornada');
        return;
      }

      setPreviewUrl(publicUrl);
      onImageUploaded(publicUrl);
      toast.success(`${kind === 'image' ? 'Imagem' : kind === 'video' ? 'Video' : 'Audio'} enviado com sucesso!`);
    } catch (e: any) {
      toast.error('Erro ao fazer upload: ' + (e?.message || 'desconhecido'));
    } finally {
      setUploading(false);
    }
  };

  const handleClearImage = () => {
    setPreviewUrl(null);
    onImageUploaded('');
  };

  const previewKind = previewUrl ? getKind(previewUrl) : null;

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <input
          ref={inputRef}
          type="file"
          accept={accept || ACCEPT_BY_TYPE[mediaType]}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          variant={variant}
          size={size}
          className={className || 'gap-1.5'}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {size === 'icon' ? null : 'Enviando...'}
            </>
          ) : (
            <>
              <Icon className="h-4 w-4" />
              {size === 'icon' ? null : label || LABEL_BY_TYPE[mediaType]}
            </>
          )}
        </Button>
        {previewUrl && showPreview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleClearImage}
          >
            <X className="h-4 w-4" />
            Remover
          </Button>
        )}
      </div>

      {previewUrl && showPreview && (
        <div className="relative w-full max-w-xs border rounded-lg overflow-hidden bg-gray-50">
          {previewKind === 'video' ? (
            <video src={previewUrl} controls className="w-full max-h-48 bg-black" />
          ) : previewKind === 'audio' ? (
            <div className="p-3 bg-card">
              <audio src={previewUrl} controls className="w-full" />
            </div>
          ) : (
            <AppImage
              src={previewUrl}
              alt="Preview da midia do anuncio"
              className="w-full h-auto object-cover max-h-48"
              wrapperClassName="w-full min-h-32"
              fallbackLabel="Preview indisponivel"
            />
          )}
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            Midia selecionada
          </div>
        </div>
      )}
    </div>
  );
}
