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
  Lock
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
  
  const statusLabel = item.status === 'liberada' ? 'Em progresso' : 
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
        {/* Gallery Image (Capa) */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          <div 
            className="absolute inset-0 opacity-20"
            style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 100%)` }}
          />
          
          {/* Tag de Semestre (Foto 1) */}
          <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
             <Badge className="bg-[#4A2D1F] text-[#D4A373] border-none hover:bg-[#4A2D1F] text-[10px] font-bold px-2 py-0.5 rounded-md w-fit">
                {item.semester ? `${item.semester}º Semestre` : 'Livre'}
             </Badge>
             
             {/* Status Acadêmico (Foto 1) */}
             <div className="flex items-center gap-1.5 bg-[#2A3E5A] text-[#70A5E8] px-2 py-0.5 rounded-full w-fit">
                <span className="h-1.5 w-1.5 rounded-full bg-[#70A5E8]" />
                <span className="text-[10px] font-bold">{statusLabel}</span>
             </div>
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

        {/* Content */}
        <div className="p-3.5 space-y-3">
          <div className="flex items-start gap-2 min-h-[40px]">
            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground/60 shrink-0" />
            <h3 className="text-[13px] font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {item.title.replace(/^\[GRADE\]\s*/i, '')}
            </h3>
          </div>

          {/* Progresso/Qtd (Propriedades Notion) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground/60">
              <span className="uppercase tracking-widest">Materiais</span>
              <span>{isPlaceholder ? '0%' : '35%'}</span>
            </div>
            <Progress value={isPlaceholder ? 0 : 35} className="h-1" />
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
