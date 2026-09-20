import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BriefcaseBusiness, CheckCircle2, ChevronRight, ExternalLink, Filter, Loader2, MapPin, Save, Sparkles, Target, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type Job = {
  id: string;
  title: string;
  company_name: string;
  description: string;
  requirements: string | null;
  location: string | null;
  type: 'job' | 'internship' | 'freelance';
  salary_range: string | null;
  application_link: string | null;
};

type CareerProfile = {
  course: string;
  semester: string;
  experience_level: string;
  preferred_areas: string[];
  preferred_modalities: string[];
  preferred_periods: string[];
  city: string;
  state: string;
  remote_ok: boolean;
};

type Application = {
  id: string;
  job_id: string;
  status: string;
  applied_at: string | null;
};

const emptyProfile: CareerProfile = {
  course: 'Ciência da Computação',
  semester: '',
  experience_level: 'Sem experiência',
  preferred_areas: ['Desenvolvimento'],
  preferred_modalities: ['Remoto'],
  preferred_periods: ['Manhã'],
  city: '',
  state: 'SP',
  remote_ok: true,
};

const areas = ['Desenvolvimento', 'Dados', 'IA', 'Cyber Security', 'QA', 'DevOps', 'Suporte', 'Redes', 'Banco de Dados'];
const modalities = ['Remoto', 'Híbrido', 'Presencial'];
const periods = ['Manhã', 'Tarde', 'Noite'];
const statuses: Record<string, string> = {
  saved: 'Salva',
  applied: 'Currículo enviado',
  screening: 'Triagem',
  interview: 'Entrevista',
  offer: 'Proposta',
  rejected: 'Encerrada',
  hired: 'Contratado',
};

function scoreJob(job: Job, profile: CareerProfile) {
  const text = (job.title + ' ' + job.description + ' ' + (job.requirements || '')).toLowerCase();
  let score = 0;
  if (profile.course && /ci[eê]ncia da computa|engenharia da computa|sistemas de informa|an[aá]lise e desenvolvimento|tecnologia da informa/i.test(text)) score += 20;
  profile.preferred_areas.forEach((area) => { if (text.includes(area.toLowerCase().replace('cyber security', 'cyber'))) score += 20; });
  if (profile.experience_level === 'Sem experiência' && /est[aá]gio|trainee|sem experi[eê]ncia|j[uú]nior/i.test(text)) score += 30;
  if (profile.experience_level === 'Estágio' && /est[aá]gio/i.test(text)) score += 25;
  if (profile.remote_ok && /remoto|remote/i.test(text)) score += 15;
  const modalityPatterns: Record<string, RegExp> = {
    Remoto: /remoto|remote/i,
    Híbrido: /h[ií]brido|hybrid/i,
    Presencial: /presencial|on[- ]site/i,
  };
  profile.preferred_modalities.forEach((modality) => {
    if (modalityPatterns[modality]?.test(text)) score += 10;
  });
  if (profile.preferred_periods.includes('Manhã') && /manh[ãa]|08h|09h|10h|11h/i.test(text)) score += 15;
  if (profile.city && profile.city.trim() && text.includes(profile.city.toLowerCase())) score += 10;
  return Math.min(100, score);
}

