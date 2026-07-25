/**
 * Diálogo exibido quando uma apostila parecida já existe.
 * Mostra similaridade e a "qualidade de formatação" das duas versões e
 * recomenda qual manter.
 */
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, FileText, ArrowRight } from 'lucide-react';
import type { DuplicateMatch } from '@/lib/duplicate-detector';

interface Props {
  open: boolean;
  match: DuplicateMatch | null;
  /** Substitui o conteúdo da apostila existente pelo novo (melhor formatado). */
  onReplaceExisting: () => void;
  /** Mantém o conteúdo existente (já está melhor formatado) e descarta o novo. */
  onKeepExisting: () => void;
  /** Cria mesmo assim, como uma apostila separada. */
  onCreateAnyway: () => void;
  onCancel: () => void;
}

export function DuplicateApostilaDialog({
  open, match, onReplaceExisting, onKeepExisting, onCreateAnyway, onCancel,
}: Props) {
  if (!match) return null;
  const simPct = Math.round(match.similarity * 100);
  const recommendReplace = match.newIsBetter;

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Conteúdo parecido detectado
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-sm">
            <span className="block">
              Já existe uma apostila com <strong>{simPct}%</strong> de
              similaridade: <strong>"{match.apostila.title}"</strong>.
            </span>

            <span className="grid grid-cols-2 gap-2 mt-2">
              <span className="rounded border border-border bg-muted/30 p-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" /> Versão existente
                </span>
                <span className="block text-2xl font-bold tabular-nums">
                  {match.existingScore}
                </span>
                <span className="text-[10px] text-muted-foreground">qualidade</span>
              </span>
              <span className="rounded border border-border bg-muted/30 p-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" /> Versão nova
                </span>
                <span className="block text-2xl font-bold tabular-nums">
                  {match.newScore}
                </span>
                <span className="text-[10px] text-muted-foreground">qualidade</span>
              </span>
            </span>

            <span className="block rounded bg-primary/10 border border-primary/30 p-2 text-xs">
              {recommendReplace
                ? <>Recomendação: a <strong>versão nova</strong> está melhor formatada — vamos atualizar a existente.</>
                : <>Recomendação: a <strong>versão existente</strong> já está melhor formatada — mantenha-a.</>}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          {recommendReplace ? (
            <AlertDialogAction asChild>
              <Button onClick={onReplaceExisting} className="w-full gap-1">
                Atualizar existente com a nova versão
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogAction>
          ) : (
            <AlertDialogAction asChild>
              <Button onClick={onKeepExisting} className="w-full">
                Manter a existente (descartar novo)
              </Button>
            </AlertDialogAction>
          )}
          <Button variant="outline" onClick={onCreateAnyway} className="w-full">
            Criar mesmo assim como nova apostila
          </Button>
          <AlertDialogCancel className="w-full mt-0">Cancelar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
