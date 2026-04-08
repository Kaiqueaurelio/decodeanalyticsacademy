import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Eye, EyeOff, BookOpen, FileText, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Apostila = Tables<'apostilas'>;
type Exercise = Tables<'exercises'>;

const CATEGORIES = ['Redes', 'IA', 'Segurança', 'Cloud', 'Programação', 'Outros'];

export default function AdminPage() {
  const { user } = useAuth();
  const [apostilas, setApostilas] = useState<Apostila[]>([]);
  const [exercises, setExercises] = useState<Record<string, Exercise[]>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [showExerciseDialog, setShowExerciseDialog] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Outros');
  const [newSourceType, setNewSourceType] = useState('manual');
  const [newLink, setNewLink] = useState('');
  const [creating, setCreating] = useState(false);

  const [exQuestion, setExQuestion] = useState('');
  const [exOptions, setExOptions] = useState(['', '', '', '']);
  const [exCorrect, setExCorrect] = useState('A');
  const [exExplanation, setExExplanation] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const { data: ap } = await supabase.from('apostilas').select('*').order('created_at', { ascending: false });
    setApostilas(ap || []);
    const { data: ex } = await supabase.from('exercises').select('*');
    const map: Record<string, Exercise[]> = {};
    ex?.forEach(e => {
      if (!map[e.apostila_id]) map[e.apostila_id] = [];
      map[e.apostila_id].push(e);
    });
    setExercises(map);
  };

  const createApostila = async () => {
    if (!newTitle.trim() || !user) return;
    setCreating(true);
    const { error } = await supabase.from('apostilas').insert({
      title: newTitle,
      content: newContent,
      category: newCategory,
      source_type: newSourceType,
      file_url: newLink || null,
      created_by: user.id,
      published: false,
    });
    setCreating(false);
    if (error) { toast.error('Erro ao criar apostila'); return; }
    toast.success('Apostila criada!');
    setShowCreate(false);
    setNewTitle(''); setNewContent(''); setNewLink('');
    loadAll();
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from('apostilas').update({ published: !current }).eq('id', id);
    toast.success(!current ? 'Apostila publicada!' : 'Apostila ocultada!');
    loadAll();
  };

  const deleteApostila = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta apostila?')) return;
    await supabase.from('apostilas').delete().eq('id', id);
    toast.success('Apostila excluída');
    loadAll();
  };

  const addExercise = async () => {
    if (!showExerciseDialog || !exQuestion.trim()) return;
    const { error } = await supabase.from('exercises').insert({
      apostila_id: showExerciseDialog,
      question: exQuestion,
      options: exOptions,
      correct_answer: exCorrect,
      explanation: exExplanation || null,
    });
    if (error) { toast.error('Erro ao criar exercício'); return; }
    toast.success('Exercício adicionado!');
    setExQuestion(''); setExOptions(['', '', '', '']); setExExplanation('');
    loadAll();
  };

  const deleteExercise = async (id: string) => {
    await supabase.from('exercises').delete().eq('id', id);
    toast.success('Exercício excluído');
    loadAll();
  };

  const totalApostilas = apostilas.length;
  const published = apostilas.filter(a => a.published).length;
  const totalExercises = Object.values(exercises).flat().length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Painel Admin</h1>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="mr-1.5 h-4 w-4" /> Nova Apostila</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Criar Apostila</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tipo de entrada</Label>
                  <Select value={newSourceType} onValueChange={setNewSourceType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Texto manual</SelectItem>
                      <SelectItem value="link">Link (URL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newSourceType === 'link' && (
                  <div>
                    <Label>URL</Label>
                    <Input value={newLink} onChange={e => setNewLink(e.target.value)} placeholder="https://..." />
                  </div>
                )}
                <div><Label>Título</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Título da apostila" /></div>
                <div><Label>Categoria</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Conteúdo</Label><Textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={10} placeholder="Cole ou digite o conteúdo..." /></div>
                <Button onClick={createApostila} disabled={creating} className="w-full gradient-primary text-primary-foreground">
                  {creating ? 'Criando...' : 'Criar Apostila'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 grid-cols-3 mb-8">
          {[
            { icon: BookOpen, label: 'Apostilas', value: totalApostilas },
            { icon: Eye, label: 'Publicadas', value: published },
            { icon: FileText, label: 'Exercícios', value: totalExercises },
          ].map(s => (
            <Card key={s.label} className="glass p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent p-2.5"><s.icon className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {apostilas.map(a => (
            <Card key={a.id} className="glass p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{a.title}</h3>
                    <span className="text-xs rounded-full bg-accent px-2 py-0.5">{a.category}</span>
                    {a.published ? (
                      <span className="text-xs rounded-full bg-success/20 text-success px-2 py-0.5 font-medium">Publicada</span>
                    ) : (
                      <span className="text-xs rounded-full bg-destructive/20 text-destructive px-2 py-0.5 font-medium">Oculta</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{a.content?.substring(0, 100)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{exercises[a.id]?.length || 0} exercícios</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={a.published ? 'destructive' : 'default'}
                    onClick={() => togglePublish(a.id, a.published)}
                    className="min-w-[100px]"
                  >
                    {a.published ? <><EyeOff className="mr-1.5 h-3.5 w-3.5" /> Ocultar</> : <><Eye className="mr-1.5 h-3.5 w-3.5" /> Publicar</>}
                  </Button>
                  <Dialog open={showExerciseDialog === a.id} onOpenChange={(v) => setShowExerciseDialog(v ? a.id : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline"><PenLine className="mr-1.5 h-3.5 w-3.5" /> Exercícios</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>Exercícios — {a.title}</DialogTitle></DialogHeader>
                      {exercises[a.id]?.map((ex, i) => (
                        <div key={ex.id} className="border rounded-lg p-3 mb-2 text-sm">
                          <div className="flex justify-between items-start">
                            <p className="font-medium">{i + 1}. {ex.question}</p>
                            <Button size="sm" variant="ghost" onClick={() => deleteExercise(ex.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Resposta: {ex.correct_answer}</p>
                        </div>
                      ))}
                      <div className="border-t pt-4 space-y-3">
                        <p className="font-semibold text-sm">Novo exercício</p>
                        <Textarea value={exQuestion} onChange={e => setExQuestion(e.target.value)} placeholder="Pergunta" rows={2} />
                        {exOptions.map((o, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-sm font-medium w-6">{String.fromCharCode(65 + i)})</span>
                            <Input value={o} onChange={e => { const n = [...exOptions]; n[i] = e.target.value; setExOptions(n); }} placeholder={`Opção ${String.fromCharCode(65 + i)}`} />
                          </div>
                        ))}
                        <div><Label>Resposta correta</Label>
                          <Select value={exCorrect} onValueChange={setExCorrect}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{['A','B','C','D'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div><Label>Explicação (opcional)</Label><Textarea value={exExplanation} onChange={e => setExExplanation(e.target.value)} rows={2} /></div>
                        <Button onClick={addExercise} className="w-full">Adicionar exercício</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="ghost" onClick={() => deleteApostila(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
