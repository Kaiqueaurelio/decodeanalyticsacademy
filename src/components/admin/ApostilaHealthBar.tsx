/**
 * ApostilaHealthBar — barra fina no topo do Workbench mostrando o estado
 * editorial da apostila em 1 olhada: seções, palavras, exercícios, materiais,
 * status de publicação. Cada chip é clicável para focar na coluna correspondente.
 */
import { CheckCircle2, AlertTriangle, FileText, ListChecks, Paperclip, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateApostilaStructure } from '@/lib/apostilaValidation';
import { Button } from '@/components/ui/button';

interface Props {
  content: string;
  exerciseCount: number;
  materialCount: number;
  published: boolean;
  saving?: boolean;
  lastSavedAt?: Date | null;
  onTogglePublish?: () => void;
  onFocusExercises?: () => void;
  onFocusMaterials?: () => void;
}

function Chip({ ok, icon: Icon, label, onClick }: { ok: boolean; icon: any; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
        ok
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15'
          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/15',
        !onClick && 'cursor-default',
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

export function ApostilaHealthBar({
  content,
  exerciseCount,
  materialCount,
  published,
  saving,
  lastSavedAt,
  onTogglePublish,
  onFocusExercises,
  onFocusMaterials,
}: Props) {
  const report = validateApostilaStructure(content || '');
  const { stats } = report;

  const sectionsOk = stats.h2Count >= 4 && stats.h2Count <= 8;
  const wordsOk = stats.words >= 800 && stats.words <= 3500;
  const exercisesOk = exerciseCount >= 5;
  const materialsOk = materialCount >= 1;

  const allOk = sectionsOk && wordsOk && exercisesOk && materialsOk;

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border/60 bg-muted/30 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 mr-2">
        {allOk ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        )}
        <span className="text-xs font-semibold">
          {allOk ? 'Pronta para publicar' : 'Pendências detectadas'}
        </span>
      </div>

      <Chip ok={sectionsOk} icon={FileText} label={`${stats.h2Count} seções`} />
      <Chip ok={wordsOk} icon={FileText} label={`${stats.words.toLocaleString('pt-BR')} palavras`} />
      <Chip ok={exercisesOk} icon={ListChecks} label={`${exerciseCount} exercícios`} onClick={onFocusExercises} />
      <Chip ok={materialsOk} icon={Paperclip} label={`${materialCount} materiais`} onClick={onFocusMaterials} />

      <div className="ml-auto flex items-center gap-2">
        {saving && <span className="text-[10px] text-muted-foreground animate-pulse">Salvando…</span>}
        {!saving && lastSavedAt && (
          <span className="text-[10px] text-muted-foreground">
            Salvo {lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {onTogglePublish && (
          <Button size="sm" variant={published ? 'secondary' : 'default'} className="h-7 gap-1.5 text-xs" onClick={onTogglePublish}>
            {published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            {published ? 'Publicada' : 'Rascunho'}
          </Button>
        )}
      </div>
    </div>
  );
}
