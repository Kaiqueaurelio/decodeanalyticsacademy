/**
 * MaterialsDropZone — área que aceita drag&drop de múltiplos arquivos
 * (e cliques para abrir picker), criando 1 material por arquivo e vinculando
 * automaticamente à apostila atual em uma única ação.
 *
 * Tipos suportados (auto-detectados pelo MIME / extensão):
 *  - PDF, imagem, áudio, vídeo, Word, Excel, PowerPoint, GIF, links (.url)
 *
 * Limites por arquivo: 100MB. Mostra progresso individual.
 */
import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  apostilaId: string;
  /** Maior sort_order já presente — novos vão a partir daqui. */
  baseSortOrder: number;
  onUploaded: () => void;
  className?: string;
}

type FileStatus = 'pending' | 'uploading' | 'done' | 'error';
interface FileProgress {
  name: string;
  status: FileStatus;
  error?: string;
}

const TYPE_FROM_MIME: Array<[RegExp, string]> = [
  [/^application\/pdf$/, 'pdf'],
  [/^image\/gif$/, 'gif'],
  [/^image\//, 'image'],
  [/^audio\//, 'audio'],
  [/^video\//, 'video'],
  [/wordprocessingml|msword/, 'word'],
  [/spreadsheetml|ms-excel/, 'excel'],
  [/presentationml|ms-powerpoint/, 'powerpoint'],
];

function detectType(file: File): string {
  for (const [re, type] of TYPE_FROM_MIME) {
    if (re.test(file.type)) return type;
  }
  // Fallback por extensão
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(ext)) return 'audio';
  if (['mp4', 'webm', 'mov', 'mkv'].includes(ext)) return 'video';
  if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) return 'image';
  if (['gif'].includes(ext)) return 'gif';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
  if (['ppt', 'pptx'].includes(ext)) return 'powerpoint';
  return 'other';
}

export function MaterialsDropZone({ apostilaId, baseSortOrder, onUploaded, className }: Props) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<FileProgress[]>([]);

  const upload = async (files: FileList | File[]) => {
    if (!user) { toast.error('Sessão expirada'); return; }
    const arr = Array.from(files);
    if (arr.length === 0) return;

    setProgress(arr.map((f) => ({ name: f.name, status: 'pending' })));

    let order = baseSortOrder;
    let okCount = 0;

    for (let i = 0; i < arr.length; i++) {
      const file = arr[i];
      setProgress((prev) => prev.map((p, idx) => idx === i ? { ...p, status: 'uploading' } : p));

      try {
        if (file.size > 100 * 1024 * 1024) {
          throw new Error('Acima de 100MB');
        }
        const ext = file.name.split('.').pop() || 'bin';
        const type = detectType(file);
        const path = `${type}s/${apostilaId}/${Date.now()}-${i}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('materials').upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;

        const title = file.name.replace(/\.[^.]+$/, '');
        const { data: mat, error: insErr } = await supabase.from('materials').insert({
          title, type: type as any, file_path: path, created_by: user.id,
        } as any).select().single();
        if (insErr) throw insErr;

        const { error: linkErr } = await supabase.from('apostila_materials').insert({
          apostila_id: apostilaId, material_id: (mat as any).id, sort_order: order++,
        });
        if (linkErr) throw linkErr;

        okCount++;
        setProgress((prev) => prev.map((p, idx) => idx === i ? { ...p, status: 'done' } : p));
      } catch (err: any) {
        setProgress((prev) => prev.map((p, idx) => idx === i ? { ...p, status: 'error', error: err?.message || 'Erro' } : p));
      }
    }

    if (okCount > 0) {
      toast.success(`${okCount} material(is) vinculado(s) à apostila!`);
      onUploaded();
    }
    // Limpa progresso após 3s
    setTimeout(() => setProgress([]), 3000);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'w-full flex flex-col items-center justify-center gap-1.5 p-4 rounded-lg border-2 border-dashed transition-all',
          dragOver
            ? 'border-primary bg-primary/10 scale-[1.01]'
            : 'border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10',
        )}
      >
        <Upload className="h-5 w-5 text-primary" />
        <p className="text-xs font-semibold text-foreground">Arraste arquivos aqui ou clique</p>
        <p className="text-[10px] text-muted-foreground text-center">
          PDF, áudio, vídeo, Word, Excel, imagens — vincula automaticamente
        </p>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) upload(e.target.files); e.target.value = ''; }}
      />

      {progress.length > 0 && (
        <ul className="mt-2 space-y-1">
          {progress.map((p, i) => (
            <li key={i} className="flex items-center gap-2 text-[11px] px-2 py-1 rounded bg-muted/40">
              {p.status === 'uploading' && <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />}
              {p.status === 'done' && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
              {p.status === 'error' && <AlertCircle className="h-3 w-3 text-destructive shrink-0" />}
              {p.status === 'pending' && <span className="h-3 w-3 rounded-full bg-muted-foreground/40 shrink-0" />}
              <span className="flex-1 truncate">{p.name}</span>
              {p.error && <span className="text-destructive">{p.error}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
