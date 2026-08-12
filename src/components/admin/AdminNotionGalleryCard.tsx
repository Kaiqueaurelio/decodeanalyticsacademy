import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  Edit, 
  Trash2, 
  Plus,
  Loader2,
  FolderOpen
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getSubjectColor } from '@/lib/subject-colors';
import { getApostilaCover } from '@/lib/apostila-covers';

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
  const coverUrl = useMemo(() => getApostilaCover(item.category, item.id), [item.category, item.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      <div 
        className={cn(
          "relative flex items-center rounded-xl overflow-hidden border transition-all duration-300 bg-[#121214] shadow-sm h-32",
          selected ? "ring-2 ring-primary border-primary" : "border-white/5 hover:border-white/10 hover:shadow-md",
          isPlaceholder && "opacity-80 grayscale-[0.2]"
        )}
      >
        {/* Notion Gallery Image (Capa) - Agora Lateral Esquerda */}
        <div className="relative h-full w-24 sm:w-32 overflow-hidden bg-[#1A1B1E] shrink-0 border-r border-white/5">
          <img 
            src={coverUrl} 
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-110"
          />
          <div 
            className="absolute inset-0 opacity-20"
            style={{ 
              background: `linear-gradient(135deg, ${color}44 0%, transparent 100%)`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <FolderOpen className={cn("h-8 w-8 relative z-10 transition-transform duration-500 group-hover:scale-110", isPlaceholder ? "text-muted-foreground/20" : "text-[#EAB308]/90")} />
          </div>
          
          {/* Checkbox de Seleção */}
          <div className="absolute top-3 left-3 z-10">
            <Checkbox 
              checked={selected} 
              onCheckedChange={() => onSelect(item.id)}
              className="h-4 w-4 bg-background/80 backdrop-blur-sm border-white/20 data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        {/* Notion Card Content - Agora Direita */}
        <div className="flex-1 p-4 space-y-1.5 flex flex-col justify-center min-w-0 pr-10 relative">
          <div className="flex items-center justify-between gap-2 min-h-[24px]">
            <h3 className="text-[13px] font-bold leading-tight line-clamp-1 group-hover:text-primary transition-colors flex items-center gap-2">
              <span className="text-muted-foreground/40 shrink-0">#</span>
              {item.title.replace(/^\[GRADE\]\s*/i, '').replace(/_/g, ' ')}
            </h3>
            <div className="flex items-center gap-1">
               <Badge className="bg-[#27272A]/80 text-foreground border border-white/10 text-[8px] font-bold px-1.5 py-0 rounded-md shrink-0">
                  1 APOSTILA
               </Badge>
               <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            </div>
          </div>

          {/* Metadata/Properties Grid estilo Notion */}
          <div className="flex flex-col gap-1 py-1 border-t border-white/5">
            <div className="flex items-center justify-start gap-2 text-[10px]">
              <div className="h-4 w-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
              </div>
              <span className="font-bold text-emerald-500">
                {item.published ? '1 publicada' : '0 publicadas'}
              </span>
            </div>
            <div className="flex items-center justify-start gap-2 text-[10px]">
              <div className="h-4 w-4 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <FileText className="h-2.5 w-2.5 text-muted-foreground/60" />
              </div>
              <span className="font-bold text-muted-foreground/60">0 exercícios</span>
            </div>
          </div>


          {!isPlaceholder ? (
            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/5">
              <Select 
                value={item.status || (item.published ? 'liberada' : 'bloqueada')} 
                onValueChange={(v) => onStatusChange(item, v as any)}
                disabled={busyId === item.id}
              >
                <SelectTrigger className="h-6 w-32 bg-white/5 border-white/5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="liberada" className="text-[10px] font-bold text-emerald-500">LIBERADA</SelectItem>
                  <SelectItem value="bloqueada" className="text-[10px] font-bold text-destructive">BLOQUEADA</SelectItem>
                  <SelectItem value="em_manutencao" className="text-[10px] font-bold text-amber-500">MANUTENÇÃO</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="h-6 text-[9px] border-white/5 bg-white/5 text-muted-foreground px-2 font-bold">
                {item.semester ? `${item.semester}º SEM` : 'UNIP'}
              </Badge>
            </div>
          ) : (
            <Button 
              className="w-full h-8 rounded-lg text-[10px] font-black gap-2 gradient-primary text-primary-foreground mt-1"
              onClick={() => onEdit(item)}
              disabled={busyId === item.id}
            >
              {busyId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              INICIAR
            </Button>
          )}

          {/* Ações Rápidas Flutuantes */}
          <div className="absolute top-1/2 -translate-y-1/2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-white/10 active:scale-95 touch-manipulation" onClick={() => onEdit(item)}>
              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            {!isPlaceholder && (
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-destructive/20 hover:text-destructive" onClick={() => onDelete(item)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
