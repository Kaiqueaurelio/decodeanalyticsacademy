import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, BookOpen, PenLine } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

export default function ApostilaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [apostila, setApostila] = useState<Tables<'apostilas'> | null>(null);
  const [exerciseCount, setExerciseCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    supabase.from('apostilas').select('*').eq('id', id).single().then(({ data }) => setApostila(data));
    supabase.from('exercises').select('id').eq('apostila_id', id).then(({ data }) => setExerciseCount(data?.length || 0));
  }, [id]);

  if (!apostila) return null;

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <AppHeader />
      <main className="container py-6 px-4 relative z-10 max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
        </Button>
        <Card className="p-6 sm:p-8 bg-card border border-border/50 animate-content-show">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-xl bg-accent p-2.5">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">{apostila.title}</h1>
              <span className="text-xs text-muted-foreground">{apostila.category}</span>
            </div>
          </div>
          <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-foreground leading-relaxed text-sm">
            {apostila.content}
          </div>
        </Card>
        {exerciseCount > 0 && (
          <div className="mt-5 text-center animate-content-show delay-1">
            <Button className="gradient-primary text-primary-foreground" onClick={() => navigate(`/exercises/${id}`)}>
              <PenLine className="mr-1.5 h-4 w-4" /> Fazer exercícios ({exerciseCount})
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
