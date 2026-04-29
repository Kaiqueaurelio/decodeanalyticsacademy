/**
 * RibbonImageButton — botão de upload de imagem com visual nativo do
 * ribbon Word (classe .word-btn-tall). Reaproveita a lógica de upload
 * do Supabase Storage.
 */
import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onImageInserted: (markdownImg: string) => void;
  label?: string;
}

export function RibbonImageButton({ onImageInserted, label = 'Imagem' }: Props) {
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
    onImageInserted(`\n![${file.name}](${urlData.publicUrl})\n`);
    toast.success('Imagem inserida');
    setUploading(false);
  };

  return (
    <>
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
      <button
        type="button"
        className="word-btn word-btn-tall"
        title="Inserir imagem do computador"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="animate-spin" /> : <ImageIcon />}
        <span>{uploading ? 'Enviando…' : label}</span>
      </button>
    </>
  );
}
