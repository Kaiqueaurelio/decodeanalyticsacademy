import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Eye, Lock, Database, Trash2, Shield } from 'lucide-react';

const sections = [
  {
    title: '1. Coleta de Dados',
    icon: <Database className="h-5 w-5" />,
    content: 'Coletamos apenas informações essenciais para sua experiência acadêmica: nome (para personalização), e-mail/RA (para acesso), progresso em disciplinas (apostilas lidas e exercícios feitos) e logs de segurança para proteção da sua conta.',
  },
  {
    title: '2. Uso das Informações',
    icon: <Eye className="h-5 w-5" />,
    content: 'Seus dados são usados para: gerar seu mapa de calor de estudos, calcular seu nível de experiência (XP), enviar notificações sobre atualizações importantes e melhorar a inteligência da assistente Ella baseada no que os alunos mais estudam.',
  },
  {
    title: '3. Proteção e Segurança',
    icon: <Lock className="h-5 w-5" />,
    content: 'Utilizamos tecnologias de ponta (Supabase/PostgreSQL) com criptografia e políticas de segurança rigorosas (RLS). Ninguém, exceto você, tem acesso direto às suas anotações privadas ou histórico detalhado de navegação interna.',
  },
  {
    title: '4. Compartilhamento',
    icon: <ShieldCheck className="h-5 w-5" />,
    content: 'NÃO vendemos nem compartilhamos seus dados pessoais com terceiros para fins de marketing. Dados anônimos e agregados podem ser usados internamente para entender quais matérias precisam de mais conteúdo.',
  },
  {
    title: '5. Controle e Exclusão',
    icon: <Trash2 className="h-5 w-5" />,
    content: 'Você tem controle total sobre seus dados. A qualquer momento, você pode solicitar a exportação ou exclusão permanente de sua conta e todos os dados associados através do nosso canal de suporte na aba Comunidade.',
  },
];

export default function TransparencyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-background relative">
      <Watermark />
      <AppHeader />

      <main className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-20 pt-5 sm:px-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Button>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary" /> Compromisso de Transparência
          </div>
        </div>

        <section className="mb-6 rounded-2xl border border-border bg-card/80 p-5 shadow-sm sm:p-7">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Transparência e Dados
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Na Decode Analytics Academy, sua privacidade é levada a sério. Saiba exatamente como tratamos suas informações e como garantimos sua segurança digital.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="rounded-xl border border-border/70 bg-card/70 p-5 transition-all hover:border-primary/30">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border text-primary/80">
                {section.icon}
              </div>
              <h2 className="text-base font-bold text-foreground">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground/90">{section.content}</p>
            </article>
          ))}
          
          <article className="sm:col-span-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 mt-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Ainda tem dúvidas?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Nossa equipe está disponível para detalhar qualquer processo técnico. Entre em contato através da <button onClick={() => navigate('/community')} className="text-primary font-bold hover:underline">Comunidade</button> e teremos o prazer de ajudar.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
