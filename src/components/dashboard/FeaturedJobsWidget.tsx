import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Building2, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export function FeaturedJobsWidget() {
  const navigate = useNavigate();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['featured-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 min
  });

  if (isLoading || jobs.length === 0) return null;

  const topJob = jobs[0];

  return (
    <div className="space-y-4">
      {/* Top Hero Card (Compact) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-none transition-all hover:border-primary/30"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted border border-border">
            {topJob.company_logo_url ? (
              <img src={topJob.company_logo_url} alt={topJob.company_name} className="h-8 w-8 object-contain" />
            ) : (
              <Briefcase className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Oportunidade em Destaque
              </span>
              <Badge variant="outline" className="text-[9px] border-primary/20 bg-primary/5">
                {topJob.type === 'internship' ? 'Estágio' : 'Efetivo'}
              </Badge>
            </div>
            <h3 className="mt-1 text-lg font-bold leading-tight truncate">{topJob.title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {topJob.company_name}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {topJob.location || 'Remoto'}
              </div>
              {topJob.salary_range && (
                <div className="font-mono text-primary/80 font-semibold tracking-tighter">
                  {topJob.salary_range}
                </div>
              )}
            </div>
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            className="rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => navigate('/vagas')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </motion.div>

      {/* Secondary List (if more than 1) */}
      {jobs.length > 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {jobs.slice(1).map((job) => (
            <Card 
              key={job.id} 
              className="group border-border bg-card transition-all hover:border-primary/30 cursor-pointer rounded-xl shadow-none"
              onClick={() => navigate('/vagas')}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 border border-border group-hover:border-primary/20 transition-colors">
                  <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold truncate leading-none">{job.title}</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">{job.company_name} · {job.location || 'Remoto'}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
