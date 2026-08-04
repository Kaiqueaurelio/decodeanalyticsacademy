import React from 'react';
import { Check, ChevronDown, Filter, Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { getSubjectColor } from '@/lib/subject-colors';

interface SemesterFilterProps {
  selectedSemester: number | null;
  onSelect: (semester: number | null) => void;
  className?: string;
}

const SEMESTERS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export function SemesterFilter({ selectedSemester, onSelect, className }: SemesterFilterProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={cn(
              "h-8 gap-2 rounded-full border-primary/20 bg-primary/5 px-3 text-[11px] font-medium transition-all hover:bg-primary/10 hover:border-primary/40 focus:ring-primary/30",
              selectedSemester && "border-primary/40 bg-primary/10 text-primary shadow-[0_0_15px_-5px_rgba(0,240,255,0.3)]"
            )}
          >
            <Hourglass className={cn("h-3.5 w-3.5", selectedSemester ? "text-primary animate-pulse" : "text-muted-foreground")} />
            <span className="max-md:hidden">
              {selectedSemester ? `${selectedSemester}º Semestre` : 'Semestre: Todos'}
            </span>
            <span className="md:hidden">
              {selectedSemester ? `${selectedSemester}º Sem.` : 'Semestre'}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52 rounded-xl border-border/60 bg-card/95 backdrop-blur-md p-1.5 shadow-2xl">
          <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Filtrar por Semestre
          </div>
          <DropdownMenuSeparator className="bg-border/40" />
          
          <DropdownMenuItem
            onClick={() => onSelect(null)}
            className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs focus:bg-primary/10 focus:text-primary cursor-pointer group"
          >
            <span className="flex items-center gap-2">
              <Filter className="h-3 w-3 text-muted-foreground group-focus:text-primary" />
              Todos os Semestres
            </span>
            {!selectedSemester && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>

          {SEMESTERS.map((sem) => {
            const color = getSubjectColor(`Semestre ${sem}`);
            const isSelected = selectedSemester === sem;
            
            return (
              <DropdownMenuItem
                key={sem}
                onClick={() => onSelect(sem)}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs focus:bg-primary/10 focus:text-primary cursor-pointer mt-0.5"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="flex h-6 items-center rounded-md px-2 text-[10px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: color }}
                  >
                    {sem}º Semestre
                  </div>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {!selectedSemester && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-1.5 rounded-full px-3 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <span className="text-lg font-light leading-none">+</span>
          Filter
        </Button>
      )}
    </div>
  );
}
