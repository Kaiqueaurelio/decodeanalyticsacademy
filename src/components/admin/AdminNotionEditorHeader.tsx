import React from 'react';
import { 
  Save, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  ShieldCheck,
  MoreVertical,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ApostilaHealthBarProps {
  title: string;
  published: boolean;
  saving: boolean;
  lastSavedAt: Date | null;
  onSave: () => void;
  onTogglePublish: () => void;
  onPreview: () => void;
  wordCount: number;
  exerciseCount: number;
  materialCount: number;
}

export function ApostilaHealthBar({
  published,
  saving,
  lastSavedAt,
  onSave,
  onTogglePublish,
  onPreview,
  wordCount,
  exerciseCount,
  materialCount
}: ApostilaHealthBarProps) {
  const timeStr = lastSavedAt ? lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-2 sm:px-4 sticky top-0 z-50">
      {/* Notion Breadcrumbs Style */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden h-8 w-8 text-muted-foreground mr-1"
          onClick={() => (window as any).toggleAdminSidebar?.()}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
          <span className="hidden sm:inline hover:bg-accent px-1.5 py-0.5 rounded cursor-pointer transition-colors">Admin</span>
          <span className="hidden sm:inline text-muted-foreground/30">/</span>
          <span className="hover:bg-accent px-1.5 py-0.5 rounded cursor-pointer transition-colors font-bold">Edição</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Status Indicators */}
        <div className="hidden md:flex items-center gap-4 px-4 border-r border-border/50 h-8 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
           <div className="flex items-center gap-1.5">
             <FileText className="h-3 w-3" />
             <span>{wordCount} palavras</span>
           </div>
           <div className="flex items-center gap-1.5">
             <CheckCircle2 className="h-3 w-3" />
             <span>{exerciseCount} exercícios</span>
           </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-muted-foreground">
            {saving ? (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 animate-spin" /> Salvando...
              </span>
            ) : timeStr ? (
              <span className="flex items-center gap-1.5 opacity-60">
                <Check className="h-3 w-3 text-emerald-500" /> Salvo às {timeStr}
              </span>
            ) : null}
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onPreview}
            className="h-8 text-xs gap-2 rounded-lg hover:bg-accent"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onSave}
            className="h-8 text-xs gap-2 rounded-lg hover:bg-accent"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Salvar</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={published ? "default" : "secondary"}
                size="sm"
                className={cn(
                  "h-8 text-[11px] font-black uppercase tracking-wider gap-2 px-4 rounded-lg shadow-sm transition-all",
                  published 
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20" 
                    : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                )}
              >
                {published ? <ShieldCheck className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {published ? 'Publicado' : 'Rascunho'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onTogglePublish} className="text-xs font-bold gap-2">
                {published ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" /> Despublicar apostila
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" /> Publicar agora
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

const EyeOff = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
);
