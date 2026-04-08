import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, BookOpen } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

export default function ApostilaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [apostila, setApostila] = useState<Tables<'apostilas'> | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from('apostilas').select('*').eq('id', id).single().then(({ data }) => setApostila(data));
  }, [id]);

  if (!apostila) return null;

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <AppHeader />
      <main className="container py-8 relative z-10 max-w-4xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
        </Button>
        <Card className="glass p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-accent p-3"><BookOpen className="h-6 w-6 text-primary" /></div>
            <div>
              <h1 className="text-2xl font-bold">{apostila.title}</h1>
              <span className="text-xs text-muted-foreground">{apostila.category}</span>
            </div>
          </div>
          <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-foreground leading-relaxed">
            {apostila.content}
          </div>
        </Card>
        <div className="mt-6 text-center">
          <Button className="gradient-primary text-primary-foreground" onClick={() => navigate(`/exercises/${id}`)}>
            Fazer exercícios
          </Button>
        </div>
      </main>
    </div>
  );
}