export default function CareerHubPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<CareerProfile>(emptyProfile);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [profileResult, jobsResult, applicationsResult] = await Promise.all([
        (supabase as any).from('career_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        (supabase as any).from('jobs').select('id,title,company_name,description,requirements,location,type,salary_range,application_link').eq('is_active', true).order('published_at', { ascending: false }),
        (supabase as any).from('job_applications').select('id,job_id,status,applied_at').eq('user_id', user.id).order('updated_at', { ascending: false }),
      ]);
      if (!active) return;
      if (profileResult.data) setProfile({ ...emptyProfile, ...profileResult.data });
      if (jobsResult.error) {
        console.error('[CareerHubPage] Erro ao carregar vagas:', jobsResult.error);
        toast.error('Não foi possível carregar as vagas recomendadas.');
      } else {
        setJobs((jobsResult.data || []) as Job[]);
      }
      if (!applicationsResult.error) setApplications((applicationsResult.data || []) as Application[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user]);

  const recommendations = useMemo(() => jobs
    .map((job) => ({ job, score: scoreJob(job, profile) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8), [jobs, profile]);

  const trackedJobs = useMemo(() => {
    const byId = new Map(jobs.map((job) => [job.id, job]));
    return applications.map((application) => ({ application, job: byId.get(application.job_id) })).filter((item) => item.job);
  }, [applications, jobs]);

  const toggleArray = (key: 'preferred_areas' | 'preferred_modalities' | 'preferred_periods', value: string) => {
    setProfile((current) => {
      const currentValues = current[key];
      return { ...current, [key]: currentValues.includes(value) ? currentValues.filter((item) => item !== value) : [...currentValues, value] };
    });
  };

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await (supabase as any).from('career_profiles').upsert({ user_id: user.id, ...profile, updated_at: new Date().toISOString() });
    setSavingProfile(false);
    if (error) toast.error('Não foi possível salvar seu perfil de carreira.'); else toast.success('Perfil de carreira atualizado!');
  };

  const trackJob = async (job: Job, status = 'saved') => {
    if (!user) return;
    const existing = applications.find((item) => item.job_id === job.id);
    const { data, error } = await (supabase as any).from('job_applications').upsert({
      user_id: user.id,
      job_id: job.id,
      status,
      applied_at: status === 'applied' ? new Date().toISOString() : existing?.applied_at || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,job_id' }).select('id,job_id,status,applied_at').single();
    if (error) { toast.error('Não foi possível atualizar o acompanhamento.'); return; }
    setApplications((current) => [...current.filter((item) => item.job_id !== job.id), data as Application]);
    toast.success(status === 'saved' ? 'Vaga salva na sua carreira.' : 'Candidatura marcada como enviada.');
  };

  const removeTracking = async (jobId: string) => {
    if (!user) return;
    const { error } = await (supabase as any).from('job_applications').delete().eq('user_id', user.id).eq('job_id', jobId);
    if (error) { toast.error('Não foi possível remover a vaga.'); return; }
    setApplications((current) => current.filter((item) => item.job_id !== jobId));
    toast.success('Vaga removida das suas candidaturas.');
  };

  const openJob = (job: Job) => {
    if (!job.application_link) { toast.info('Esta vaga não possui um link de candidatura disponível.'); return; }
    window.open(job.application_link, '_blank', 'noopener,noreferrer');
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 pb-12">
      <section className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <Badge variant="secondary" className="mb-3 gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Central de Carreira</Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Do estudo para o mercado.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Monte seu perfil profissional, encontre oportunidades compatíveis e acompanhe cada candidatura em um só lugar.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/empregabilidade')} className="gap-2"><BriefcaseBusiness className="h-4 w-4" /> Meu currículo</Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ['Vagas acompanhadas', applications.length, Save],
          ['Em processo', applications.filter((a) => ['applied','screening','interview','offer'].includes(a.status)).length, Target],
          ['Entrevistas', applications.filter((a) => a.status === 'interview').length, CheckCircle2],
        ].map(([label, value, Icon]) => <Card key={String(label)} className="p-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Icon className="h-4 w-4" /></div><div><p className="text-xl font-bold">{String(value)}</p><p className="text-xs text-muted-foreground">{String(label)}</p></div></div></Card>)}
      </section>

      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 font-semibold"><UserRound className="h-5 w-5 text-primary" /> Meu perfil profissional</h2><p className="mt-1 text-xs text-muted-foreground">Essas preferências ajudam a ordenar as vagas mais relevantes para você.</p></div><Button onClick={saveProfile} disabled={savingProfile} size="sm">{savingProfile ? 'Salvando...' : 'Salvar perfil'}</Button></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><Label>Curso</Label><Input className="mt-2" value={profile.course} onChange={(e) => setProfile({ ...profile, course: e.target.value })} placeholder="Ciência da Computação" /></div>
          <div><Label>Semestre</Label><Input className="mt-2" value={profile.semester} onChange={(e) => setProfile({ ...profile, semester: e.target.value })} placeholder="Ex.: 5º" /></div>
          <div><Label>Nível</Label><select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={profile.experience_level} onChange={(e) => setProfile({ ...profile, experience_level: e.target.value })}><option>Sem experiência</option><option>Estágio</option><option>Júnior</option><option>Pleno</option><option>Sênior</option></select></div>
          <div><Label>Cidade</Label><Input className="mt-2" value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} placeholder="São Paulo" /></div>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <PreferenceGroup title="Áreas" values={areas} selected={profile.preferred_areas} onToggle={(v) => toggleArray('preferred_areas', v)} />
          <PreferenceGroup title="Modalidade" values={modalities} selected={profile.preferred_modalities} onToggle={(v) => toggleArray('preferred_modalities', v)} />
          <PreferenceGroup title="Horário" values={periods} selected={profile.preferred_periods} onToggle={(v) => toggleArray('preferred_periods', v)} />
        </div>
      </Card>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Vagas recomendadas para você</h2><p className="mt-1 text-xs text-muted-foreground">A ordem considera suas preferências e informações publicadas na vaga.</p></div><Button variant="ghost" size="sm" onClick={() => navigate('/vagas')} className="gap-1">Ver todas <ChevronRight className="h-4 w-4" /></Button></div>
        <div className="grid gap-4 lg:grid-cols-2">{recommendations.map(({ job, score }) => {
          const tracked = applications.find((item) => item.job_id === job.id);
          return <Card key={job.id} className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Badge variant="outline" className="mb-2 text-[10px]">{job.type === 'internship' ? 'Estágio' : job.type === 'job' ? 'Emprego' : 'Freelance'}</Badge><h3 className="font-bold leading-snug">{job.title}</h3><p className="mt-1 text-xs font-medium text-primary">{job.company_name}</p></div><Badge className="shrink-0">{score}% compatível</Badge></div><div className="mt-3 space-y-1.5 text-xs text-muted-foreground"><p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" />{job.location || 'Remoto'}</p><p>{job.salary_range || 'Salário a combinar'}</p></div><p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{job.description}</p><div className="mt-4 flex flex-wrap gap-2">{tracked ? <><Button size="sm" variant="secondary" onClick={() => openJob(job)} className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Abrir vaga</Button><Button size="sm" variant="outline" onClick={() => removeTracking(job.id)}>Remover acompanhamento</Button></> : <Button size="sm" onClick={() => trackJob(job)} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Salvar vaga</Button>}<Button size="sm" variant="outline" onClick={() => openJob(job)}>Candidatar-se</Button></div></Card>;
        })}</div>
      </section>

      <section>
        <div className="mb-4"><h2 className="text-xl font-bold">Minhas candidaturas</h2><p className="mt-1 text-xs text-muted-foreground">Acompanhe o caminho da vaga depois que você se candidatar.</p></div>
        {trackedJobs.length === 0 ? <Card className="p-8 text-center"><Filter className="mx-auto mb-3 h-8 w-8 text-primary/40" /><p className="text-sm font-medium">Nenhuma vaga acompanhada ainda.</p><p className="mt-1 text-xs text-muted-foreground">Salve uma vaga recomendada ou acompanhe uma oportunidade na área de vagas.</p></Card> : <div className="space-y-3">{trackedJobs.map(({ application, job }) => <Card key={application.id} className="p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div className="min-w-0"><h3 className="font-semibold">{job!.title}</h3><p className="text-xs text-primary">{job!.company_name}</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{statuses[application.status] || application.status}</Badge>{application.status === 'saved' && <Button size="sm" onClick={() => trackJob(job!, 'applied')}>Marcar como enviada</Button>}<Button size="sm" variant="outline" onClick={() => openJob(job!)}>Abrir vaga</Button><Button size="sm" variant="ghost" onClick={() => removeTracking(job!.id)}>Remover</Button></div></div></Card>)}</div>}
      </section>
    </div>
  );
}

function PreferenceGroup({ title, values, selected, onToggle }: { title: string; values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p><div className="flex flex-wrap gap-2">{values.map((value) => <button key={value} type="button" onClick={() => onToggle(value)} className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${selected.includes(value) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>{value}</button>)}</div></div>;
}
