import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';

const sections = [
  {
    title: '1. Finalidade da plataforma',
    content:
      'A Decode Analytics Academy e uma plataforma educacional criada para apoiar estudantes com apostilas, exercicios, materiais de estudo, cursos gratuitos indicados, ferramentas de revisao e recursos de acompanhamento de progresso.',
  },
  {
    title: '2. Uso educacional',
    content:
      'O conteudo disponibilizado tem finalidade exclusivamente academica e informativa. A plataforma nao substitui aulas, orientacoes oficiais da faculdade, editais, regulamentos ou comunicados institucionais.',
  },
  {
    title: '3. Cursos e certificados',
    content:
      'Cursos gratuitos divulgados no app podem ser usados como apoio ou horas complementares apenas quando estiverem de acordo com as regras vigentes da faculdade. O aluno deve confirmar carga horaria, certificado, validade e criterios de aceite antes de enviar qualquer comprovante.',
  },
  {
    title: '4. Responsabilidade do usuario',
    content:
      'O usuario deve utilizar a plataforma de forma etica, nao compartilhar credenciais, nao tentar acessar areas restritas indevidamente e nao publicar conteudo ofensivo, ilegal, enganoso ou que viole direitos de terceiros.',
  },
  {
    title: '5. Conteudo e disponibilidade',
    content:
      'A plataforma pode receber atualizacoes, ajustes de conteudo, manutencoes e melhorias sem aviso previo. Podem ocorrer indisponibilidades temporarias por atualizacao, servicos externos, navegadores, cache local ou provedores de infraestrutura.',
  },
  {
    title: '6. Anuncios e links externos',
    content:
      'O app pode exibir anuncios, indicacoes e links externos. Ao acessar um site externo, o usuario passa a seguir os termos, politicas e responsabilidades daquele terceiro. A Decode Analytics Academy busca manter os anuncios discretos e relevantes ao contexto educacional.',
  },
  {
    title: '7. Privacidade e dados',
    content:
      'Dados de conta, progresso, respostas, interacoes e registros tecnicos podem ser usados para funcionamento, seguranca, melhoria da experiencia e diagnostico de erros. Senhas nao devem ser compartilhadas e devem ser protegidas pelo usuario.',
  },
  {
    title: '8. Limites de garantia',
    content:
      'Embora haja cuidado com qualidade e organizacao, a plataforma e fornecida no estado em que se encontra, sem garantia de ausencia total de erros, disponibilidade continua ou adequacao a todos os objetivos individuais do usuario.',
  },
  {
    title: '9. Alteracoes dos termos',
    content:
      'Estes termos podem ser atualizados quando houver mudancas no app, nos recursos ou nas regras de uso. A versao publicada nesta pagina sera considerada a versao vigente.',
  },
  {
    title: '10. Contato',
    content:
      'Duvidas, solicitacoes ou comunicacoes sobre estes termos podem ser enviadas pelos canais oficiais informados na plataforma.',
  },
];

export default function TermsPage() {
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
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Versao vigente
          </div>
        </div>

        <section className="mb-6 rounded-2xl border border-border bg-card/80 p-5 shadow-sm sm:p-7">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Termos de Uso
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Estes termos definem as condicoes basicas para uso da Decode Analytics Academy. Ultima atualizacao: 2 de junho de 2026.
          </p>
        </section>

        <section className="space-y-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-xl border border-border/70 bg-card/70 p-4 sm:p-5">
              <h2 className="text-base font-bold text-foreground">{section.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{section.content}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
