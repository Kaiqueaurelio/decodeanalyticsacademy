import { AppHeader } from '@/components/AppHeader';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, GraduationCap } from 'lucide-react';

export default function SupportProjectPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-2xl px-4 py-20 text-center">
        <GraduationCap className="mx-auto mb-6 h-16 w-16 text-primary" strokeWidth={1.5} />
        <h1 className="font-display text-4xl leading-tight">Projeto Educacional 100% Gratuito</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          A Decode Analytics Academy nasceu com o propósito de democratizar o acesso ao conhecimento acadêmico.
          Nossa plataforma é e continuará sendo gratuita para todos os alunos.
        </p>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Focamos na excelência acadêmica e no seu desenvolvimento profissional.
        </p>
        <div className="mt-10">
          <Button onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o Início
          </Button>
        </div>
      </main>
    </div>
  );
}
