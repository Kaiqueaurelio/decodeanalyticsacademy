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
  Check,
  Menu,
  ClipboardPaste,
  ListChecks
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
  onOpenPanel: () => void;
  wordCount: number;
  exerciseCount: number;
  materialCount: number;
  onPasteOpen: () => void;
}

export function ApostilaHealthBar({
  title,
  published,
  saving,
  lastSavedAt,
  onSave,
  onTogglePublish,
  onPreview,
  onOpenPanel,
  wordCount,
  exerciseCount,
  materialCount,
  onPasteOpen
}: ApostilaHealthBarProps) {
  return (
    <div className="flex flex-col border-b border-border/60 bg-muted/30 backdrop-blur-sm sticky top-0 z-50">
      {/* Top Bar: Notion Style Breadcrumbs & Main Actions */}
      <div className="h-14 flex items-center justify-between px-2 sm:px-4 border-b border-border/40 bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-1 sm:gap-2 overflow-hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden h-8 w-8 text-muted-foreground mr-1"
            onClick={() => {
              if (typeof (window as any).toggleAdminSidebar === 'function') {
                (window as any).toggleAdminSidebar();
              }
            }}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
            <span className="hidden sm:inline hover:bg-accent px-1.5 py-0.5 rounded cursor-pointer transition-colors">Admin</span>
            <span className="hidden sm:inline text-muted-foreground/30">/</span>
            <span className="hover:bg-accent px-1.5 py-0.5 rounded cursor-pointer transition-colors font-bold max-w-[150px] truncate">{title || 'Edição'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saving && <span className="text-[10px] text-muted-foreground animate-pulse mr-2 hidden sm:inline">Salvando…</span>}
          {!saving && lastSavedAt && (
            <span className="text-[10px] text-muted-foreground mr-2 hidden sm:inline">
              Salvo às {lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onPreview}
            className="h-8 text-xs gap-2 rounded-lg hover:bg-accent"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={published ? "default" : "secondary"}
                size="sm"
                className={cn(
                  "h-8 text-[10px] font-black uppercase tracking-wider gap-1.5 px-3 rounded-md shadow-sm transition-all",
                  published 
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20" 
                    : "bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20"
                )}
              >
                {published ? <ShieldCheck className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {published ? 'Publicada' : 'Rascunho'}
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

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={onOpenPanel}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Health Bar / Metrics: Exactly like image-93.png */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-muted/20 border-b border-border/40">
        <div className="flex items-center gap-1.5 mr-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-[11px] font-bold uppercase tracking-tight">Pendências detectadas</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
            <FileText className="h-3 w-3" />
            1 seções
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
            <FileText className="h-3 w-3" />
            {wordCount} palavras
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
            <ListChecks className="h-3 w-3" />
            {exerciseCount} exercícios
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
            <Paperclip className="h-3 w-3" />
            {materialCount} materiais
          </div>
        </div>

        <div className="ml-auto">
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={onSave}
            className="h-7 text-[10px] font-bold uppercase tracking-widest gap-2 rounded-md bg-foreground/5 hover:bg-foreground/10 border border-border/50"
          >
            <Save className="h-3.5 w-3.5" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Secondary Admin Toolbar (Image 93 bottom row) */}
      <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto scrollbar-none whitespace-nowrap bg-background/95 backdrop-blur-sm">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5 text-[11px] font-bold border border-border/50 bg-background/80">
          <Menu className="h-3.5 w-3.5" />
          <span className="truncate max-w-[100px]">{title || 'Construa seu...'}</span>
        </Button>
        
        <div className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded border border-border/50 bg-background/80 text-[10px] font-black">
          1.
        </div>

        <div className="flex items-center gap-1 ml-1">
          {['CC', 'SI', 'EC'].map(c => (
            <Badge key={c} variant="outline" className="text-[9px] font-black h-5 px-1.5 border-border/50 bg-background/80">{c}</Badge>
          ))}
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary/70">
          <ImageIcon className="h-4 w-4" />
        </Button>

        <div className="h-6 w-10 rounded-sm border border-border/50 bg-[#1e1e2e] mr-2" />

        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1.5 px-3 text-[10px] font-black uppercase border-primary/30 text-primary hover:bg-primary/5 bg-background/50"
          onClick={() => {}}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Regerar capa
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1.5 px-3 text-[10px] font-black uppercase border-primary/30 text-primary hover:bg-primary/5 bg-background/50"
        >
          <FileText className="h-3.5 w-3.5" />
          Estruturar em lições
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1.5 px-3 text-[10px] font-black uppercase border-primary/30 text-primary hover:bg-primary/5 bg-background/50"
        >
          <Wand2 className="h-3.5 w-3.5 text-primary" />
          Questões ENEM
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-1.5 px-3 text-[10px] font-black uppercase text-muted-foreground hover:bg-accent"
        >
          <Clock className="h-3.5 w-3.5" />
          Histórico
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onPasteOpen}
          className="h-8 gap-1.5 px-3 text-[10px] font-black uppercase text-primary hover:bg-primary/5"
        >
          <ClipboardPaste className="h-3.5 w-3.5" />
          Colar Inteligente
        </Button>
      </div>
    </div>
  );
}

const EyeOff = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
);

const Paperclip = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
);

const Wand2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-1.7a2.18 2.18 0 0 0 1.2-1.2L21.3 0l1.7 3.4a2.18 2.18 0 0 0 1.2 1.2L27.6 6l-3.4 1.7a2.18 2.18 0 0 0-1.2 1.2L21.3 12l-1.7-3.4a2.18 2.18 0 0 0-1.2-1.2Z"/><path d="M22 22 19 19"/><path d="M17 17 14 14"/><path d="m11 2 3.4-1.7a2.18 2.18 0 0 0 1.2-1.2L17.3 0"/><path d="M7 8 8 7"/></svg>
);

const ImageIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);
