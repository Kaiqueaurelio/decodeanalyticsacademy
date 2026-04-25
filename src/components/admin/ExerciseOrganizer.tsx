import { useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Trash2, GripVertical, ArrowDownToLine, Save, Plus, ImagePlus, FileText, Calculator, Network, Code2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Tables } from '@/integrations/supabase/types';

type Exercise = Tables<'exercises'>;

const QUESTION_TYPES: { value: string; label: string; icon: any; isEssay: boolean }[] = [
  { value: 'objective', label: 'Objetiva (múltipla escolha)', icon: FileText, isEssay: false },
  { value: 'essay', label: 'Dissertativa textual', icon: FileText, isEssay: true },
  { value: 'calculation', label: 'Cálculo / Matemática manuscrita', icon: Calculator, isEssay: true },
  { value: 'graph', label: 'Grafo / Árvore / BFS-DFS / Busca', icon: Network, isEssay: true },
  { value: 'algorithm', label: 'Teste de mesa / Pseudocódigo / Código manuscrito', icon: Code2, isEssay: true },
];

const isEssayType = (t: string | null | undefined) =>
  QUESTION_TYPES.find((q) => q.value === t)?.isEssay ?? false;

export const isEssayExercise = (ex: Pick<Exercise, 'question_type' | 'correct_answer' | 'options'>) => {
  if (ex.question_type) return isEssayType(ex.question_type);
  if (ex.correct_answer === 'dissertativa') return true;
  const opts = Array.isArray(ex.options) ? (ex.options as unknown[]) : [];
  return opts.length === 0;
};

/**
 * Reordena uma lista de exercícios garantindo que as dissertativas (qualquer tipo
 * que exija upload de imagem ou texto livre) sempre fiquem por último.
 */
export function pushEssaysToEnd(list: Exercise[]): Exercise[] {
  const objective = list.filter((e) => !isEssayExercise(e));
  const essays = list.filter((e) => isEssayExercise(e));
  return [...objective, ...essays];
}

interface SortableRowProps {
  ex: Exercise;
  index: number;
  onChange: (patch: Partial<Exercise>) => void;
  onDelete: () => void;
}

