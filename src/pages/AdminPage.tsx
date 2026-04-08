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
  Link as LinkIcon, Loader2, AlertCircle, Edit
} from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Apostila = Tables<'apostilas'>;
type Exercise = Tables<'exercises'>;

const CATEGORIES = ['Redes', 'IA', 'Segurança', 'Cloud', 'Programação', 'Banco de Dados', 'Sistemas Operacionais', 'Outros'];

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

  const [importUrl, setImportUrl] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importTopic, setImportTopic] = useState('');
  const [importContent, setImportContent] = useState('');
  const [importExercises, setImportExercises] = useState<any[]>([]);
  const [cloning, setCloning] = useState(false);
  const [importStep, setImportStep] = useState<'url' | 'review'>('url');

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualContent, setManualContent] = useState('');

  const [exQuestion, setExQuestion] = useState('');
  const [exOptions, setExOptions] = useState(['', '', '', '']);
  const [exCorrect, setExCorrect] = useState('A');
  const [exExplanation, setExExplanation] = useState('');

  const [editingApostila, setEditingApostila] = useState<Apostila | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');

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

  const handleExtract = async () => {
    if (!importUrl.trim()) return;
    setCloning(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-content', {
        body: { url: importUrl.trim() },
      });
      if (error) throw error;
      setImportTitle(data.title || '');
      setImportTopic(data.category || 'Geral');
      setImportContent(data.content || '');
      setImportExercises(data.exercises || []);
      setImportStep('review');
      toast.success(data.exercises?.length > 0
        ? `Conteúdo extraído com ${data.exercises.length} exercícios!`
        : 'Conteúdo extraído!');
    } catch (err: any) {
      toast.error('Erro ao extrair: ' + (err.message || 'Tente novamente'));
    }
    setCloning(false);
  };

  const handleSaveImport = async () => {
    if (!importTitle.trim() || !user) return;
    setCloning(true);
    try {
      const { data: newApostila, error } = await supabase.from('apostilas').insert({
        title: importTitle.trim(), content: importContent,
        category: importTopic || 'Geral', source_type: 'link',
        file_url: importUrl, created_by: user.id, published: false,
      }).select().single();
      if (error) throw error;
      if (importExercises.length > 0 && newApostila) {
        await supabase.from('exercises').insert(importExercises.map(ex => ({
          apostila_id: newApostila.id, question: ex.question,
          options: ex.options, correct_answer: ex.correct_answer,
          explanation: ex.explanation || null,
        })));
      }
      toast.success(`Apostila salva com ${importExercises.length} exercícios!`);
      resetImportForm();
      loadAll();
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err.message || 'Tente novamente'));
    }
    setCloning(false);
  };

  const handleManualSave = async () => {
    if (!manualTitle.trim() || !user) return;
    const { error } = await supabase.from('apostilas').insert({
      title: manualTitle.trim(), content: manualContent,
      category: manualCategory || 'Geral', source_type: 'manual',
      created_by: user.id, published: false,
    });
    if (error) { toast.error('Erro ao criar'); return; }
    toast.success('Apostila criada!');
    setManualTitle(''); setManualContent(''); setManualCategory('');
    setShowManualForm(false);
    loadAll();
  };

  const resetImportForm = () => {
    setImportUrl(''); setImportTitle(''); setImportTopic('');
    setImportContent(''); setImportExercises([]); setImportStep('url');
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from('apostilas').update({ published: !current }).eq('id', id);
    toast.success(!current ? 'Apostila publicada!' : 'Apostila ocultada!');
    loadAll();
  };

  const deleteApostila = async (id: string) => {
    if (!confirm('Excluir esta apostila e seus exercícios?')) return;
    await supabase.from('exercises').delete().eq('apostila_id', id);
    await supabase.from('apostilas').delete().eq('id', id);
    toast.success('Apostila excluída');
    loadAll();
  };

  const handleEditSave = async () => {
    if (!editingApostila) return;
    await supabase.from('apostilas').update({
      title: editTitle, content: editContent, category: editCategory,
    }).eq('id', editingApostila.id);
    toast.success('Apostila atualizada!');
    setEditingApostila(null);
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
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/40">
        <div className="container px-4">
          {/* Top header row */}
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground smooth-all">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="rounded-lg bg-primary p-2 shrink-0">
                <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold truncate">Painel Administrativo</h1>
                <p className="text-[10px] text-muted-foreground leading-none">Decode Analytics</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setTab('apostilas')} className="text-xs h-8 gap-1.5 shrink-0">
              <BookOpen className="h-3.5 w-3.5" /> Apostilas
            </Button>
          </div>

          {/* Tabs row */}
          <div className="flex gap-0 border-t border-border/30 overflow-x-auto hide-scrollbar">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap smooth-all border-b-2 ${
                  tab === t.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container py-5 px-4 animate-content-show">
        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid gap-3 grid-cols-2">
              {[
                { icon: BookOpen, label: 'Apostilas', value: totalApostilas, sub: `${published} publicadas`, color: 'text-primary' },
                { icon: PenLine, label: 'Exercícios', value: totalExercises, sub: 'cadastrados', color: 'text-primary' },
                { icon: CheckCircle, label: 'Respostas', value: totalAnswers, sub: `${correctAnswers} corretas`, color: 'text-success' },
                { icon: TrendingUp, label: 'Aproveit.', value: `${approvalRate}%`, sub: 'geral', color: 'text-warning' },
              ].map(s => (
                <Card key={s.label} className="p-4 bg-card border border-border/50">
                  <div className="rounded-lg bg-accent p-2 w-fit mb-2">
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label} · {s.sub}</p>
                </Card>
              ))}
            </div>

            <Card className="p-4 bg-card border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">Taxa de acerto geral</p>
                <span className="text-sm font-bold text-primary">{approvalRate}%</span>
              </div>
              <Progress value={approvalRate} className="h-2 mb-2" />
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
                  <Card key={a.id} className="p-3 bg-card border border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${a.published ? 'bg-success' : 'bg-muted-foreground'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-[10px] text-muted-foreground">{a.category} · {exercises[a.id]?.length || 0} exercícios</p>
                      </div>
                    </div>
                    <Badge variant={a.published ? 'default' : 'secondary'} className={`text-[10px] shrink-0 ${a.published ? 'bg-success/15 text-success border-0' : ''}`}>
                      {a.published ? 'Publicada' : 'Oculta'}
                    </Badge>
                  </Card>
                ))}
                {apostilas.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma apostila criada.</p>}
              </div>
            </div>

            <Card className="p-4 bg-card border border-border/50">
              <h3 className="font-semibold text-sm mb-3">Ações Rápidas</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => setTab('apostilas')} className="justify-start text-xs">
                  <LinkIcon className="mr-1.5 h-3.5 w-3.5" /> Importar URL
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setTab('apostilas'); setShowManualForm(true); }} className="justify-start text-xs">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Criar Manual
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTab('exercises')} className="justify-start text-xs">
                  <PenLine className="mr-1.5 h-3.5 w-3.5" /> Exercícios
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTab('materials')} className="justify-start text-xs">
                  <Upload className="mr-1.5 h-3.5 w-3.5" /> Materiais
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Apostilas Tab */}
        {tab === 'apostilas' && (
          <div className="space-y-5">
            {/* Import Card */}
            <Card className="p-5 bg-card border border-border/50 border-t-4 border-t-primary">
              <h3 className="font-semibold flex items-center gap-2 mb-1 text-sm">
                <LinkIcon className="h-4 w-4 text-primary" /> Importar Apostila
              </h3>

              {importStep === 'url' ? (
                <div className="space-y-3 mt-3">
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
                        onClick={handleExtract}
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
              ) : (
                <div className="space-y-3 mt-3">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-success/10 text-success text-xs">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Conteúdo extraído! Revise antes de salvar.</span>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Título</Label>
                    <Input value={importTitle} onChange={e => setImportTitle(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Categoria</Label>
                    <Select value={importTopic} onValueChange={setImportTopic}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Conteúdo</Label>
                    <Textarea value={importContent} onChange={e => setImportContent(e.target.value)} rows={6} className="mt-1 text-xs" />
                  </div>

                  {importExercises.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {importExercises.length} exercícios gerados
                      </Label>
                      <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                        {importExercises.map((ex, i) => (
                          <div key={i} className="border border-border/50 rounded-lg p-3 text-xs">
                            <p className="font-medium">{i + 1}. {ex.question}</p>
                            <div className="mt-1 space-y-0.5 text-muted-foreground">
                              {ex.options?.map((opt: string, oi: number) => (
                                <p key={oi} className={String.fromCharCode(65 + oi) === ex.correct_answer ? 'text-success font-medium' : ''}>
                                  {String.fromCharCode(65 + oi)}) {opt}
                                </p>
                              ))}
                            </div>
                            <button
                              className="mt-1 text-[10px] text-destructive hover:underline"
                              onClick={() => setImportExercises(prev => prev.filter((_, idx) => idx !== i))}
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={resetImportForm}>Cancelar</Button>
                    <Button
                      className="flex-1 gradient-primary text-primary-foreground"
                      onClick={handleSaveImport}
                      disabled={cloning || !importTitle.trim()}
                    >
                      {cloning && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                      Salvar {importExercises.length > 0 && `+ ${importExercises.length} ex.`}
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Manual create */}
            {showManualForm && (
              <Card className="p-5 bg-card border border-border/50 animate-card-enter">
                <h3 className="font-semibold flex items-center gap-2 mb-3 text-sm">
                  <FileText className="h-4 w-4 text-primary" /> Criar Manualmente
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Título</Label>
                    <Input value={manualTitle} onChange={e => setManualTitle(e.target.value)} placeholder="Ex: Redes de Computadores" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Categoria</Label>
                    <Select value={manualCategory} onValueChange={setManualCategory}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Conteúdo</Label>
                    <Textarea value={manualContent} onChange={e => setManualContent(e.target.value)} rows={5} className="mt-1" placeholder="Cole ou digite o conteúdo..." />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowManualForm(false)}>Cancelar</Button>
                    <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleManualSave} disabled={!manualTitle.trim()}>Criar</Button>
                  </div>
                </div>
              </Card>
            )}

            {!showManualForm && (
              <Button variant="outline" className="w-full text-xs" onClick={() => setShowManualForm(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Criar Manualmente
              </Button>
            )}

            {/* Apostilas List */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Apostilas ({totalApostilas})
              </h3>
              <div className="space-y-2">
                {apostilas.map(a => {
                  const exCount = exercises[a.id]?.length || 0;
                  return (
                    <Card key={a.id} className="p-3 bg-card border border-border/50">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${a.published ? 'bg-success' : 'bg-muted-foreground'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">{a.title}</h4>
                            <Badge className={`text-[10px] shrink-0 h-5 ${a.published ? 'bg-success/15 text-success border-0' : 'bg-muted text-muted-foreground border-0'}`}>
                              {a.published ? 'Publicada' : 'Oculta'}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {a.file_url && <span className="truncate inline-block max-w-[120px] align-bottom">{a.file_url}</span>}
                            {a.file_url && ' · '}
                            {new Date(a.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="outline"
                            className={`h-8 w-8 ${a.published ? 'text-destructive border-destructive/30 hover:bg-destructive/10' : 'text-success border-success/30 hover:bg-success/10'}`}
                            onClick={() => togglePublish(a.id, a.published)}
                          >
                            {a.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingApostila(a);
                              setEditTitle(a.title);
                              setEditContent(a.content || '');
                              setEditCategory(a.category);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => deleteApostila(a.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                {apostilas.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhuma apostila criada.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Exercise Dialog */}
            {apostilas.map(a => (
              <Dialog key={a.id} open={showExerciseDialog === a.id} onOpenChange={(v) => setShowExerciseDialog(v ? a.id : null)}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle className="text-base">Exercícios — {a.title}</DialogTitle></DialogHeader>
                  {exercises[a.id]?.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Nenhum exercício.
                    </div>
                  )}
                  {exercises[a.id]?.map((ex, i) => (
                    <div key={ex.id} className="border border-border/50 rounded-lg p-3 mb-2 text-sm">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-xs">{i + 1}. {ex.question}</p>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => deleteExercise(ex.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                      {Array.isArray(ex.options) && (ex.options as string[]).map((opt, oi) => (
                        <p key={oi} className={`text-[11px] mt-0.5 ${String.fromCharCode(65 + oi) === ex.correct_answer ? 'text-success font-medium' : 'text-muted-foreground'}`}>
                          {String.fromCharCode(65 + oi)}) {opt}
                        </p>
                      ))}
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
                    <div><Label className="text-xs">Resposta correta</Label>
                      <Select value={exCorrect} onValueChange={setExCorrect}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{['A','B','C','D'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs">Explicação (opcional)</Label><Textarea value={exExplanation} onChange={e => setExExplanation(e.target.value)} rows={2} /></div>
                    <Button onClick={() => {
                      if (!exQuestion.trim()) return;
                      supabase.from('exercises').insert({
                        apostila_id: a.id, question: exQuestion,
                        options: exOptions, correct_answer: exCorrect,
                        explanation: exExplanation || null,
                      }).then(({ error }) => {
                        if (error) { toast.error('Erro'); return; }
                        toast.success('Exercício adicionado!');
                        setExQuestion(''); setExOptions(['', '', '', '']); setExExplanation('');
                        loadAll();
                      });
                    }} className="w-full gradient-primary text-primary-foreground">Adicionar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            ))}

            {/* Edit Dialog */}
            <Dialog open={!!editingApostila} onOpenChange={(v) => !v && setEditingApostila(null)}>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-base">Editar Apostila</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label className="text-xs">Título</Label><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} /></div>
                  <div><Label className="text-xs">Categoria</Label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Conteúdo</Label><Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={8} /></div>
                  <Button className="w-full gradient-primary text-primary-foreground" onClick={handleEditSave}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Exercises Tab */}
        {tab === 'exercises' && (
          <div className="space-y-5">
            <Card className="p-5 bg-card border border-border/50">
              <h3 className="font-semibold text-sm mb-3">Selecionar Apostila</h3>
              <Select value={selectedApostila} onValueChange={setSelectedApostila}>
                <SelectTrigger><SelectValue placeholder="Selecione uma apostila" /></SelectTrigger>
                <SelectContent>
                  {apostilas.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title} ({exercises[a.id]?.length || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>

            {selectedApostila && (
              <>
                {(exercises[selectedApostila]?.length || 0) === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Nenhum exercício.
                  </div>
                )}
                {exercises[selectedApostila]?.map((ex, i) => (
                  <Card key={ex.id} className="p-4 bg-card border border-border/50">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">{i + 1}. {ex.question}</p>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteExercise(ex.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                    {Array.isArray(ex.options) && (ex.options as string[]).map((opt, oi) => (
                      <p key={oi} className={`text-xs mt-0.5 ${String.fromCharCode(65 + oi) === ex.correct_answer ? 'text-success font-medium' : 'text-muted-foreground'}`}>
                        {String.fromCharCode(65 + oi)}) {opt}
                      </p>
                    ))}
                  </Card>
                ))}

                <Card className="p-5 bg-card border border-border/50 space-y-3">
                  <h3 className="font-semibold text-sm">Novo Exercício</h3>
                  <Textarea value={exQuestion} onChange={e => setExQuestion(e.target.value)} placeholder="Pergunta" rows={2} />
                  {exOptions.map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm font-medium w-6">{String.fromCharCode(65 + i)})</span>
                      <Input value={o} onChange={e => { const n = [...exOptions]; n[i] = e.target.value; setExOptions(n); }} placeholder={`Opção ${String.fromCharCode(65 + i)}`} />
                    </div>
                  ))}
                  <div><Label className="text-xs">Resposta correta</Label>
                    <Select value={exCorrect} onValueChange={setExCorrect}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['A','B','C','D'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Explicação (opcional)</Label><Textarea value={exExplanation} onChange={e => setExExplanation(e.target.value)} rows={2} /></div>
                  <Button onClick={addExercise} className="w-full gradient-primary text-primary-foreground">Adicionar</Button>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Materials Tab */}
        {tab === 'materials' && (
          <div className="space-y-4">
            <Card className="p-5 bg-card border border-border/50 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
              <h3 className="font-semibold text-sm mb-1">Materiais de Apoio</h3>
              <p className="text-xs text-muted-foreground">Em breve...</p>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
