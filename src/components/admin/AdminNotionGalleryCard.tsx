import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle2, 
  Circle, 
  Clock, 
  ChevronRight, 
  Edit, 
  Trash2, 
  Plus,
  Loader2,
  Lock,
  FolderOpen
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getSubjectColor } from '@/lib/subject-colors';

interface AdminNotionGalleryCardProps {
  item: any;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onStatusChange: (item: any, status: any) => void;
  busyId: string | null;
}

export function AdminNotionGalleryCard({
  item,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  busyId
}: AdminNotionGalleryCardProps) {
  const isPlaceholder = item.isPlaceholder || item.id.startsWith('placeholder');
  const color = getSubjectColor(item.category || 'Geral');
  
  const statusLabel = item.status === 'liberada' ? 'Publicada' : 
                     item.status === 'em_manutencao' ? 'Manutenção' : 'Bloqueada';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      <div 
        className={cn(
          "relative flex flex-col rounded-xl overflow-hidden border transition-all duration-300 bg-card shadow-sm",
          selected ? "ring-2 ring-primary border-primary" : "border-border/60 hover:border-primary/40 hover:shadow-md",
          isPlaceholder && "opacity-80 grayscale-[0.2]"
        )}
      >
        {/* Notion Gallery Image (Capa) */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#1A1A1A] flex items-center justify-center">
          <div 
            className="absolute inset-0 opacity-20"
            style={{ 
              background: `linear-gradient(135deg, ${color}22 0%, ${color}44 100%)`,
            }}
          />
          <FolderOpen className={cn("h-10 w-10 relative z-10 transition-transform duration-500 group-hover:scale-110", isPlaceholder ? "text-muted-foreground/20" : "text-[#D4D4D8]/80")} />
          
          {/* Tags estilo Notion no topo da imagem */}
          <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5 pointer-events-none">
             <Badge className="bg-[#27272A]/80 backdrop-blur-md text-foreground border border-white/10 text-[9px] font-bold px-1.5 py-0 rounded-md w-fit shadow-sm">
                1 APOSTILA
             </Badge>
          </div>


          {/* Checkbox de Seleção */}
          <div className="absolute top-3 left-3 z-10">
            <Checkbox 
              checked={selected} 
              onCheckedChange={() => onSelect(item.id)}
              className="h-4 w-4 bg-background/80 backdrop-blur-sm border-white/20 data-[state=checked]:bg-primary"
            />
          </div>

          {/* Ações Rápidas */}
          <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg bg-background/80 backdrop-blur-sm" onClick={() => onEdit(item)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            {!isPlaceholder && (
              <Button size="icon" variant="destructive" className="h-7 w-7 rounded-lg" onClick={() => onDelete(item)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Notion Card Content */}
        <div className="p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2 min-h-[24px]">
            <h3 className="text-[13px] font-bold leading-tight line-clamp-1 group-hover:text-primary transition-colors">
              {item.title.replace(/^\[GRADE\]\s*/i, '').replace(/_/g, ' ')}
            </h3>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          </div>

          {/* Metadata/Properties Grid estilo Notion */}
          <div className="grid grid-cols-1 gap-y-1.5 py-1 border-t border-border/40">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground/60">Status</span>
              <span className={cn(
                "text-[10px] font-bold",
                item.published ? "text-emerald-500" : "text-amber-500"
              )}>
                {item.published ? '1 publicada' : '0 publicadas'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground/60">Exercícios</span>
              <span className="text-[10px] font-bold">0 exercícios</span>
            </div>
          </div>


          {!isPlaceholder ? (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
              <Select 
                value={item.status || (item.published ? 'liberada' : 'bloqueada')} 
                onValueChange={(v) => onStatusChange(item, v as any)}
                disabled={busyId === item.id}
              >
                <SelectTrigger className="h-7 w-full bg-accent/5 border-border/40 rounded-lg text-[9px] font-black uppercase tracking-wider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="liberada" className="text-[10px] font-bold text-emerald-500">LIBERADA</SelectItem>
                  <SelectItem value="bloqueada" className="text-[10px] font-bold text-destructive">BLOQUEADA</SelectItem>
                  <SelectItem value="em_manutencao" className="text-[10px] font-bold text-amber-500">MANUTENÇÃO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Button 
              className="w-full h-9 rounded-xl text-[11px] font-black gap-2 gradient-primary text-primary-foreground shadow-lg shadow-primary/10"
              onClick={() => onEdit(item)}
              disabled={busyId === item.id}
            >
              {busyId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              INICIAR AGORA
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
