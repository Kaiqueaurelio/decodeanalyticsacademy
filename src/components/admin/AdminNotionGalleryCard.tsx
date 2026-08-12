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
        {/* Notion Gallery Image (Capa) */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#1A1A1A]">
          <div 
            className="absolute inset-0 opacity-40 transition-transform duration-500 group-hover:scale-105"
            style={{ 
              background: `linear-gradient(135deg, ${color}22 0%, ${color}44 100%)`,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${color.replace('#', '%23')}' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4v-4H4v4H0v2h4v4h2v-4h4v-2H6zm30 0v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
          
          {/* Tags estilo Notion no topo da imagem */}
          <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5 pointer-events-none">
             <Badge className="bg-background/80 backdrop-blur-md text-foreground border border-border/50 text-[9px] font-bold px-1.5 py-0 rounded-md w-fit shadow-sm">
                {item.semester ? `${item.semester}º Sem.` : 'Livre'}
             </Badge>
             
             <div className={cn(
               "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold shadow-sm backdrop-blur-md",
               item.status === 'liberada' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
               item.status === 'em_manutencao' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
               "bg-destructive/10 text-destructive border border-destructive/20"
             )}>
                <span className={cn("h-1 w-1 rounded-full animate-pulse", 
                  item.status === 'liberada' ? "bg-emerald-500" :
                  item.status === 'em_manutencao' ? "bg-amber-500" :
                  "bg-destructive"
                )} />
                <span>{statusLabel.toUpperCase()}</span>
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

        {/* Notion Card Content */}
        <div className="p-3 space-y-2.5">
          <div className="flex items-start gap-2 min-h-[36px]">
            <FolderOpen className={cn("h-4 w-4 mt-0.5 shrink-0", isPlaceholder ? "text-muted-foreground/40" : "text-primary/70")} />
            <h3 className="text-[12px] font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {item.title.replace(/^\[GRADE\]\s*/i, '')}
            </h3>
          </div>

          {/* Metadata/Properties Grid estilo Notion */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 py-1 border-t border-border/40">
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/50">Tipo</span>
              <span className="text-[9px] font-medium truncate">{item.category || 'Geral'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/50">Progresso</span>
              <div className="flex items-center gap-1.5">
                <Progress value={isPlaceholder ? 0 : 35} className="h-1 flex-1" />
                <span className="text-[8px] font-bold">{isPlaceholder ? '0%' : '35%'}</span>
              </div>
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
