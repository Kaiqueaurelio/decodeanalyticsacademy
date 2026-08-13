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
  ListChecks,
  RotateCcw,
  PlusCircle,
  Link2,
  Paperclip,
  Wand2,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  AlertTriangle
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
import { validateApostilaStructure } from '@/lib/apostilaValidation';

interface ApostilaHealthBarProps {
  title: string;
  content: string;
  published: boolean;
  saving: boolean;
  lastSavedAt: Date | null;
  onSave: () => void;
  onTogglePublish: () => void;
  onPreview: () => void;
  onOpenPanel: () => void;
  exerciseCount: number;
  materialCount: number;
  onPasteOpen: () => void;
  onAddPage: () => void;
}

export function ApostilaHealthBar({
  title,
  content,
  published,
  saving,
  lastSavedAt,
  onSave,
  onTogglePublish,
  onPreview,
  onOpenPanel,
  exerciseCount,
  materialCount,
  onPasteOpen,
  onAddPage
}: ApostilaHealthBarProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const report = validateApostilaStructure(content || '');
  const { stats } = report;

  const sectionsOk = stats.h2Count >= 4 && stats.h2Count <= 8;
  const wordsOk = stats.words >= 800 && stats.words <= 3500;
  const exercisesOk = exerciseCount >= 5;
  const materialsOk = materialCount >= 1;
  const allOk = sectionsOk && wordsOk && exercisesOk && materialsOk;

  return (
    <div className="flex flex-col border-b border-border/60 bg-muted/30 backdrop-blur-sm sticky top-0 z-50">
      {/* Top Bar: Notion Style Breadcrumbs & Auto-save Status */}
      <div className="h-14 flex items-center justify-between px-2 sm:px-4 border-b border-border/40 bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-1 sm:gap-2 overflow-hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground mr-1"
            onClick={() => {
              if (typeof (window as any).toggleAdminSidebar === 'function') {
                (window as any).toggleAdminSidebar();
              }
              setSidebarCollapsed(!sidebarCollapsed);
            }}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
            <span className="hidden sm:inline hover:bg-accent px-1.5 py-0.5 rounded cursor-pointer transition-colors" onClick={() => window.location.href='/admin'}>Admin</span>
            <span className="hidden sm:inline text-muted-foreground/30">/</span>
            <span className="hover:bg-accent px-1.5 py-0.5 rounded cursor-pointer transition-colors font-bold max-w-[150px] truncate">{title || 'Edição'}</span>
            <span className="hidden sm:inline text-muted-foreground/30">/</span>
            <span className="text-muted-foreground/60">Conteúdo</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {saving ? (
              <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground animate-pulse">
                <Clock className="h-3 w-3" />
                Salvando...
              </span>
            ) : lastSavedAt ? (
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold animate-in fade-in duration-500">
                <Check className="h-3 w-3" />
                Salvo
                <span className="text-muted-foreground font-normal ml-1">
                  ({lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
                </span>
              </span>
            ) : null}
          </div>

          <div className="h-4 w-[1px] bg-border/40 hidden sm:block" />

          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onPreview}
              className="h-8 text-xs gap-2 rounded-lg hover:bg-accent"
              title="Pré-visualizar (Ctrl+P)"
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
                      <Eye className="h-3.5 w-3.5 opacity-50" /> Despublicar apostila
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
      </div>

      {/* Health Bar / Metrics: Exactly like image-93.png */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-muted/20 border-b border-border/40">
        <div className="flex items-center gap-1.5 mr-2">
          {allOk ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
          <span className="text-[11px] font-bold uppercase tracking-tight">
             {allOk ? 'Pronta para publicar' : 'Pendências detectadas'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
            sectionsOk ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
          )}>
            <FileText className="h-3 w-3" />
            {stats.h2Count} seções
          </div>
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
            wordsOk ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
          )}>
            <FileText className="h-3 w-3" />
            {stats.words} palavras
          </div>
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
            exercisesOk ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
          )}>
            <ListChecks className="h-3 w-3" />
            {exerciseCount} exercícios
          </div>
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
            materialsOk ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
          )}>
            <Paperclip className="h-3 w-3" />
            {materialCount} materiais
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={onSave}
            className="h-8 text-[11px] font-black uppercase tracking-widest gap-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
            title="Forçar Salvar (Ctrl+S)"
          >
            <Save className="h-3.5 w-3.5" />
            SALVAR
          </Button>
        </div>
      </div>

      {/* Secondary Admin Toolbar - ORGANIZED IN 3 GROUPS */}
      <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto scrollbar-none whitespace-nowrap bg-background/95 backdrop-blur-sm border-t border-border/40">
        
        {/* GRUPO 1 - ESTRUTURA */}
        <div className="flex items-center gap-1 pr-3 border-r border-border/40">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-[10px] font-black uppercase border-primary/30 text-primary hover:bg-primary/5 bg-background/50">
            <RotateCcw className="h-3.5 w-3.5" />
            Regredir Capa
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={onAddPage}
            className="h-10 gap-2 px-4 text-[11px] font-black uppercase border-emerald-500/30 text-emerald-600 hover:bg-emerald-700 hover:text-white bg-emerald-500/5 transition-all group active:scale-95 animate-pulse hover:animate-none shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            title="Adicionar Nova Página/Seção (Ctrl+Shift+P)"
          >
            <PlusCircle className="h-4 w-4" />
            + PAGE
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Reordenar Seções">
            <Link2 className="h-4 w-4" />
          </Button>
        </div>

        {/* GRUPO 2 - CONTEÚDO */}
        <div className="flex items-center gap-1 px-3 border-r border-border/40">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onPasteOpen}
            className="h-8 gap-1.5 px-3 text-[10px] font-black uppercase text-primary hover:bg-primary/5"
            title="Colar Inteligente (Ctrl+V context)"
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
            Colar Inteligente
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1.5 px-3 text-[10px] font-black uppercase border-primary/30 text-primary hover:bg-primary/5 bg-background/50"
            title="Adicionar Questão ENEM (Ctrl+E)"
          >
            <Wand2 className="h-3.5 w-3.5 text-primary" />
            Adicionar ENEM
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary/70" title="Anexar Materiais">
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>

        {/* GRUPO 3 - PUBLICAÇÃO */}
        <div className="flex items-center gap-1 pl-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onPreview}
            className="h-8 gap-1.5 px-3 text-[10px] font-black uppercase text-amber-500 hover:bg-amber-500/10"
          >
            <Eye className="h-3.5 w-3.5" />
            Pré-visualizar
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
            onClick={onSave}
            className="h-8 gap-1.5 px-3 text-[10px] font-black uppercase text-emerald-600 hover:bg-emerald-500/10"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Salvar
          </Button>
        </div>

        {/* Course Badges & Subject Info */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1">
            {['CC', 'SI', 'EC'].map(c => (
              <Badge key={c} variant="outline" className="text-[9px] font-black h-5 px-1.5 border-border/50 bg-background/80">{c}</Badge>
            ))}
          </div>
          <div className="h-6 w-[1px] bg-border/40 mx-1" />
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5 text-[11px] font-bold border border-border/50 bg-background/80">
            <Menu className="h-3.5 w-3.5" />
            <span className="truncate max-w-[100px]">{title || 'Apostila'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
