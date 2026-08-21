import { AlertTriangle, ClipboardCheck, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { findGabaritoSubject } from '@/data/gabaritos';

type Props = {
  subject: string;
};

export function GabaritoSection({ subject }: Props) {
  const gabarito = findGabaritoSubject(subject);
  if (!gabarito) return null;

  return (
    <section id="gabaritos-unidades" className="space-y-4 scroll-mt-6" aria-labelledby="gabaritos-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <ClipboardCheck className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Material de revisão</span>
          </div>
          <h2 id="gabaritos-title" className="text-lg font-black tracking-tight">Gabaritos dos questionários</h2>
          <p className="text-xs text-muted-foreground mt-1">{gabarito.name} · {gabarito.code}</p>
        </div>
        <Badge variant="secondary" className="w-fit gap-1 text-[10px]">
          <GraduationCap className="h-3 w-3" /> Unidades I e II
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {gabarito.units.map((unit) => (
          <Card key={unit.title} className="overflow-hidden border-border/50 bg-card/95">
            <details open className="group">
              <summary className="cursor-pointer list-none px-4 py-3 border-b border-border/40 bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold">{unit.title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1 font-mono leading-relaxed">{unit.summary}</p>
                  </div>
                  <span className="text-muted-foreground text-xs transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
                </div>
              </summary>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {unit.questions.map((item) => (
                    <div key={`${unit.title}-${item.question}`} className="rounded-lg border border-border/40 bg-background/50 p-3">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Questão {item.question}</span>
                        <Badge className="h-6 min-w-7 justify-center font-black" variant={item.answer === '—' ? 'outline' : 'default'}>
                          {item.answer}
                        </Badge>
                      </div>
                      {item.response && <p className="text-xs leading-relaxed text-foreground/80">{item.response}</p>}
                    </div>
                  ))}
                </div>

                {unit.notes?.map((note) => (
                  <div key={note} className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{note}</p>
                  </div>
                ))}
              </div>
            </details>
          </Card>
        ))}
      </div>
    </section>
  );
}
