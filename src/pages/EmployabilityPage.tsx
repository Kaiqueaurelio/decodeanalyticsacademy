import { useEffect, useMemo, useRef, useState } from 'react';
import { BriefcaseBusiness, CheckCircle2, Download, FileText, Github, Linkedin, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { downloadResumePdf, emptyResumeData, type ResumeData, type ResumeProject } from '@/lib/student-resume';

type ResumeRow = { id: string; title: string; target_role: string | null; data: ResumeData; status: 'draft' | 'ready'; updated_at: string };
const DRAFT_KEY = 'decode-employability-resume-draft-v1';

const guidance = [
  'Use projetos reais da faculdade, do GitHub ou pessoais. A Ella não inventa experiências.',
  'Explique o que você fez, qual problema resolveu e quais tecnologias utilizou.',
  'Para estágio, valorize formação, projetos, cursos e vontade de aprender.',
];

export default function EmployabilityPage() {
  const { user } = useAuth();
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState('Estágio em Desenvolvimento de Software');
  const [data, setData] = useState<ResumeData>(emptyResumeData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const dirtyRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const completion = useMemo(() => {
    const items = [data.fullName, data.email, targetRole, data.summary, data.education, data.skills, data.projects[0]?.name];
    return Math.round((items.filter((item) => item?.trim()).length / items.length) * 100);
  }, [data, targetRole]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      const { data: rows, error } = await (supabase as any).from('student_resumes')
        .select('id,title,target_role,data,status,updated_at').order('updated_at', { ascending: false }).limit(1);
      if (!active) return;
      if (error) {
        const local = window.localStorage.getItem(DRAFT_KEY);
        if (local) {
          try { const draft = JSON.parse(local); setData({ ...emptyResumeData(), ...draft.data }); setTargetRole(draft.targetRole || targetRole); toast.info('Rascunho local recuperado.'); } catch { /* ignora backup inválido */ }
        }
      } else if (rows?.[0]) {
        const row = rows[0] as ResumeRow;
        setResumeId(row.id); setTargetRole(row.target_role || targetRole); setData({ ...emptyResumeData(), ...row.data }); setLastSaved(new Date(row.updated_at));
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [user]);

  const update = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
    dirtyRef.current = true;
    setData((current) => ({ ...current, [key]: value }));
  };

  const save = async (manual = false) => {
    if (!user || !dirtyRef.current) { if (manual) toast.info('Nenhuma alteração pendente.'); return true; }
    setSaving(true);
    const payload = { user_id: user.id, title: `Currículo — ${data.fullName.trim() || 'rascunho'}`, target_role: targetRole.trim() || null, data, status: completion >= 70 ? 'ready' : 'draft' };
    const query = resumeId
      ? (supabase as any).from('student_resumes').update(payload).eq('id', resumeId).select('id,updated_at').single()
      : (supabase as any).from('student_resumes').insert(payload).select('id,updated_at').single();
    const { data: saved, error } = await query;
    setSaving(false);
    if (error) {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, targetRole, savedAt: new Date().toISOString() }));
      toast.error('Não foi possível sincronizar agora. Seu rascunho está protegido neste dispositivo.');
      return false;
    }
    setResumeId(saved.id); dirtyRef.current = false; window.localStorage.removeItem(DRAFT_KEY); setLastSaved(new Date(saved.updated_at));
    if (manual) toast.success('Currículo salvo com segurança.');
    return true;
  };

  useEffect(() => {
    if (loading || !dirtyRef.current) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => { void save(); }, 1200);
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, targetRole, savedAt: new Date().toISOString() }));
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [data, targetRole, loading]);

  const addProject = () => update('projects', [...data.projects, { name: '', description: '', technologies: '', link: '' }]);
  const editProject = (index: number, key: keyof ResumeProject, value: string) => update('projects', data.projects.map((project, i) => i === index ? { ...project, [key]: value } : project));
  const removeProject = (index: number) => update('projects', data.projects.filter((_, i) => i !== index));

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 pb-12">
      <section className="rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div><div className="mb-3 flex items-center gap-2 text-cyan-200"><Sparkles className="h-5 w-5" /> Ella · Inteligência da Empregabilidade</div><h1 className="text-2xl font-bold sm:text-3xl">Construa um currículo que abre portas.</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">Dados reais, apresentação profissional e uma versão em PDF pronta para enviar.</p></div>
          <Button onClick={() => void save(true)} disabled={saving} className="gap-2 bg-cyan-300 text-slate-950 hover:bg-cyan-200"><FileText className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar rascunho'}</Button>
        </div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-cyan-300 transition-all" style={{ width: `${completion}%` }} /></div><p className="mt-2 text-xs text-slate-300">Perfil de currículo: {completion}% completo {lastSaved && `· salvo às ${lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <Card className="p-5"><h2 className="mb-4 flex items-center gap-2 font-semibold"><BriefcaseBusiness className="h-5 w-5 text-primary" /> Seu objetivo</h2><Label htmlFor="target-role">Qual vaga você procura?</Label><Input id="target-role" className="mt-2" value={targetRole} onChange={(e) => { dirtyRef.current = true; setTargetRole(e.target.value); }} placeholder="Ex.: Estágio em Desenvolvimento de Software" /></Card>
          <Card className="p-5"><h2 className="mb-4 font-semibold">Dados de contato</h2><div className="grid gap-4 sm:grid-cols-2"><Field label="Nome completo" value={data.fullName} onChange={(v) => update('fullName', v)} /><Field label="E-mail profissional" value={data.email} onChange={(v) => update('email', v)} type="email" /><Field label="Telefone" value={data.phone} onChange={(v) => update('phone', v)} /><Field label="Cidade / Estado" value={data.city} onChange={(v) => update('city', v)} /><Field label="LinkedIn" value={data.linkedin} onChange={(v) => update('linkedin', v)} icon={<Linkedin className="h-4 w-4" />} /><Field label="GitHub" value={data.github} onChange={(v) => update('github', v)} icon={<Github className="h-4 w-4" />} /></div></Card>
          <Card className="space-y-4 p-5"><h2 className="font-semibold">O que a Ella precisa saber</h2><TextField label="Resumo profissional" value={data.summary} onChange={(v) => update('summary', v)} hint="Ex.: estudante de Ciência da Computação interessado em desenvolvimento web, com prática em projetos acadêmicos." /><TextField label="Formação acadêmica" value={data.education} onChange={(v) => update('education', v)} hint="Ex.: Bacharelado em Ciência da Computação — 6º semestre." /><TextField label="Competências" value={data.skills} onChange={(v) => update('skills', v)} hint="Ex.: JavaScript, TypeScript, React, SQL, Git." /><TextField label="Cursos e certificações" value={data.courses} onChange={(v) => update('courses', v)} /><TextField label="Idiomas" value={data.languages} onChange={(v) => update('languages', v)} /></Card>
          <Card className="p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Projetos que comprovam seu conhecimento</h2><Button variant="outline" size="sm" className="gap-1" onClick={addProject}><Plus className="h-4 w-4" /> Projeto</Button></div>{data.projects.map((project, index) => <div key={index} className="mb-4 space-y-3 rounded-xl border p-4"><div className="flex justify-between gap-3"><Input value={project.name} onChange={(e) => editProject(index, 'name', e.target.value)} placeholder="Nome do projeto" /><Button variant="ghost" size="icon" onClick={() => removeProject(index)} aria-label="Remover projeto"><Trash2 className="h-4 w-4 text-destructive" /></Button></div><TextArea value={project.description} onChange={(v) => editProject(index, 'description', v)} placeholder="O que você fez e qual problema resolveu?" /><Input value={project.technologies} onChange={(e) => editProject(index, 'technologies', e.target.value)} placeholder="Tecnologias utilizadas" /><Input value={project.link} onChange={(e) => editProject(index, 'link', e.target.value)} placeholder="Link do GitHub ou demonstração" /></div>)}{!data.projects.length && <p className="text-sm text-muted-foreground">Adicione projetos reais da faculdade, do GitHub ou pessoais.</p>}</Card>
        </div>
        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start"><Card className="p-5"><h2 className="font-semibold">Orientação da Ella</h2><ul className="mt-3 space-y-3 text-sm text-muted-foreground">{guidance.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />{item}</li>)}</ul></Card><Card className="p-5"><h2 className="font-semibold">Prévia profissional</h2><p className="mt-3 text-xl font-bold">{data.fullName || 'Seu nome'}</p><p className="mt-1 text-sm text-primary">{targetRole || 'Objetivo profissional'}</p><p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">{data.summary || 'Seu resumo profissional aparecerá aqui.'}</p><div className="mt-5 border-t pt-4"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Competências</p><p className="mt-1 text-sm">{data.skills || 'Adicione suas competências'}</p></div><Button className="mt-6 w-full gap-2" onClick={() => downloadResumePdf(data, targetRole)} disabled={!data.fullName.trim()}><Download className="h-4 w-4" /> Baixar currículo em PDF</Button>{!data.fullName.trim() && <p className="mt-2 text-center text-xs text-muted-foreground">Preencha seu nome para liberar o PDF.</p>}</Card></aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', icon }: { label: string; value: string; onChange: (value: string) => void; type?: string; icon?: React.ReactNode }) { return <div><Label>{label}</Label><div className="relative mt-2">{icon && <span className="absolute left-3 top-3 text-muted-foreground">{icon}</span>}<Input className={icon ? 'pl-9' : ''} type={type} value={value} onChange={(e) => onChange(e.target.value)} /></div></div>; }
function TextArea({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) { return <textarea className="mt-2 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />; }
function TextField({ label, value, onChange, hint }: { label: string; value: string; onChange: (value: string) => void; hint?: string }) { return <div><Label>{label}</Label><TextArea value={value} onChange={onChange} placeholder={hint} /></div>; }
