/**
 * RibbonImageButton — botão de upload de imagem com visual nativo do
 * ribbon Word (classe .word-btn-tall).
 *
 * Melhorias:
 *  - Preview otimista: insere a imagem imediatamente usando blob URL,
 *    depois troca pela URL pública assim que o upload termina (sem
 *    "tela travada" enquanto o Storage processa).
 *  - Comprime imagens > 1.5MB no navegador (canvas) para subida rápida.
 *  - Toast de progresso + estado "enviando" no botão.
 */
import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onImageInserted: (markdownImg: string, opts?: { tempUrl?: string; finalUrl?: string }) => void;
  label?: string;
}

const COMPRESS_THRESHOLD = 1.5 * 1024 * 1024; // 1.5 MB
const MAX_DIMENSION = 1600; // largura ou altura máxima após compressão

async function compressIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size < COMPRESS_THRESHOLD || file.type === 'image/gif') {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * ratio);
    const h = Math.round(bitmap.height * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85),
    );
    if (!blob) return file;
    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export function RibbonImageButton({ onImageInserted, label = 'Imagem' }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadOne = async (rawFile: File, index?: number, total?: number) => {
    const tempUrl = URL.createObjectURL(rawFile);
    onImageInserted(`\n![${rawFile.name}](${tempUrl})\n`, { tempUrl });

    const label = total && total > 1 ? ` (${index! + 1}/${total})` : '';
    const tId = toast.loading(`Enviando imagem${label}…`);

    try {
      const file = await compressIfNeeded(rawFile);
      const ext = file.name.split('.').pop() || 'png';
      const path = `apostila-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from('materials').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path);
      onImageInserted('', { tempUrl, finalUrl: urlData.publicUrl });
      toast.success(`Imagem enviada${label}`, { id: tId });
      return true;
    } catch (err: any) {
      toast.error('Falha no upload: ' + (err?.message || 'erro desconhecido'), { id: tId });
      return false;
    }
  };

  const handleUploadMany = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) {
      toast.error('Selecione um ou mais arquivos de imagem');
      return;
    }
    setUploading(true);
    try {
      // Sobe em paralelo (limite de 3 simultâneos para não saturar)
      const CONCURRENCY = 3;
      let i = 0;
      const total = images.length;
      const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, async () => {
        while (i < total) {
          const idx = i++;
          await uploadOne(images[idx], idx, total);
        }
      });
      await Promise.all(workers);
      if (total > 1) toast.success(`${total} imagens inseridas`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) handleUploadMany(files);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        className="word-btn word-btn-tall"
        title="Inserir uma ou várias imagens (segure Ctrl/Cmd para múltipla seleção)"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="animate-spin" /> : <ImageIcon />}
        <span>{uploading ? 'Enviando…' : label}</span>
      </button>
    </>
  );
}