function SortableRow({ ex, index, onChange, onDelete }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ex.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  const essay = isEssayExercise(ex);
  const expected = (ex.expected_answer as any) || {};

  const updateExpected = (patch: Record<string, any>) => {
    onChange({ expected_answer: { ...expected, ...patch } as any });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-border/60 rounded-lg p-3 bg-card/40 backdrop-blur-sm space-y-2"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Arrastar para reordenar"
          className="mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-muted-foreground">#{index + 1}</span>
            <Badge variant={essay ? 'default' : 'secondary'} className="text-[9px]">
              {QUESTION_TYPES.find((q) => q.value === ex.question_type)?.label.split(' (')[0] || 'Objetiva'}
            </Badge>
            {essay && ex.allow_image_upload && (
              <Badge variant="outline" className="text-[9px] gap-1">
                <ImagePlus className="h-2.5 w-2.5" /> Foto
              </Badge>
            )}
          </div>
          <p className="text-xs mt-1 line-clamp-2 break-words">{ex.question}</p>
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>

      {/* Editor inline */}
      <div className="space-y-2 pt-1 pl-6">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Tipo</Label>
            <Select
              value={ex.question_type || 'objective'}
              onValueChange={(v) => {
                const newEssay = isEssayType(v);
                onChange({
                  question_type: v,
                  allow_image_upload: newEssay && (v === 'calculation' || v === 'graph' || v === 'algorithm'),
                  // Se virou dissertativa, marca correct_answer como tal
                  correct_answer: newEssay ? 'dissertativa' : (ex.correct_answer === 'dissertativa' ? 'A' : ex.correct_answer),
                });
              }}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((qt) => (
                  <SelectItem key={qt.value} value={qt.value} className="text-xs">{qt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {essay && (
            <div className="flex items-center justify-end gap-2">
              <Label className="text-[10px] text-muted-foreground">Permitir foto da resolução</Label>
              <Switch
                checked={!!ex.allow_image_upload}
                onCheckedChange={(v) => onChange({ allow_image_upload: v })}
              />
            </div>
          )}
        </div>

        <Textarea
          value={ex.question}
          onChange={(e) => onChange({ question: e.target.value })}
          rows={2}
          className="text-xs"
          placeholder="Enunciado"
        />

        {!essay ? (
          <>
            {(Array.isArray(ex.options) ? (ex.options as string[]) : []).map((opt, oi) => (
              <div key={oi} className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono w-5">{String.fromCharCode(65 + oi)}</span>
                <Input
                  value={opt}
                  onChange={(e) => {
                    const next = [...(ex.options as string[])];
                    next[oi] = e.target.value;
                    onChange({ options: next as any });
                  }}
                  className="h-7 text-xs"
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Gabarito</Label>
                <Select
                  value={ex.correct_answer || 'A'}
                  onValueChange={(v) => onChange({ correct_answer: v })}
                >
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D'].map((l) => (
                      <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2 border-l-2 border-primary/30 pl-2">
            <div>
              <Label className="text-[10px]">Gabarito descritivo (texto livre)</Label>
              <Textarea
                value={expected.description || ex.reference_answer || ex.explanation || ''}
                onChange={(e) => updateExpected({ description: e.target.value })}
                rows={2}
                className="text-xs"
                placeholder="Ex: Caminho A→C→F com custo total 12. Use Dijkstra."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Resultado numérico (opcional)</Label>
                <Input
                  type="number"
                  step="any"
                  value={expected.expected_result ?? ''}
                  onChange={(e) =>
                    updateExpected({ expected_result: e.target.value === '' ? null : Number(e.target.value) })
                  }
                  className="h-7 text-xs"
                  placeholder="ex: 12"
                />
              </div>
              <div>
                <Label className="text-[10px]">Tolerância ± (opcional)</Label>
                <Input
                  type="number"
                  step="any"
                  value={expected.tolerance ?? ''}
                  onChange={(e) =>
                    updateExpected({ tolerance: e.target.value === '' ? null : Number(e.target.value) })
                  }
                  className="h-7 text-xs"
                  placeholder="ex: 0.5"
                />
              </div>
            </div>
            {(ex.question_type === 'graph' || ex.question_type === 'algorithm') && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">Caminho/algoritmo esperado</Label>
                  <Input
                    value={expected.expected_path || ''}
                    onChange={(e) => updateExpected({ expected_path: e.target.value })}
                    className="h-7 text-xs"
                    placeholder="ex: A→C→F"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Algoritmo</Label>
                  <Input
                    value={expected.algorithm || ''}
                    onChange={(e) => updateExpected({ algorithm: e.target.value })}
                    className="h-7 text-xs"
                    placeholder="ex: Dijkstra, BFS, gulosa"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ExerciseOrganizerProps {
  apostilaId: string;
  exercises: Exercise[];
  onSaved: () => void;
}

export function ExerciseOrganizer({ apostilaId, exercises, onSaved }: ExerciseOrganizerProps) {
  const sorted = useMemo(
    () => [...exercises].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [exercises],
  );
  const [items, setItems] = useState<Exercise[]>(sorted);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Reset quando os exercises externos mudarem (após reload)
  useMemo(() => {
    setItems(sorted);
    setDirty(false);
  }, [sorted]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIdx = prev.findIndex((i) => i.id === active.id);
      const newIdx = prev.findIndex((i) => i.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      return arrayMove(prev, oldIdx, newIdx);
    });
    setDirty(true);
  };

  const handlePushEssaysEnd = () => {
    setItems((prev) => pushEssaysToEnd(prev));
    setDirty(true);
    toast.success('Dissertativas movidas para o final');
  };

  const updateItem = useCallback((id: string, patch: Partial<Exercise>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? ({ ...it, ...patch } as Exercise) : it)));
    setDirty(true);
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    if (!confirm('Excluir este exercício?')) return;
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
    toast.success('Excluído');
    onSaved();
  }, [onSaved]);

  const handleSave = async () => {
    setSaving(true);
    // Aplica regra obrigatória: dissertativas SEMPRE no final
    const finalOrder = pushEssaysToEnd(items);

    try {
      // Atualiza cada um (sort_order + campos editados)
      const updates = finalOrder.map((it, idx) =>
        supabase
          .from('exercises')
          .update({
            sort_order: idx + 1,
            question: it.question,
            options: it.options as any,
            correct_answer: it.correct_answer,
            question_type: it.question_type,
            expected_answer: it.expected_answer as any,
            allow_image_upload: it.allow_image_upload,
            type: isEssayExercise(it) ? 'essay' : 'objective',
          })
          .eq('id', it.id),
      );
      const results = await Promise.all(updates);
      const failed = results.filter((r) => r.error).length;
      if (failed > 0) {
        toast.error(`${failed} exercício(s) com erro ao salvar`);
      } else {
        toast.success('Ordem e edições salvas!');
        setDirty(false);
        onSaved();
      }
    } catch (e: any) {
      toast.error('Erro: ' + (e.message || 'desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  if (items.length === 0) {
    return (
      <p className="text-center text-xs text-muted-foreground py-4">
        Nenhum exercício ainda. Adicione abaixo.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap text-[11px]">
        <Badge variant="outline" className="gap-1">
          <GripVertical className="h-3 w-3" /> Arraste para reordenar
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={handlePushEssaysEnd}
          className="h-7 text-[10px] gap-1"
        >
          <ArrowDownToLine className="h-3 w-3" /> Dissertativas pro fim
        </Button>
        <div className="ml-auto" />
        {dirty && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-7 text-[10px] gap-1 gradient-primary text-primary-foreground"
          >
            <Save className="h-3 w-3" /> {saving ? 'Salvando…' : 'Salvar ordem & edições'}
          </Button>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((ex, idx) => (
              <SortableRow
                key={ex.id}
                ex={ex}
                index={idx}
                onChange={(patch) => updateItem(ex.id, patch)}
                onDelete={() => deleteItem(ex.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <p className="text-[10px] text-muted-foreground text-center pt-1">
        💡 Ao salvar, questões dissertativas serão automaticamente movidas para o final.
      </p>
    </div>
  );
}
