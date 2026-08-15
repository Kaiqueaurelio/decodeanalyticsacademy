/**
 * RibbonMediaButton — botão unificado para upload de mídia (Áudio, Vídeo, Documentos)
 * com visual nativo do ribbon Word.
 */
import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Music, Video, FileText, Loader2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  onMediaInserted: (markdown: string) => void;
  apostilaId: string;
}

export function RibbonMediaButton({ onMediaInserted, apostilaId }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [acceptType, setAcceptType] = useState<string>('*/*');

  const handleUpload = async (file: File) => {
    setUploading(true);
    const tId = toast.loading(`Enviando ${file.name}...`);

    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `apostila-media/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from('materials').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path);
      const url = urlData.publicUrl;

      let markdown = '';
      if (file.type.startsWith('audio/')) {
        markdown = `\n[Áudio: ${url}]\n`;
      } else if (file.type.startsWith('video/')) {
        markdown = `\n[Vídeo: ${url}]\n`;
      } else {
        markdown = `\n[Arquivo: ${file.name}](${url})\n`;
      }

      onMediaInserted(markdown);
      toast.success('Mídia enviada e inserida!', { id: tId });
    } catch (err: any) {
      console.error('Erro no upload de mídia:', err);
      toast.error('Falha no upload: ' + (err?.message || 'erro desconhecido'), { id: tId });
    } finally {
      setUploading(false);
    }
  };

  const openPicker = (type: 'audio' | 'video' | 'file') => {
    if (type === 'audio') setAcceptType('audio/*');
    else if (type === 'video') setAcceptType('video/*');
    else setAcceptType('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt');
    
    setTimeout(() => inputRef.current?.click(), 0);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={acceptType}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = '';
        }}
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="word-btn word-btn-tall"
            title="Inserir Áudio, Vídeo ou Documentos"
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <MoreHorizontal className="h-5 w-5" />
            )}
            <span>{uploading ? 'Enviando…' : 'Mídia ▾'}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-popover z-50">
          <DropdownMenuItem onClick={() => openPicker('audio')} className="gap-2">
            <Music className="h-4 w-4" /> Áudio (MP3/M4A)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openPicker('video')} className="gap-2">
            <Video className="h-4 w-4" /> Vídeo (MP4)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openPicker('file')} className="gap-2">
            <FileText className="h-4 w-4" /> Documento (PDF/Word)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
