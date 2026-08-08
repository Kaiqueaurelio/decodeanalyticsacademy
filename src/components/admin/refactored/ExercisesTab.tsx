import React from 'react';
import { 
  Trash2, 
  PenTool, 
  FileText, 
  Loader2, 
  Wand2, 
  PenLine,
  AlertCircle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ExercisesTabProps {
  selectedApostila: string;
  setSelectedApostila: (v: string) => void;
  apostilas: any[];
  exercises: Record<string, any[]>;
  bulkExerciseMode: boolean;
  setBulkExerciseMode: (v: boolean) => void;
  exerciseDialogMode: 'individual' | 'bulk' | 'ai';
  setExerciseDialogMode: (v: 'individual' | 'bulk' | 'ai') => void;
  bulkExerciseText: string;
  setBulkExerciseText: (v: string) => void;
  bulkExerciseImporting: boolean;
  aiGenerating: boolean;
  setAiGenerating: (v: boolean) => void;
  aiExercises: any[];
  setAiExercises: (v: any[]) => void;
  exQuestion: string;
  setExQuestion: (v: string) => void;
  exOptions: string[];
  setExOptions: (v: string[]) => void;
  exCorrect: string;
  setExCorrect: (v: string) => void;
  exExplanation: string;
  setExExplanation: (v: string) => void;
  addExercise: () => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  handleBulkExerciseImport: () => Promise<void>;
  parseBulkExercises: (text: string) => any[];
  loadAll: () => void;
}

export function ExercisesTab(props: ExercisesTabProps) {
  const {
    selectedApostila, setSelectedApostila, apostilas, exercises,
    bulkExerciseMode, setBulkExerciseMode, exerciseDialogMode, setExerciseDialogMode,
    bulkExerciseText, setBulkExerciseText, bulkExerciseImporting,
    aiGenerating, setAiGenerating, aiExercises, setAiExercises,
    exQuestion, setExQuestion, exOptions, setExOptions, exCorrect, setExCorrect,
    exExplanation, setExExplanation, addExercise, deleteExercise,
    handleBulkExerciseImport, parseBulkExercises, loadAll
  } = props;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-3">Selecionar Apostila</h3>
          <Select value={selectedApostila} onValueChange={setSelectedApostila}>
            <SelectTrigger><SelectValue placeholder="Selecione uma apostila" /></SelectTrigger>
            <SelectContent>
              {apostilas.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.title} ({exercises[a.id]?.length || 0})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedApostila && (
        <>
          {(exercises[selectedApostila]?.length || 0) === 0 && !bulkExerciseMode && exerciseDialogMode !== 'ai' && (
            <div className="text-center py-10 text-muted-foreground">
              <PenTool className="h-10 w-10 mx-auto mb-3 opacity-25" strokeWidth={1.5} />
              <p className="text-sm">Nenhum exercício para esta apostila.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Gere com IA ou importe em lote.</p>
            </div>
          )}
          <div className="space-y-2">
            {exercises[selectedApostila]?.map((ex, i) => (
              <Card key={ex.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm flex-1">{i + 1}. {ex.question}</p>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => deleteExercise(ex.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  {Array.isArray(ex.options) && (ex.options as string[]).map((opt, oi) => (
                    <p key={oi} className={`text-xs mt-0.5 ${String.fromCharCode(65 + oi) === ex.correct_answer ? 'text-[hsl(var(--success))] font-medium' : 'text-muted-foreground'}`}>
                      {String.fromCharCode(65 + oi)}) {opt}
                    </p>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex bg-muted rounded-full p-0.5">
              {([['individual', 'Individual'], ['bulk', 'Lote'], ['ai', 'Assistente']] as [string, string][]).map(([mode, label]) => (
                <button key={mode} onClick={() => { 
                  setBulkExerciseMode(mode === 'bulk'); 
                  setExerciseDialogMode(mode as any); 
                }}
                  className={`text-[10px] font-medium px-3 py-1 rounded-full transition-colors ${
                    (mode === 'individual' && !bulkExerciseMode && exerciseDialogMode !== 'ai') ||
                    (mode === 'bulk' && bulkExerciseMode) ||
                    (mode === 'ai' && exerciseDialogMode === 'ai' && !bulkExerciseMode)
                      ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {bulkExerciseMode ? (
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Importar Exercícios em Lote
                </h3>
                <Textarea value={bulkExerciseText} onChange={e => setBulkExerciseText(e.target.value)}
                  placeholder="Cole aqui suas perguntas..." rows={12} className="font-mono text-xs" />
                <Button onClick={handleBulkExerciseImport} disabled={!bulkExerciseText.trim() || bulkExerciseImporting} className="w-full gradient-primary text-primary-foreground">
                  {bulkExerciseImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Importar Exercícios'}
                </Button>
              </CardContent>
            </Card>
          ) : exerciseDialogMode === 'ai' ? (
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-primary" /> Gerar com IA
                </h3>
                {(() => {
                  const apt = apostilas.find(a => a.id === selectedApostila);
                  if (!apt?.content?.trim()) return (
                    <div className="text-center py-6 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Esta apostila não tem conteúdo.</p>
                    </div>
                  );
                  if (aiExercises.length === 0) return (
                    <Button onClick={async () => {
                      setAiGenerating(true);
                      try {
                        const { data, error } = await supabase.functions.invoke('generate-exercises', {
                          body: { content: apt.content, title: apt.title, mcCount: 8, essayCount: 2 },
                        });
                        if (error) throw new Error(error.message);
                        setAiExercises(data.exercises);
                        toast.success(`${data.exercises.length} exercícios gerados!`);
                      } catch (err: any) { toast.error('Erro: ' + err.message); }
                      setAiGenerating(false);
                    }} disabled={aiGenerating} className="w-full gradient-primary text-primary-foreground">
                      {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gerar Exercícios com IA'}
                    </Button>
                  );
                  return (
                    <div className="space-y-4">
                      {aiExercises.map((ex, i) => (
                        <div key={i} className="border p-3 rounded-lg text-xs">
                          <p className="font-medium">{ex.question}</p>
                          <Button className="mt-2" variant="ghost" size="sm" onClick={async () => {
                            const { error } = await supabase.from('exercises').insert({
                              apostila_id: selectedApostila, ...ex
                            });
                            if (!error) {
                              setAiExercises(aiExercises.filter((_, idx) => idx !== i));
                              loadAll();
                              toast.success('Salvo!');
                            }
                          }}>Salvar</Button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-sm">Novo Exercício</h3>
                <Textarea value={exQuestion} onChange={e => setExQuestion(e.target.value)} placeholder="Pergunta" rows={2} />
                {exOptions.map((o, i) => (
                  <Input key={i} value={o} onChange={e => { const n = [...exOptions]; n[i] = e.target.value; setExOptions(n); }} placeholder={`Opção ${String.fromCharCode(65 + i)}`} />
                ))}
                <Select value={exCorrect} onValueChange={setExCorrect}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['A','B','C','D'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
                <Button onClick={addExercise} className="w-full gradient-primary text-primary-foreground">Adicionar</Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
