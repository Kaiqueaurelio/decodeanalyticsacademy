import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { AdBanner } from '@/components/AdBanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BriefcaseBusiness, Building2, CheckCircle2, ExternalLink, Filter, Globe2, Loader2, MapPin, Search, Sparkles, WalletCards } from 'lucide-react';

type JobType = 'job' | 'internship' | 'freelance';
type Job = {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  description: string;
  requirements: string | null;
  location: string | null;
  type: JobType;
  salary_range: string | null;
  application_link: string | null;
  is_active: boolean;
  published_at: string | null;
};

const JOB_TYPE_LABELS: Record<JobType, string> = {
  job: 'Emprego',
  internship: 'Estágio',
  freelance: 'Freelance',
};

function isValidApplicationUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export default function JobsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | JobType>('all');
  const [selected, setSelected] = useState<Job | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const publicFields = 'id,title,company_name,company_logo_url,description,requirements,location,type,salary_range,is_active,published_at';
      const authenticatedFields = `${publicFields},application_link`;
      const result = user
        ? await (supabase as any)
            .from('jobs')
            .select(authenticatedFields)
            .eq('is_active', true)
            .order('published_at', { ascending: false })
        : await (supabase as any).rpc('get_public_jobs');

      if (cancelled) return;
      if (result.error) {
        console.error('[JobsPage] Erro ao carregar vagas:', result.error);
        setJobs([]);
      } else {
        const rows = (result.data || []) as Job[];
        setJobs(user ? rows : rows.map((job) => ({ ...job, application_link: null })));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!user) setSelected(null);
  }, [user]);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const searchable = `${job.title} ${job.company_name} ${job.description} ${job.requirements || ''} ${job.location || ''}`.toLowerCase();
      return (!normalizedQuery || searchable.includes(normalizedQuery)) && (typeFilter === 'all' || job.type === typeFilter);
    });
  }, [jobs, query, typeFilter]);

  const requireLogin = (action: 'details' | 'application') => {
    toast.info(action === 'details' ? 'Entre para ver os detalhes completos' : 'Entre para se candidatar', {
      description: 'As oportunidades ficam públicas; a autenticação é necessária para continuar.',
      action: {
        label: 'Entrar',
        onClick: () => navigate('/login', { state: { from: '/vagas', intendedAction: action } }),
      },
    });
  };

  const openApplication = (job: Job) => {
    if (!user) {
      requireLogin('application');
      return;
    }
    if (!isValidApplicationUrl(job.application_link)) {
      toast.error('Esta vaga não possui um link de candidatura válido no momento.');
      return;
    }
    window.open(job.application_link, '_blank', 'noopener,noreferrer');
  };

  const openDetails = (job: Job) => {
    if (!user) {
      requireLogin('details');
      return;
    }
    setSelected(job);
  };

  const stats = [
    { label: 'Oportunidades abertas', value: jobs.length, icon: BriefcaseBusiness },
    { label: 'Empresas divulgando', value: new Set(jobs.map((job) => job.company_name)).size, icon: Building2 },
    { label: 'Vagas de estágio', value: jobs.filter((job) => job.type === 'internship').length, icon: Globe2 },
  ];

  return (
    <div className="relative min-h-dvh bg-background selection:bg-primary/20">
      <Watermark />
      <AppHeader />
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-xs">Voltar</Button>
          <Badge variant="secondary" className="h-7 gap-1.5 px-3 text-[11px]"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Oportunidades profissionais</Badge>
        </div>
        <section className="mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-card/80 p-5 shadow-sm sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary"><BriefcaseBusiness className="h-3.5 w-3.5" /> Vagas para tecnologia</div>
              <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Encontre sua próxima oportunidade</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">Vagas de emprego, estágio e freelance para estudantes e profissionais de Ciência da Computação. A candidatura acontece diretamente no site oficial da empresa.</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/25 p-4"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p className="text-xs leading-5 text-muted-foreground">Confira os requisitos e clique em “Candidatar-se” para continuar no processo seletivo da empresa anunciante.</p></div></div>
          </div>
        </section>
        <div className="mb-6 grid gap-3 sm:grid-cols-3">{stats.map((stat) => <Card key={stat.label} className="rounded-xl border-border/70 bg-card/70 p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><stat.icon className="h-4 w-4" /></div><div><div className="text-xl font-bold leading-none">{stat.value}</div><div className="mt-1 text-xs text-muted-foreground">{stat.label}</div></div></div></Card>)}</div>
        <section className="mb-6 rounded-2xl border border-border/80 bg-card/70 p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Filter className="h-4 w-4 text-primary" /> Encontrar uma vaga</div>
          <div className="grid gap-3 md:grid-cols-[1fr_200px]">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cargo, empresa, local ou requisito" className="pl-9" /></div>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'all' | JobType)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">Todos os tipos</option>{Object.entries(JOB_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </div>
        </section>
        {loading ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando oportunidades...</div> : filteredJobs.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-14 text-center"><BriefcaseBusiness className="mx-auto mb-3 h-10 w-10 text-primary/40" /><p className="text-sm font-medium">Nenhuma vaga encontrada</p><p className="mt-1 text-xs text-muted-foreground">Tente mudar a busca ou volte mais tarde para conferir novas oportunidades.</p></div> : <section className="grid gap-4 lg:grid-cols-2">{filteredJobs.map((job) => <article key={job.id} className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm transition-colors hover:border-primary/35 sm:p-5"><div className="flex gap-3 sm:gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12">{job.company_logo_url ? <img src={job.company_logo_url} alt={job.company_name} className="h-10 w-10 rounded-lg object-contain sm:h-11 sm:w-11" /> : <BriefcaseBusiness className="h-5 w-5" />}</div><div className="min-w-0 flex-1 space-y-3"><div className="flex flex-wrap items-center gap-1.5"><Badge variant="outline" className="h-5 rounded-full px-2 text-[10px]">{JOB_TYPE_LABELS[job.type]}</Badge>{job.type === 'internship' && <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px]">Entrada para estudantes</Badge>}</div><div><h2 className="text-base font-bold leading-snug sm:text-lg">{job.title}</h2><p className="mt-1 text-xs font-medium text-primary">{job.company_name}</p></div><div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2"><span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" /> {job.location || 'Remoto'}</span><span className="inline-flex items-center gap-1.5"><WalletCards className="h-3.5 w-3.5 text-primary" /> {job.salary_range || 'Salário a combinar'}</span></div><p className="line-clamp-3 text-xs leading-5 text-muted-foreground sm:text-sm">{job.description}</p><div className="flex flex-wrap items-center gap-2 pt-1"><Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => openApplication(job)}><ExternalLink className="h-3.5 w-3.5" /> Candidatar-se</Button><Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openDetails(job)}>Saiba mais</Button></div></div></div></article>)}</section>}
        <div className="mt-8"><AdBanner position="inline" /></div>
      </main>
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">{selected && <><DialogHeader><DialogTitle className="pr-6 text-xl">{selected.title}</DialogTitle><p className="text-sm text-primary">{selected.company_name} · {selected.location || 'Remoto'}</p></DialogHeader><div className="space-y-4 text-sm"><div className="flex flex-wrap gap-2"><Badge variant="outline">{JOB_TYPE_LABELS[selected.type]}</Badge><Badge variant="outline">{selected.salary_range || 'Salário a combinar'}</Badge></div><Separator /><div className="whitespace-pre-wrap leading-6 text-muted-foreground">{selected.description}</div>{selected.requirements && <div><h3 className="mb-2 font-semibold text-foreground">Requisitos</h3><div className="whitespace-pre-wrap leading-6 text-muted-foreground">{selected.requirements}</div></div>}</div><DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>Fechar</Button><Button disabled={!isValidApplicationUrl(selected.application_link)} onClick={() => openApplication(selected)} className="gap-1.5"><ExternalLink className="h-4 w-4" /> Candidatar-se no site da empresa</Button></DialogFooter></>}</DialogContent></Dialog>
    </div>
  );
}
