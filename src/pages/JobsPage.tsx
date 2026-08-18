import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Briefcase, MapPin, ExternalLink, Building2, GraduationCap } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string | null;
  type: 'job' | 'internship' | 'freelance';
  salary_range: string | null;
  application_link: string;
  published_at: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      setJobs(data as Job[]);
    } catch (err) {
      console.error('Erro ao buscar vagas:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(search.toLowerCase()) || 
    job.company_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-display font-black tracking-tight flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            Vagas e Oportunidades
          </h1>
          <p className="text-muted-foreground">Encontre as melhores vagas de emprego e estágio curadas pela Decode Academy.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por cargo ou empresa..." 
            className="pl-10 rounded-xl bg-card/50 border-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-card animate-pulse rounded-2xl border border-border" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 bg-card/50 rounded-3xl border border-dashed border-border">
            <p className="text-muted-foreground">Nenhuma vaga encontrada para sua busca no momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map(job => (
              <Card key={job.id} className="group border-primary/10 bg-card/40 backdrop-blur-sm hover:border-primary/40 hover:bg-card/60 transition-all rounded-2xl overflow-hidden">
                <CardContent className="p-5 flex items-center gap-5">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {job.company_logo_url ? (
                      <img src={job.company_logo_url} alt={job.company_name} className="h-full w-full object-contain" />
                    ) : (
                      <Building2 className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg leading-tight truncate">{job.title}</h3>
                      <Badge variant={job.type === 'internship' ? 'secondary' : 'default'} className="text-[10px] uppercase font-black tracking-tighter shrink-0">
                        {job.type === 'internship' ? 'Estágio' : 'Efetivo'}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {job.company_name}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location || 'Remoto'}
                      </div>
                      {job.salary_range && (
                        <div className="font-mono text-[11px] text-primary/80">
                          {job.salary_range}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="shrink-0 rounded-xl gap-2 border-primary/30 hover:bg-primary hover:text-primary-foreground group-hover:border-primary transition-all"
                    onClick={() => window.open(job.application_link, '_blank')}
                  >
                    Candidatar-se
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
