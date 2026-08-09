
import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  ListChecks, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  Layout
} from 'lucide-react';
import { validateApostilaStructure } from '@/lib/apostilaValidation';
import { cn } from '@/lib/utils';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface FinalReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  content: string;
  exerciseCount: number;
  materialCount: number;
}

export function FinalReviewDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  content,
  exerciseCount,
  materialCount
}: FinalReviewDialogProps) {
  const { playSound } = useSoundEffects();
  const report = validateApostilaStructure(content || '');
  const { stats } = report;

  // Checklist items state
  const [checklist, setChecklist] = useState({
    structure: false,
    glossary: false,
    exercises: false,
    materials: false
  });

  // Auto-check based on logic, but allow manual override
  useEffect(() => {
    if (open) {
      setChecklist({
        structure: stats.h2Count >= 4,
        glossary: content.toLowerCase().includes('glossário') || content.toLowerCase().includes('termos'),
        exercises: exerciseCount >= 5,
        materials: materialCount >= 1
      });
    }
  }, [open, stats.h2Count, content, exerciseCount, materialCount]);

  const allChecked = Object.values(checklist).every(Boolean);

  const handleConfirm = () => {
    playSound('success');
    onConfirm();
    onOpenChange(false);
  };

  const toggleItem = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    playSound('click');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0A0A0F] border-cyan-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-cyan-400">
            <CheckCircle2 className="h-5 w-5" />
            Revisão Final da Apostila
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Verifique os itens abaixo antes de publicar "{title}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div 
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer",
              checklist.structure ? "bg-emerald-500/5 border-emerald-500/20" : "bg-zinc-900/50 border-zinc-800"
            )}
            onClick={() => toggleItem('structure')}
          >
            <div className="mt-1">
              <Checkbox checked={checklist.structure} onCheckedChange={() => toggleItem('structure')} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 font-medium text-sm">
                <Layout className="h-4 w-4 text-cyan-500" />
                Estrutura ({stats.h2Count} seções)
              </div>
              <p className="text-xs text-zinc-500">Mínimo sugerido de 4 seções (H2).</p>
            </div>
          </div>

          <div 
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer",
              checklist.glossary ? "bg-emerald-500/5 border-emerald-500/20" : "bg-zinc-900/50 border-zinc-800"
            )}
            onClick={() => toggleItem('glossary')}
          >
            <div className="mt-1">
              <Checkbox checked={checklist.glossary} onCheckedChange={() => toggleItem('glossary')} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 font-medium text-sm">
                <BookOpen className="h-4 w-4 text-purple-500" />
                Glossário / Termos
              </div>
              <p className="text-xs text-zinc-500">Aumenta a qualidade acadêmica do material.</p>
            </div>
          </div>

          <div 
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer",
              checklist.exercises ? "bg-emerald-500/5 border-emerald-500/20" : "bg-zinc-900/50 border-zinc-800"
            )}
            onClick={() => toggleItem('exercises')}
          >
            <div className="mt-1">
              <Checkbox checked={checklist.exercises} onCheckedChange={() => toggleItem('exercises')} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 font-medium text-sm">
                <ListChecks className="h-4 w-4 text-amber-500" />
                Questionário ({exerciseCount} exerc.)
              </div>
              <p className="text-xs text-zinc-500">Mínimo sugerido de 5 exercícios com gabarito.</p>
            </div>
          </div>

          <div 
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer",
              checklist.materials ? "bg-emerald-500/5 border-emerald-500/20" : "bg-zinc-900/50 border-zinc-800"
            )}
            onClick={() => toggleItem('materials')}
          >
            <div className="mt-1">
              <Checkbox checked={checklist.materials} onCheckedChange={() => toggleItem('materials')} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 font-medium text-sm">
                <FileText className="h-4 w-4 text-blue-500" />
                Materiais Complementares
              </div>
              <p className="text-xs text-zinc-500">{materialCount} arquivo(s) vinculado(s).</p>
            </div>
          </div>
        </div>

        {!allChecked && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Alguns itens ainda não atingiram o padrão ideal. Recomendamos revisar antes de tornar o material visível para os alunos.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-xs">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!allChecked}
            className={cn(
              "gap-2 text-xs",
              allChecked ? "bg-cyan-600 hover:bg-cyan-700" : "opacity-50"
            )}
          >
            Publicar Material
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
