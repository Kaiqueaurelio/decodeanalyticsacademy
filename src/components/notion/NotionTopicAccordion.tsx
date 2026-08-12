import { useState } from 'react';
import { ChevronRight, FileText, Calendar, CheckSquare, BookOpen, NotebookIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentNode {
  id: string;
  title: string;
  type: 'note' | 'summary' | 'exam_review' | 'calendar';
  onClick?: () => void;
}

interface TopicAccordionProps {
  id: string;
  title: string;
  isExpandedByDefault?: boolean;
  documents: DocumentNode[];
  level?: number;
}

export function NotionTopicAccordion({ 
  id,
  title, 
  isExpandedByDefault = false, 
  documents,
  level = 0
}: TopicAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(isExpandedByDefault);

  const getIcon = (type: string) => {
    switch (type) {
      case 'summary': return <CheckSquare className="h-4 w-4 text-emerald-500" />;
      case 'calendar': return <Calendar className="h-4 w-4 text-amber-500" />;
      case 'exam_review': return <BookOpen className="h-4 w-4 text-primary" />;
      case 'note': return <NotebookIcon className="h-4 w-4 text-blue-500" />;
      default: return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case 'note': return 'Caderno de Notas';
      case 'summary': return 'Resumo Teórico';
      case 'exam_review': return 'Simulado e Exercícios';
      case 'calendar': return 'Cronograma';
      default: return 'Documento';
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'summary': return 'hover:bg-emerald-500/5 hover:border-emerald-500/20 group-hover:text-emerald-500';
      case 'calendar': return 'hover:bg-amber-500/5 hover:border-amber-500/20 group-hover:text-amber-500';
      case 'exam_review': return 'hover:bg-primary/5 hover:border-primary/20 group-hover:text-primary';
      case 'note': return 'hover:bg-blue-500/5 hover:border-blue-500/20 group-hover:text-blue-500';
      default: return 'hover:bg-accent/5 hover:border-border/40';
    }
  };

  return (
    <div className="w-full" id={id}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-2 py-2 px-2 hover:bg-accent/5 rounded-lg transition-all group text-left",
          isExpanded && "bg-accent/5"
        )}
      >
        <ChevronRight 
          className={cn(
            "h-4 w-4 text-muted-foreground/40 transition-transform duration-200",
            isExpanded && "rotate-90 text-foreground"
          )} 
        />
        <div className="flex items-center gap-2">
           <div className="h-6 w-6 rounded flex items-center justify-center bg-accent/10 border border-border/20 text-muted-foreground/60 group-hover:text-primary transition-colors">
             {isExpanded ? '📂' : '📁'}
           </div>
           <span className={cn(
             "text-sm font-bold tracking-tight transition-colors",
             isExpanded ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
           )}>
             {title.replace(/_/g, ' ')}
           </span>
        </div>
      </button>

      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isExpanded ? "max-h-[1000px] opacity-100 mb-4" : "max-h-0 opacity-0"
      )}>
        <div className="mt-1 ml-4 pl-4 border-l border-border/20 space-y-2 py-2">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={doc.onClick}
              className={cn(
                "w-full flex items-center gap-3 py-3 px-4 rounded-xl border border-border/10 bg-card/30 transition-all group text-left shadow-sm",
                getColorClass(doc.type)
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border/40 group-hover:scale-105 transition-all shadow-inner">
                {getIcon(doc.type)}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-black text-foreground group-hover:text-inherit transition-colors truncate">
                  {doc.title}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  {getLabel(doc.type)}
                </span>
              </div>
            </button>
          ))}
          
          {documents.length === 0 && (
            <div className="py-4 px-4 bg-muted/10 rounded-xl border border-dashed border-border/20 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic">
                Nenhum documento disponível
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
