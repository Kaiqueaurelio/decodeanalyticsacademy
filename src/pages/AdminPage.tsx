import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus, Trash2, Eye, EyeOff, BookOpen, FileText, PenLine, ArrowLeft,
  LayoutDashboard, CheckCircle, TrendingUp, Upload, BarChart3, Clock,
  Link as LinkIcon, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Apostila = Tables<'apostilas'>;
type Exercise = Tables<'exercises'>;

const CATEGORIES = ['Redes', 'IA', 'Segurança', 'Cloud', 'Programação', 'Outros'];

type Tab = 'overview' | 'apostilas' | 'exercises' | 'materials';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [apostilas, setApostilas] = useState<Apostila[]>([]);
  const [exercises, setExercises] = useState<Record<string, Exercise[]>>({});
  const [allAnswers, setAllAnswers] = useState<any[]>([]);
  const [showExerciseDialog, setShowExerciseDialog] = useState<string | null>(null);
  const [selectedApostila, setSelectedApostila] = useState('');

  // Import apostila form
  const [importUrl, setImportUrl] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importTopic, setImportTopic] = useState('');
  const [cloning, setCloning] = useState(false);

  // Exercise form
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
    const { data: ans } = await supabase.from('answers').select('*');
    setAllAnswers(ans || []);
  };

  const handleClone = async () => {
    if (!importUrl.trim() || !user) return;
    setCloning(true);
    try {
      // Try to fetch content from URL via edge function or direct
      const title = importTitle.trim() || importUrl;
      const category = importTopic.trim() || 'Geral';
      
      const { error } = await supabase.from('apostilas').insert({
        title,
        content: `Conteúdo importado de: ${importUrl}\n\n(O conteúdo será carregado automaticamente)`,
        category,
        source_type: 'link',
        file_url: importUrl,
        created_by: user.id,
        published: false,
      });
      if (error) throw error;
      toast.success('Apostila importada com sucesso!');
      setImportUrl(''); setImportTitle(''); setImportTopic('');
      loadAll();
    } catch (err: any) {
      toast.error('Erro ao importar: ' + (err.message || 'Tente novamente'));
    }
    setCloning(false);
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
    if (!selectedApostila || !exQuestion.trim()) return;
    const { error } = await supabase.from('exercises').insert({
      apostila_id: selectedApostila, question: exQuestion,
      options: exOptions, correct_answer: exCorrect,
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
  const totalAnswers = allAnswers.length;
  const correctAnswers = allAnswers.filter(a => a.is_correct).length;
  const approvalRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  const tabs = [
    { id: 'overview' as Tab, label: 'Visão Geral', icon: BarChart3 },
    { id: 'apostilas' as Tab, label: 'Apostilas', icon: BookOpen },
    { id: 'exercises' as Tab, label: 'Exercícios', icon: PenLine },
    { id: 'materials' as Tab, label: 'Materiais', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-6 sm:py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="rounded-xl bg-accent p-2.5 shrink-0">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">Painel Administrativo</h1>
              <p className="text-xs text-muted-foreground">Decode Analytics</p>
            </div>
          </div>
          <Button size="sm" className="gradient-primary text-primary-foreground shrink-0" onClick={() => setTab('apostilas')}>
            <BookOpen className="mr-1.5 h-4 w-4" /> Apostilas
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1 hide-scrollbar">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-4 grid-cols-2">
              {[
                { icon: BookOpen, label: 'Apostilas', value: totalApostilas, sub: `${published} publicadas`, color: 'text-primary' },
                { icon: PenLine, label: 'Exercícios', value: totalExercises, sub: 'cadastrados', color: 'text-primary' },
                { icon: CheckCircle, label: 'Respostas', value: totalAnswers, sub: `${correctAnswers} corretas`, color: 'text-success' },
                { icon: TrendingUp, label: 'Aproveitamento', value: `${approvalRate}%`, sub: 'geral dos alunos', color: 'text-warning' },
              ].map(s => (
                <Card key={s.label} className="glass p-4">
                  <div className={`rounded-lg bg-accent p-2 w-fit mb-3`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label} · {s.sub}</p>
                </Card>
              ))}
            </div>

            <Card className="glass p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">Taxa de acerto geral</p>
                <span className="text-sm font-bold text-primary">{approvalRate}%</span>
              </div>
              <Progress value={approvalRate} className="h-2.5 mb-2" />
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-success" /> {correctAnswers} acertos</span>
                <span className="flex items-center gap-1"><span className="h-3.5 w-3.5 rounded-full bg-destructive inline-block" /> {totalAnswers - correctAnswers} erros</span>
              </div>
            </Card>

            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Apostilas Recentes
              </h3>
              <div className="space-y-2">
                {apostilas.slice(0, 5).map(a => (
                  <Card key={a.id} className="glass p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <Badge variant={a.published ? 'default' : 'secondary'} className={`text-[10px] shrink-0 ${a.published ? 'bg-success/20 text-success border-0' : ''}`}>
                      {a.published ? 'Publicada' : 'Oculta'}
                    </Badge>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="glass p-4">
              <h3 className="font-semibold text-sm mb-3">Ações Rápidas</h3>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setTab('apostilas')}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Importar Apostila
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTab('exercises')}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar Exercício
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTab('materials')}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" /> Enviar Material
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Apostilas Tab */}
        {tab === 'apostilas' && (
          <div className="space-y-6">
            {/* Import Apostila Card */}
            <Card className="glass p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <LinkIcon className="h-4 w-4 text-primary" /> Importar Apostila
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Cole a URL da página</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={importUrl}
                      onChange={e => setImportUrl(e.target.value)}
                      placeholder="https://exemplo.com/apostila"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleClone}
                      disabled={cloning || !importUrl.trim()}
                      className="gradient-primary text-primary-foreground shrink-0"
                    >
                      {cloning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Clonar'}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Título (opcional)</Label>
                  <Input
                    value={importTitle}
                    onChange={e => setImportTitle(e.target.value)}
                    placeholder="Ex: Redes de Computadores - NP2"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tópico (para agrupar)</Label>
                  <Input
                    value={importTopic}
                    onChange={e => setImportTopic(e.target.value)}
                    placeholder="Ex: Redes, Banco de Dados"
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            {/* Apostilas List */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Apostilas ({totalApostilas})
              </h3>
              <div className="space-y-3">
                {apostilas.map(a => (
                  <Card key={a.id} className="glass p-4">
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${a.published ? 'bg-success' : 'bg-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm truncate max-w-[120px] sm:max-w-none">{a.title}</h4>
                          <Badge className={`text-[10px] shrink-0 ${a.published ? 'bg-success/20 text-success border-0' : 'bg-muted text-muted-foreground border-0'}`}>
                            {a.published ? 'Publicada' : 'Oculta'}
                          </Badge>
                        </div>
                        {a.file_url && <p className="text-[10px] text-muted-foreground truncate">{a.file_url}</p>}
                        <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePublish(a.id, a.published)}
                          className={`text-xs h-8 ${a.published ? 'text-destructive border-destructive/30 hover:bg-destructive/10' : 'text-success border-success/30 hover:bg-success/10'}`}
                        >
                          {a.published ? <><EyeOff className="mr-1 h-3.5 w-3.5" /> Ocultar</> : <><Eye className="mr-1 h-3.5 w-3.5" /> Publicar</>}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowExerciseDialog(a.id)}>
                          <PenLine className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteApostila(a.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Exercise Dialog */}
            {apostilas.map(a => (
              <Dialog key={a.id} open={showExerciseDialog === a.id} onOpenChange={(v) => setShowExerciseDialog(v ? a.id : null)}>
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
                    <Button onClick={() => {
                      if (!exQuestion.trim()) return;
                      supabase.from('exercises').insert({
                        apostila_id: a.id, question: exQuestion,
                        options: exOptions, correct_answer: exCorrect,
                        explanation: exExplanation || null,
                      }).then(({ error }) => {
                        if (error) { toast.error('Erro ao criar exercício'); return; }
                        toast.success('Exercício adicionado!');
                        setExQuestion(''); setExOptions(['', '', '', '']); setExExplanation('');
                        loadAll();
                      });
                    }} className="w-full">Adicionar exercício</Button>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}

        {/* Exercises Tab */}
        {tab === 'exercises' && (
          <div className="space-y-6">
            <Card className="glass p-5">
              <h3 className="font-semibold mb-4">Selecionar Apostila</h3>
              <Select value={selectedApostila} onValueChange={setSelectedApostila}>
                <SelectTrigger><SelectValue placeholder="Selecione uma apostila" /></SelectTrigger>
                <SelectContent>
                  {apostilas.map(a => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </Card>

            {selectedApostila && (
              <>
                {exercises[selectedApostila]?.map((ex, i) => (
                  <Card key={ex.id} className="glass p-4">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">{i + 1}. {ex.question}</p>
                      <Button size="sm" variant="ghost" onClick={() => deleteExercise(ex.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Resposta: {ex.correct_answer}</p>
                  </Card>
                ))}

                <Card className="glass p-5 space-y-4">
                  <h3 className="font-semibold text-sm">Novo Exercício</h3>
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
                  <Button onClick={addExercise} className="w-full gradient-primary text-primary-foreground">Adicionar exercício</Button>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Materials Tab */}
        {tab === 'materials' && (
          <div className="space-y-4">
            <Card className="glass p-5">
              <h3 className="font-semibold mb-4">Selecionar Apostila</h3>
              <Select value={selectedApostila} onValueChange={setSelectedApostila}>
                <SelectTrigger><SelectValue placeholder="Selecione uma apostila" /></SelectTrigger>
                <SelectContent>
                  {apostilas.map(a => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
