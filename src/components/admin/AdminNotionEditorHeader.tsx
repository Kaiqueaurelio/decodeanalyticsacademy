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
  Scissors,
  Loader2,
  ExternalLink
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { COURSE_OPTIONS, type CourseCode } from '@/lib/subject-semester-map';
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
  splitting?: boolean;
  lastSavedAt: Date | null;
  onSave: () => void;
  onTogglePublish: () => void;
  onPreview: () => void;
  onOpenPanel: () => void;
  onSplitByDate?: () => void;
  wordCount: number;
  exerciseCount: number;
  materialCount: number;
  onPasteOpen: () => void;
  onAddPage: () => void;
  creatingPage?: boolean;
  course?: CourseCode[];
  onCourseChange?: (course: CourseCode[]) => void;
  savedDate?: string;
  onDateChange?: (date: string) => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}


export function ApostilaHealthBar({
  title,
  published,
  saving,
  splitting,
  lastSavedAt,
  onSave,
  onTogglePublish,
  onPreview,
  onOpenPanel,
  onSplitByDate,
  wordCount,
  exerciseCount,
  materialCount,
  onPasteOpen,
  onAddPage,
  creatingPage = false,
  course = [],
  onCourseChange,
  savedDate,
  onDateChange,
  sidebarCollapsed = false,
  onToggleSidebar,
}: ApostilaHealthBarProps) {
  return (
    <div className="flex flex-col border-b border-border/60 bg-muted/30 backdrop-blur-sm sticky top-0 z-50">
      {/* Top Bar: Notion Style Breadcrumbs & Auto-save Status */}
      <div className="h-14 flex items-center justify-between px-2 sm:px-4 border-b border-border/40 bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-1 sm:gap-2 overflow-hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground mr-1"
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? 'Abrir lista de apostilas' : 'Recolher lista de apostilas'}
            aria-label={sidebarCollapsed ? 'Abrir lista de apostilas' : 'Recolher lista de apostilas'}
            aria-expanded={!sidebarCollapsed}
            aria-controls="workbench-apostila-sidebar"
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
              <div className="flex flex-col items-end">
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-black animate-in fade-in duration-500">
                  <Check className="h-3 w-3" />
                  SALVO NO BANCO
                </span>
                <span className="text-[9px] text-muted-foreground font-medium opacity-70">
                  Sincronizado: {lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ) : null}
          </div>

          <div className="h-4 w-[1px] bg-border/40 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase hidden md:inline">Data da Aula:</span>
            <input
              type="date"
              value={savedDate || ''}
              onChange={(e) => onDateChange?.(e.target.value)}
              className="bg-background border border-border/50 rounded px-2 py-1 text-[10px] font-bold focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="h-4 w-[1px] bg-border/40 hidden sm:block" />

          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.open(`/apostilas/${(window as any).__apostila_id || ''}`, '_blank')}
              className="h-8 text-xs gap-2 rounded-lg hover:bg-accent"
              title="Visualizar como aluno (Nova aba)"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Visualizar</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onPreview}
              className="h-8 text-xs gap-2 rounded-lg hover:bg-accent"
              title="Pré-visualizar rascunho (Modal)"
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSplitByDate}
            disabled={splitting}
            className="h-8 gap-1.5 px-3 text-[10px] font-black uppercase border-primary/30 text-primary hover:bg-primary/5 bg-background/50"
          >
            {splitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Scissors className="h-3.5 w-3.5" />}
            Separar por Data
          </Button>


          <Button 
            variant="outline" 
            size="sm" 
            type="button"
            onClick={onAddPage}
            disabled={creatingPage}
            aria-busy={creatingPage}
            className="h-10 gap-2 px-4 text-[11px] font-black uppercase border-emerald-500/30 text-emerald-600 hover:bg-emerald-700 hover:text-white bg-emerald-500/5 transition-all group active:scale-95 animate-pulse hover:animate-none shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            title="Adicionar página persistida (Ctrl+Shift+P)"
          >
            {creatingPage ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
            {creatingPage ? 'CRIANDO...' : '+ PÁGINA'}
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
            onClick={() => window.open(`/apostilas/${(window as any).__apostila_id || ''}`, '_blank')}
            className="h-8 gap-1.5 px-3 text-[10px] font-black uppercase text-blue-500 hover:bg-blue-500/10"
            title="Ver como o aluno enxerga"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Visualizar
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onPreview}
            className="h-8 gap-1.5 px-3 text-[10px] font-black uppercase text-amber-500 hover:bg-amber-500/10"
          >
            <Eye className="h-3.5 w-3.5" />
            Prévia
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

        {/* Cursos associados à apostila */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1" aria-label="Cursos associados à apostila">
            {COURSE_OPTIONS.map((courseCode) => {
              const selected = course.includes(courseCode);
              return (
                <Button
                  key={courseCode}
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={`Curso ${courseCode}`}
                  aria-pressed={selected}
                  title={selected ? `Remover ${courseCode} desta apostila` : `Associar ${courseCode} a esta apostila`}
                  onClick={() => {
                    const nextCourse = selected
                      ? course.filter((item) => item !== courseCode)
                      : [...course, courseCode];
                    onCourseChange?.(nextCourse);
                  }}
                  className={cn(
                    'h-7 min-w-10 px-2 text-[10px] font-black transition-colors',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border-border/50 bg-background/80 hover:border-primary/60 hover:bg-primary/10',
                  )}
                >
                  {courseCode}
                </Button>
              );
            })}
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

const EyeOff = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
);

// REMOVED: Duplicate local definitions replaced by imports


const ImageIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);
