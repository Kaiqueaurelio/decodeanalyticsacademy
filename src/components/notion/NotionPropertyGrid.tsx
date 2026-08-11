import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";

interface PropertyProps {
  icon: LucideIcon;
  label: string;
  value: string | number | React.ReactNode;
}

export function NotionProperty({ icon: Icon, label, value }: PropertyProps) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-2 group border-b border-border/5 last:border-0">
      <div className="flex items-center gap-2.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
        <span className="text-xs font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-sm font-bold text-foreground truncate">
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
    <div className="w-full space-y-4 bg-accent/5 rounded-2xl p-6 border border-border/40 backdrop-blur-sm shadow-inner">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
        {properties.map((prop, idx) => (
          <NotionProperty key={idx} {...prop} />
        ))}
      </div>
      
      {progressValue !== undefined && (
        <div className="pt-6 mt-2 border-t border-border/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Progresso de Aprendizado</span>
            <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{progressValue}%</span>
          </div>
          <div className="relative pt-1">
            <Progress value={progressValue} className="h-2 bg-accent/20 border border-border/10" />
            <div 
              className="absolute top-0 bottom-0 left-0 bg-primary/20 blur-md -z-10 transition-all duration-1000" 
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
