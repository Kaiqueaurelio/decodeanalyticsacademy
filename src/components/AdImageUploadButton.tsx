import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppImage } from '@/components/ui/app-image';
import { Image, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/invoke-function';
import { toPromoMediaUrl } from '@/lib/promo-media';

interface Props {
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string | null;
}

export function AdImageUploadButton({ onImageUploaded, currentImageUrl }: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(toPromoMediaUrl(currentImageUrl));
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);
    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext || 'png'}`;

    try {
      const base64Data = await fileToBase64(file);
      const { data, error } = await invokeFunction<{ publicUrl: string }>('promo-media', {
        body: { fileName, contentType: file.type || 'image/png', base64Data },
        errorTitle: 'Erro ao enviar imagem',
        showToast: false,
      });

      if (error) throw new Error(error.message || 'Falha ao enviar a imagem');
      const publicUrl = data?.publicUrl;
      if (!publicUrl) {
        toast.error('A imagem foi enviada, mas a URL não foi retornada');
        return;
      }

      setPreviewUrl(publicUrl);
      onImageUploaded(publicUrl);
      toast.success('Imagem enviada com sucesso!');
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

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Image className="h-4 w-4" />
              Enviar Imagem
            </>
          )}
        </Button>
        {previewUrl && (
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

      {previewUrl && (
        <div className="relative w-full max-w-xs border rounded-lg overflow-hidden bg-gray-50">
          <AppImage
            src={previewUrl}
            alt="Preview da imagem do anúncio"
            className="w-full h-auto object-cover max-h-48"
            wrapperClassName="w-full min-h-32"
            fallbackLabel="Preview indisponível"
          />
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            Imagem selecionada
          </div>
        </div>
      )}
    </div>
  );
}
