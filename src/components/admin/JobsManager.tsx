import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Briefcase, Plus, Trash2, Edit, ExternalLink, Building2, MapPin, Loader2, FileUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { parseAndImportJobsFromMd } from '@/lib/jobs-importer';

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  description: string;
  requirements: string | null;
  location: string | null;
  type: 'job' | 'internship' | 'freelance';
  salary_range: string | null;
  application_link: string;
  is_active: boolean;
  published_at: string;
}

export default function JobsManager() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Partial<Job> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importContent, setImportContent] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setJobs(data as Job[]);
    } catch (err) {
      toast.error('Erro ao carregar vagas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingJob?.title || !editingJob?.company_name || !editingJob?.application_link) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      if (editingJob.id) {
        const { error } = await supabase
          .from('jobs')
          .update(editingJob)
          .eq('id', editingJob.id);
        if (error) throw error;
        toast.success('Vaga atualizada com sucesso');
      } else {
        const { error } = await supabase
          .from('jobs')
          .insert([editingJob as any]);
        if (error) throw error;
        toast.success('Vaga criada com sucesso');

      }
      setIsDialogOpen(false);
      fetchJobs();
    } catch (err) {
      toast.error('Erro ao salvar vaga');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta vaga?')) return;
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Vaga excluída');
      fetchJobs();
    } catch (err) {
      toast.error('Erro ao excluir vaga');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Gestor de Vagas e Estágios
          </h2>
          <p className="text-muted-foreground text-sm">Publique oportunidades de carreira para os alunos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsImportDialogOpen(true)} 
            className="rounded-xl gap-2 border-primary/20 hover:bg-primary/5"
          >
            <FileUp className="h-4 w-4" /> Importar MD
          </Button>
          <Button onClick={() => { setEditingJob({ type: 'job', is_active: true }); setIsDialogOpen(true); }} className="rounded-xl gap-2">
            <Plus className="h-4 w-4" /> Nova Vaga
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map(job => (
            <Card key={job.id} className="border-primary/10 bg-card/50 overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant={job.is_active ? 'default' : 'secondary'} className="text-[9px] uppercase tracking-wider">
                    {job.is_active ? 'Ativa' : 'Inativa'}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingJob(job); setIsDialogOpen(true); }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(job.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-base mt-2 truncate">{job.title}</CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-xs">
                  <Building2 className="h-3 w-3" /> {job.company_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs space-y-3">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {job.location || 'Remoto'}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] py-0">{job.type === 'internship' ? 'Estágio' : 'Emprego'}</Badge>
                  {job.salary_range && <span className="text-primary/70 font-mono">{job.salary_range}</span>}
                </div>
                <Button variant="link" className="p-0 h-auto text-[11px] text-accent gap-1" onClick={() => window.open(job.application_link, '_blank')}>
                  Ver link de candidatura <ExternalLink className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingJob?.id ? 'Editar Vaga' : 'Nova Oportunidade'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Título do Cargo *</Label>
              <Input value={editingJob?.title || ''} onChange={e => setEditingJob({...editingJob, title: e.target.value})} placeholder="Ex: Desenvolvedor Front-end" />
            </div>
            <div className="space-y-2">
              <Label>Nome da Empresa *</Label>
              <Input value={editingJob?.company_name || ''} onChange={e => setEditingJob({...editingJob, company_name: e.target.value})} placeholder="Ex: Decode Analytics" />
            </div>
            <div className="space-y-2">
              <Label>Logo da Empresa (URL)</Label>
              <Input value={editingJob?.company_logo_url || ''} onChange={e => setEditingJob({...editingJob, company_logo_url: e.target.value})} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Localização</Label>
              <Input value={editingJob?.location || ''} onChange={e => setEditingJob({...editingJob, location: e.target.value})} placeholder="Ex: São Paulo, SP ou Remoto" />
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={editingJob?.type} onValueChange={v => setEditingJob({...editingJob, type: v as any})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="job">Emprego (CLT/PJ)</SelectItem>
                  <SelectItem value="internship">Estágio</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Faixa Salarial</Label>
              <Input value={editingJob?.salary_range || ''} onChange={e => setEditingJob({...editingJob, salary_range: e.target.value})} placeholder="Ex: R$ 3.000 - R$ 5.000" />
            </div>
            <div className="col-span-full space-y-2">
              <Label>Link de Candidatura *</Label>
              <Input value={editingJob?.application_link || ''} onChange={e => setEditingJob({...editingJob, application_link: e.target.value})} placeholder="LinkedIn, Gupy ou Site da Empresa" />
            </div>
            <div className="col-span-full space-y-2">
              <Label>Descrição da Vaga *</Label>
              <Textarea value={editingJob?.description || ''} onChange={e => setEditingJob({...editingJob, description: e.target.value})} className="h-32" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingJob?.id ? 'Atualizar' : 'Publicar Vaga'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-primary" />
              Importação em Lote (MD)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cole abaixo o conteúdo em Markdown. Cada vaga deve começar com <code className="text-primary font-bold">## Título</code>. 
                O sistema tentará extrair Empresa, Local, Tipo, Link e Salário automaticamente.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Conteúdo Markdown</Label>
              <Textarea 
                value={importContent} 
                onChange={e => setImportContent(e.target.value)} 
                placeholder="## Desenvolvedor Fullstack&#10;Empresa: Decode Analytics&#10;Link: https://decode.com/vaga&#10;..."
                className="h-64 font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsImportDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={async () => {
                if (!importContent.trim()) return;
                setIsImporting(true);
                try {
                  const imported = await parseAndImportJobsFromMd(importContent);
                  if (imported.length > 0) {
                    toast.success(`${imported.length} vagas importadas com sucesso!`);
                    setIsImportDialogOpen(false);
                    setImportContent('');
                    fetchJobs();
                  } else {
                    toast.error("Nenhuma vaga válida encontrada no conteúdo.");
                  }
                } catch (err) {
                  toast.error("Erro ao processar importação.");
                } finally {
                  setIsImporting(false);
                }
              }} 
              disabled={isImporting || !importContent.trim()}
              className="gap-2"
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Importar Vagas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
