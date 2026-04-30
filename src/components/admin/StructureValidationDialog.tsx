/**
 * StructureValidationDialog — alerta o admin sobre problemas estruturais
 * (H2/H3, densidade de palavras) detectados antes de salvar uma apostila.
 *
 * Comportamento:
 *  - Se houver `error`: o botão primário fica "Revisar" e há ação secundária
 *    "Salvar mesmo assim" para não bloquear casos legítimos.
 *  - Se só houver `warning`: botão primário "Salvar mesmo assim".
 *  - Se `report.ok`: o diálogo nem é renderizado (verificado no caller).
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, XCircle, Hash, ListTree, FileText } from 'lucide-react';
import type { ValidationReport } from '@/lib/apostilaValidation';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  report: ValidationReport | null;
  onCancel: () => void;
  /** Salvar mesmo com avisos. */
  onConfirm: () => void;
  /** Texto opcional do título da apostila (contextualiza o aviso). */
  apostilaTitle?: string;
}

export function StructureValidationDialog({ open, report, onCancel, onConfirm, apostilaTitle }: Props) {
  if (!report) return null;
  const hasError = report.issues.some((i) => i.severity === 'error');
  const { stats } = report;

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className={cn('h-5 w-5', hasError ? 'text-destructive' : 'text-amber-500')} />
            {hasError ? 'Estrutura incompleta' : 'Verifique antes de salvar'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                {apostilaTitle ? <>A apostila <strong className="text-foreground">"{apostilaTitle}"</strong> </> : 'A apostila '}
                {hasError
                  ? 'não atende ao padrão editorial Decode Analytics:'
                  : 'tem alguns pontos que podem ser melhorados antes de publicar:'}
              </p>

              {/* Resumo numérico — sempre visível */}
              <div className="grid grid-cols-3 gap-2 not-prose">
                <StatCard
                  icon={<Hash className="h-3.5 w-3.5" />}
                  label="Seções (H2)"
                  value={`${stats.h2Count}/${stats.expectedH2}`}
                  good={stats.h2Count === stats.expectedH2}
                />
                <StatCard
                  icon={<ListTree className="h-3.5 w-3.5" />}
                  label="Subtópicos (H3)"
                  value={String(stats.h3Count)}
                  good={stats.h3Count > 0 && stats.h2WithoutH3.length === 0}
                />
                <StatCard
                  icon={<FileText className="h-3.5 w-3.5" />}
                  label="Palavras"
                  value={stats.words.toLocaleString('pt-BR')}
                  good={stats.words >= 800 && stats.words <= 3500}
                />
              </div>

              {/* Lista detalhada de problemas */}
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {report.issues.map((it, i) => (
                  <li
                    key={i}
                    className={cn(
                      'flex gap-2 rounded-md border p-2.5 text-xs',
                      it.severity === 'error'
                        ? 'border-destructive/40 bg-destructive/10 text-destructive-foreground'
                        : 'border-amber-500/40 bg-amber-500/10',
                    )}
                  >
                    {it.severity === 'error' ? (
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className={cn('font-medium', it.severity === 'error' ? 'text-destructive' : 'text-amber-600 dark:text-amber-400')}>
                        {it.message}
                      </p>
                      {it.hint && <p className="text-muted-foreground mt-0.5">{it.hint}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel onClick={onCancel}>
            {hasError ? 'Revisar conteúdo' : 'Voltar e ajustar'}
          </AlertDialogCancel>
          <Button
            variant={hasError ? 'outline' : 'default'}
            onClick={onConfirm}
            className={cn(!hasError && 'gradient-primary text-primary-foreground')}
          >
            Salvar mesmo assim
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function StatCard({ icon, label, value, good }: { icon: React.ReactNode; label: string; value: string; good: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-md border p-2 text-center',
        good ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5',
      )}
    >
      <div className={cn('flex items-center gap-1 text-[10px] uppercase tracking-wide', good ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
        {icon}
        {label}
      </div>
      <div className="text-base font-semibold mt-0.5 flex items-center gap-1 text-foreground">
        {value}
        {good && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
      </div>
    </div>
  );
}
