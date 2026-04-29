/**
 * ImportPreviewPanel — pré-visualização rica do conteúdo clonado de um link
 * (ou colado em texto bruto) ANTES de salvar como apostila.
 *
 * Mostra cards/abas com:
 *  - Sebras (estatísticas: palavras, leitura, imagens, títulos, links)
 *  - Estrutura: lista hierárquica de títulos detectados (H1.H2.H3)
 *  - Glossário: termos no padrão "Palavra: definição"
 *  - Perguntas/Exercícios: detectados heuristicamente + os que vieram da IA
 *
 * Não persiste nada — só ajuda o admin a decidir se o conteúdo está bom.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, ListTree, BookOpen, HelpCircle, Image as ImageIcon, Link as LinkIcon,
  Clock, Hash, ChevronRight, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { analyzeImport } from '@/lib/import-analyze';

interface Props {
  /** Markdown extraído */
  content: string;
  /** Exercícios já estruturados pela IA (vindos do edge function) */
  aiExercises?: Array<{ question: string; options?: string[]; correct_answer?: string; explanation?: string }>;
  className?: string;
}

export function ImportPreviewPanel({ content, aiExercises = [], className }: Props) {
  const analysis = useMemo(() => analyzeImport(content), [content]);

  // Saúde do conteúdo
  const health = useMemo(() => {
    const issues: string[] = [];
    if (analysis.totals.words < 300) issues.push('Conteúdo curto (<300 palavras)');
    if (analysis.totals.headings === 0) issues.push('Nenhum título (H1/H2/H3) — estrutura fraca');
    if (analysis.totals.images === 0 && analysis.totals.words > 800) issues.push('Sem imagens em conteúdo longo');
    if (aiExercises.length === 0 && analysis.questions.length === 0) issues.push('Sem exercícios detectados');
    return issues;
  }, [analysis, aiExercises.length]);

  const totalQuestions = aiExercises.length + analysis.questions.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('rounded-xl border border-border bg-card/50 overflow-hidden', className)}
    >
      {/* Cabeçalho com sebras (cards de stats) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-3 bg-muted/30 border-b border-border">
        <Stat icon={FileText} label="Palavras" value={analysis.totals.words.toLocaleString('pt-BR')} />
        <Stat icon={Clock} label="Leitura" value={`~${analysis.totals.minutes} min`} />
        <Stat icon={Hash} label="Títulos" value={analysis.totals.headings} accent={analysis.totals.headings > 0} />
        <Stat icon={ImageIcon} label="Imagens" value={analysis.totals.images} />
        <Stat icon={LinkIcon} label="Links" value={analysis.totals.links} />
        <Stat icon={HelpCircle} label="Perguntas" value={totalQuestions} accent={totalQuestions > 0} />
      </div>

      {/* Avisos de saúde */}
      {health.length > 0 ? (
        <div className="px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-500 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-medium">Pontos de atenção:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {health.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </div>
        </div>
      ) : (
        <div className="px-3 py-1.5 bg-emerald-500/10 border-b border-emerald-500/20 text-[11px] text-emerald-500 flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Conteúdo bem estruturado, pronto para salvar.
        </div>
      )}

      <Tabs defaultValue="structure" className="w-full">
        <TabsList className="h-9 w-full justify-start rounded-none bg-transparent border-b border-border px-2">
          <TabsTrigger value="structure" className="text-[11px] gap-1.5 h-7">
            <ListTree className="h-3 w-3" /> Estrutura
            <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">{analysis.sections.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="glossary" className="text-[11px] gap-1.5 h-7">
            <BookOpen className="h-3 w-3" /> Glossário
            <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">{analysis.glossary.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="questions" className="text-[11px] gap-1.5 h-7">
            <HelpCircle className="h-3 w-3" /> Perguntas
            <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">{totalQuestions}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Estrutura — outline hierárquico */}
        <TabsContent value="structure" className="m-0">
          <ScrollArea className="h-56">
            <div className="p-2 space-y-0.5">
              {analysis.sections.length === 0 ? (
                <Empty msg="Nenhum título detectado. Use #, ## ou ### no Markdown." />
              ) : (
                analysis.sections.map((s, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-start gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent/40',
                      s.level === 2 && 'pl-6',
                      s.level === 3 && 'pl-10',
                    )}
                  >
                    <span className="font-mono text-[10px] text-primary shrink-0 mt-0.5">{s.number}</span>
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate', s.level === 1 && 'font-semibold')}>{s.title}</p>
                      {s.bodyPreview && (
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{s.bodyPreview}</p>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground font-mono shrink-0">{s.wordCount}p</span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Glossário — Termo: definição */}
        <TabsContent value="glossary" className="m-0">
          <ScrollArea className="h-56">
            <div className="p-2 space-y-1.5">
              {analysis.glossary.length === 0 ? (
                <Empty msg='Nenhum termo no padrão "Termo: definição" detectado.' />
              ) : (
                analysis.glossary.map((g, i) => (
                  <div key={i} className="rounded border border-border/60 bg-background/60 px-2 py-1.5">
                    <p className="text-xs font-semibold text-primary">{g.term}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{g.definition}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Perguntas — IA + heurística */}
        <TabsContent value="questions" className="m-0">
          <ScrollArea className="h-56">
            <div className="p-2 space-y-1.5">
              {totalQuestions === 0 && (
                <Empty msg="Nenhuma pergunta ou exercício detectado." />
              )}

              {aiExercises.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-mono px-1 mb-1">
                    Exercícios estruturados ({aiExercises.length})
                  </p>
                  {aiExercises.map((ex, i) => (
                    <div key={`ai-${i}`} className="rounded border border-emerald-500/30 bg-emerald-500/5 px-2 py-1.5 mb-1">
                      <p className="text-xs font-medium flex items-start gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{i + 1}. {ex.question}</span>
                      </p>
                      {ex.options && ex.options.length > 0 && (
                        <ul className="mt-1 ml-4 space-y-0.5">
                          {ex.options.map((opt, oi) => {
                            const letter = String.fromCharCode(65 + oi);
                            const isCorrect = letter === ex.correct_answer;
                            return (
                              <li
                                key={oi}
                                className={cn(
                                  'text-[10px]',
                                  isCorrect ? 'text-emerald-500 font-medium' : 'text-muted-foreground',
                                )}
                              >
                                {letter}) {opt} {isCorrect && '✓'}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {analysis.questions.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-mono px-1 mb-1 mt-2">
                    Detectadas no texto ({analysis.questions.length})
                  </p>
                  {analysis.questions.map((q, i) => (
                    <div key={`h-${i}`} className="rounded border border-border/60 bg-background/60 px-2 py-1.5 mb-1 flex items-start gap-1.5">
                      <ChevronRight className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px]">{q.question}</p>
                        {q.hasOptions && (
                          <Badge variant="outline" className="mt-0.5 h-4 px-1 text-[9px]">com alternativas</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function Stat({
  icon: Icon, label, value, accent,
}: { icon: React.ElementType; label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={cn(
      'rounded-md border px-2 py-1.5 bg-background/60 flex flex-col items-start gap-0.5',
      accent ? 'border-primary/40' : 'border-border/60',
    )}>
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-2.5 w-2.5" /> {label}
      </div>
      <div className={cn('text-sm font-mono font-semibold leading-none', accent && 'text-primary')}>
        {value}
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="text-center py-6 text-[11px] text-muted-foreground">{msg}</div>
  );
}
