import React from 'react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, BookOpen } from 'lucide-react';

export interface ScheduleSlot {
  dayNumber: 1 | 2 | 3 | 4 | 5;
  startTime: string;
  endTime: string;
  subject: string;
  professor?: string;
  isQuinzenal?: boolean;
  room?: string;
}

export interface CoordinatorSlot {
  name: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface ScheduleGridProps {
  semester: number;
  year: number;
  campus: string;
  period: string;
  courseCode: string;
  slots: ScheduleSlot[];
  coordinators: CoordinatorSlot[];
  specialDisciplines?: string[];
}

const DAYS = [
  { name: 'Segunda', number: 1 },
  { name: 'Terça', number: 2 },
  { name: 'Quarta', number: 3 },
  { name: 'Quinta', number: 4 },
  { name: 'Sexta', number: 5 }
];

export function ScheduleGrid({ 
  semester, 
  year, 
  campus, 
  period, 
  courseCode, 
  slots, 
  coordinators,
  specialDisciplines = []
}: ScheduleGridProps) {
  
  // Agrupar horários únicos
  const timeRanges = Array.from(new Set(slots.map(s => `${s.startTime} - ${s.endTime}`))).sort();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="text-center space-y-2 border-b border-border/40 pb-6">
        <h2 className="font-display font-black text-xl md:text-2xl tracking-tight uppercase">
          Horário de Aula — {year}/{semester === 6 ? 2 : 1} — Campus {campus}
        </h2>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {courseCode}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Período: {period}</span>
        </div>
      </header>

      <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px] text-center font-bold uppercase tracking-wider text-[10px]">Turma</TableHead>
                <TableHead className="w-[140px] text-center font-bold uppercase tracking-wider text-[10px]">Horário</TableHead>
                {DAYS.map(day => (
                  <TableHead key={day.number} className="text-center font-bold uppercase tracking-wider text-[10px] min-w-[180px]">
                    {day.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeRanges.map((range, rangeIdx) => (
                <TableRow key={range} className="hover:bg-primary/5 transition-colors group">
                  {rangeIdx === 0 && (
                    <TableCell 
                      rowSpan={timeRanges.length} 
                      className="text-center font-black text-primary bg-primary/5 border-r border-border/40 w-[100px]"
                    >
                      {courseCode}
                    </TableCell>
                  )}
                  <TableCell className="text-center font-mono text-xs font-bold py-6 border-r border-border/40">
                    {range}
                  </TableCell>
                  {DAYS.map(day => {
                    const slot = slots.find(s => `${s.startTime} - ${s.endTime}` === range && s.dayNumber === day.number);
                    return (
                      <TableCell key={day.number} className={cn(
                        "text-center p-4 min-h-[100px] border-r border-border/20 last:border-r-0",
                        slot?.isQuinzenal && "bg-amber-500/5"
                      )}>
                        {slot ? (
                          <div className="space-y-2">
                            <div className="text-[11px] font-black leading-tight uppercase tracking-tight group-hover:text-primary transition-colors">
                              {slot.subject}
                            </div>
                            {slot.isQuinzenal && (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] font-bold uppercase tracking-tighter h-5">
                                * Quinzenal
                              </Badge>
                            )}
                            {slot.professor && (
                              <div className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1 opacity-80">
                                <Users className="h-3 w-3" /> {slot.professor}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground/30 font-black italic">—</div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {specialDisciplines.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <p className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Disciplinas Especiais: {specialDisciplines.join(', ')}
          </p>
        </div>
      )}

      {coordinators.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Atendimento Coordenação</h3>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/30 backdrop-blur-sm overflow-hidden shadow-lg">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[120px] text-center font-bold uppercase tracking-wider text-[10px]">Turma</TableHead>
                  <TableHead className="w-[140px] text-center font-bold uppercase tracking-wider text-[10px]">Horário</TableHead>
                  {DAYS.map(day => (
                    <TableHead key={day.number} className="text-center font-bold uppercase tracking-wider text-[10px]">
                      {day.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-center font-bold text-muted-foreground text-xs uppercase">Coordenação</TableCell>
                  <TableCell className="text-center font-mono text-[10px] font-bold">18:30 - 21:00</TableCell>
                  {DAYS.map(day => {
                    const coord = coordinators.find(c => c.day.toLowerCase().includes(day.name.toLowerCase()));
                    return (
                      <TableCell key={day.number} className="text-center p-3">
                        {coord ? (
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold leading-tight uppercase">Atend. Coordenação</div>
                            <div className="text-[9px] text-primary font-black uppercase tracking-tighter">({coord.name})</div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground/20 italic">—</div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <footer className="flex justify-end pt-4 border-t border-border/40">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
          Atualizado em: 04/08/2026 · Prof. Alexandre Bezolan
        </p>
      </footer>
    </div>
  );
}
