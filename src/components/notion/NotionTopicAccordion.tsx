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
          "w-full flex items-center gap-2 py-2 px-1 hover:bg-accent/5 rounded-lg transition-all group text-left",
          level > 0 && "ml-4"
        )}
      >
        <ChevronRight 
          className={cn(
            "h-4 w-4 text-muted-foreground/60 transition-transform duration-300",
            isExpanded && "rotate-90"
          )} 
        />
        <span className={cn(
          "text-sm font-bold tracking-tight transition-colors",
          isExpanded ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
        )}>
          {title}
        </span>
      </button>

      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isExpanded ? "max-h-[1000px] opacity-100 mt-1" : "max-h-0 opacity-0"
      )}>
        <div className="space-y-1 ml-6 pl-2 border-l border-border/60">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={doc.onClick}
              className="w-full flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-primary/5 transition-all group text-left"
            >
              <div className="shrink-0 transition-transform group-hover:scale-110">
                {getIcon(doc.type)}
              </div>
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors truncate">
                {doc.title}
              </span>
            </button>
          ))}
          {documents.length === 0 && (
            <div className="py-2 px-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 italic">Sem documentos vinculados</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
