/**
 * SortableMaterialsList — lista de materiais vinculados à apostila com
 * reordenação por arrastar (HTML5 drag & drop nativo, sem dependências).
 * Persiste a nova ordem no Supabase ao soltar.
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  GripVertical, Trash2, FileText, Image as ImageIcon, Video, Music, Presentation,
  File, Link as LinkIcon, FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<string, any> = {
  pdf: FileText, image: ImageIcon, video: Video, audio: Music,
  powerpoint: Presentation, word: FileText, excel: FileSpreadsheet,
  link: LinkIcon, gif: ImageIcon, other: File, exam: FileText,
};

export interface LinkedMaterialItem {
  id: string;          // apostila_materials.id
  sort_order: number;
  material: { id: string; title: string; type: string };
}

interface Props {
  items: LinkedMaterialItem[];
  onReorder: (newItems: LinkedMaterialItem[]) => void;
  onRemove: (linkId: string) => void;
}

export function SortableMaterialsList({ items, onReorder, onRemove }: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const persistOrder = async (next: LinkedMaterialItem[]) => {
    // Atualiza UI primeiro (otimista)
    onReorder(next);
    try {
      // Atualiza sort_order de todos, em paralelo
      await Promise.all(
        next.map((item, idx) =>
          supabase.from('apostila_materials').update({ sort_order: idx }).eq('id', item.id)
        )
      );
    } catch {
      toast.error('Não foi possível salvar a nova ordem');
    }
  };

  const onDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null); setOverIdx(null); return;
    }
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, moved);
    setDragIdx(null); setOverIdx(null);
    persistOrder(next);
  };

  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-6 text-center">
        Nenhum material vinculado ainda. Arraste arquivos acima para começar.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {items.map((item, idx) => {
        const Icon = TYPE_ICONS[item.material.type] || File;
        const isDragging = dragIdx === idx;
        const isOver = overIdx === idx && dragIdx !== idx;
        return (
          <li
            key={item.id}
            draggable
            onDragStart={(e) => { setDragIdx(idx); e.dataTransfer.effectAllowed = 'move'; }}
            onDragOver={(e) => { e.preventDefault(); setOverIdx(idx); }}
            onDrop={(e) => { e.preventDefault(); onDrop(idx); }}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-transparent transition-all',
              isDragging && 'opacity-40',
              isOver && 'border-primary bg-primary/10',
            )}
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab shrink-0" />
            <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs flex-1 truncate">{item.material.title}</span>
            <span className="text-[9px] text-muted-foreground uppercase">{item.material.type}</span>
            <Button
              size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0"
              onClick={() = aria-label="Excluir"> onRemove(item.id)}
              title="Remover"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
