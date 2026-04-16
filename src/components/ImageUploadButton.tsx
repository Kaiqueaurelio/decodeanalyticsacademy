import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Image, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onImageInserted: (markdownImg: string) => void;
}

export function ImageUploadButton({ onImageInserted }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop() || 'png';
    const path = `apostila-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from('materials').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      toast.error('Erro no upload: ' + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    onImageInserted(`\n![${file.name}](${publicUrl})\n`);
    toast.success('Imagem inserida!');
    setUploading(false);
  };

  return (
    <>
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
        className="text-xs gap-1.5"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Image className="h-3.5 w-3.5" />}
        Inserir Imagem
      </Button>
    </>
  );
}
