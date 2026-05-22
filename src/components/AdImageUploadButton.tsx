import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Image, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string | null;
}

export function AdImageUploadButton({ onImageUploaded, currentImageUrl }: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `ads/${fileName}`;

    try {
      console.log('Iniciando upload para o bucket ads');
      console.log('Bucket: ads');
      console.log('Caminho do arquivo:', path);
      console.log('Tipo do arquivo:', file.type);
      console.log('Tamanho do arquivo:', file.size);
      
      const { error, data } = await supabase.storage
        .from('ads')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        console.error('Erro no upload de imagem do anúncio:', error);
        console.error('Detalhes do erro:', {
          message: error.message,
          status: (error as any).status,
          statusCode: (error as any).statusCode,
        });
        toast.error('Erro no upload: ' + error.message);
        setUploading(false);
        return;
      }

      console.log('Upload realizado com sucesso:', data);
      
      const { data: urlData } = supabase.storage.from('ads').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      console.log('URL pública gerada:', publicUrl);
      
      setPreviewUrl(publicUrl);
      onImageUploaded(publicUrl);
      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      console.error('Stack trace:', error?.stack);
      
      if (error?.message?.includes('fetch')) {
        toast.error('Erro de conexão ao fazer upload. Verifique sua internet e tente novamente.');
      } else if (error?.message?.includes('401') || error?.message?.includes('403')) {
        toast.error('Erro de permissão ao fazer upload. Verifique as configurações do bucket.');
      } else {
        toast.error('Erro ao fazer upload da imagem: ' + (error?.message || 'Desconhecido'));
      }
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
          onChange={e => {
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
          <img
            src={previewUrl}
            alt="Preview da imagem do anúncio"
            className="w-full h-auto object-cover max-h-48"
          />
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            Imagem selecionada
          </div>
        </div>
      )}
    </div>
  );
}
