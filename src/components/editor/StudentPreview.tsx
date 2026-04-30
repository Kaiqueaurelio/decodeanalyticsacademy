/**
 * StudentPreview — renderiza a apostila exatamente como o aluno verá,
 * usando o ApostilaContentRenderer (mesma engine de blocos especiais,
 * código, tabelas, glossário, exercícios, etc.).
 *
 * Usado pelo MarkdownEditor para o botão "Visualizar como aluno" e para o
 * modo "Lado a lado" (com sincronização de scroll + destaque de seção).
 */
import { forwardRef } from 'react';
import { ApostilaContentRenderer } from '@/components/ApostilaContentRenderer';
import { Eye } from 'lucide-react';

interface Props {
  content: string;
  activeHeadingId?: string | null;
  /** Quando true, omite a barra de aviso (usado no split, que tem header próprio). */
  compact?: boolean;
}

export const StudentPreview = forwardRef<HTMLDivElement, Props>(function StudentPreview(
  { content, activeHeadingId, compact },
  ref,
) {
  return (
    <div ref={ref} className="flex-1 overflow-auto bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-3xl px-4 py-6">
        {!compact && (
          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground border border-dashed border-primary/30 rounded-md bg-primary/5 px-3 py-2">
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span>Pré-visualização — assim que o aluno verá esta apostila no app.</span>
          </div>
        )}
        {content?.trim() ? (
          <ApostilaContentRenderer content={content} activeHeadingId={activeHeadingId} />
        ) : (
          <p className="text-sm text-muted-foreground italic">
            (Sem conteúdo ainda — escreva algo no editor para ver como vai aparecer.)
          </p>
        )}
      </div>
    </div>
  );
});
