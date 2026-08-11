import { useState } from 'react';
import { ChevronRight, FileText, Calendar, CheckSquare, BookOpen } from 'lucide-react';
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
  title, 
  isExpandedByDefault = false, 
  documents,
  level = 0
}: TopicAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(isExpandedByDefault);

  const getIcon = (type: string) => {
    switch (type) {
      case 'summary': return <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />;
      case 'calendar': return <Calendar className="h-3.5 w-3.5 text-amber-500" />;
      case 'exam_review': return <BookOpen className="h-3.5 w-3.5 text-primary" />;
      default: return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-2 py-3 px-3 hover:bg-accent/5 rounded-xl transition-all group text-left",
          level > 0 && "ml-4",
          isExpanded && "bg-accent/5"
        )}
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-background border border-border/40 shadow-sm group-hover:border-primary/30 transition-colors">
          <ChevronRight 
            className={cn(
              "h-4 w-4 text-muted-foreground/60 transition-transform duration-300",
              isExpanded && "rotate-90 text-primary"
            )} 
          />
        </div>
        <div className="flex flex-col">
          <span className={cn(
            "text-sm font-bold tracking-tight transition-colors",
            isExpanded ? "text-primary" : "text-foreground group-hover:text-primary"
          )}>
            {title}
          </span>
          {documents.length > 0 && !isExpanded && (
            <span className="text-[10px] text-muted-foreground/60 font-medium">
              {documents.length} item{documents.length > 1 ? 'ns' : ''}
            </span>
          )}
        </div>
      </button>

      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isExpanded ? "max-h-[1000px] opacity-100 mt-2" : "max-h-0 opacity-0"
      )}>
        <div className="space-y-2 ml-7 pl-6 border-l-2 border-primary/10">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={doc.onClick}
              className="w-full flex items-center gap-4 py-3 px-4 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all group text-left bg-card/50 shadow-sm hover:shadow-md"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border/40 group-hover:border-primary/30 group-hover:scale-110 transition-all shadow-sm">
                {getIcon(doc.type)}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                  {doc.title}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                  {doc.type === 'note' ? 'Caderno' : doc.type === 'summary' ? 'Resumo' : doc.type === 'exam_review' ? 'Exercícios' : 'Calendário'}
                </span>
              </div>
            </button>
          ))}
          {documents.length === 0 && (
            <div className="py-4 px-4 bg-muted/20 rounded-xl border border-dashed border-border/60">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 italic flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                Sem documentos vinculados
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
