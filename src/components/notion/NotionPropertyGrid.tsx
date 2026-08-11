import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface PropertyProps {
  icon: LucideIcon;
  label: string;
  value: string | number | React.ReactNode;
}

export function NotionProperty({ icon: Icon, label, value }: PropertyProps) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-2 py-1.5 group">
      <div className="flex items-center gap-2 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-sm font-semibold truncate">
        {value}
      </div>
    </div>
  );
}

interface PropertyGridProps {
  properties: PropertyProps[];
  progressValue?: number;
}

export function NotionPropertyGrid({ properties, progressValue }: PropertyGridProps) {
  return (
    <div className="w-full space-y-4 bg-card/30 rounded-2xl p-5 border border-border/40 backdrop-blur-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
        {properties.map((prop, idx) => (
          <NotionProperty key={idx} {...prop} />
        ))}
      </div>
      
      {progressValue !== undefined && (
        <div className="pt-4 border-t border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Progresso na Disciplina</span>
            <span className="text-xs font-black text-primary">{progressValue}%</span>
          </div>
          <Progress value={progressValue} className="h-1.5" />
        </div>
      )}
    </div>
  );
}
