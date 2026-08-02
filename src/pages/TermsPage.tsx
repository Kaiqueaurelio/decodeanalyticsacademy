import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';

const sections = [
  {
    title: '1. Finalidade da plataforma',
    content:
      'A Decode Analytics Academy é uma plataforma educacional dedicada ao apoio acadêmico. Oferecemos um ecossistema completo com apostilas estruturadas, banco de exercícios, materiais complementares, curadoria de cursos gratuitos, ferramentas de revisão (Flashcards) e sistemas de monitoramento de progresso para estudantes de Tecnologia da Informação e áreas correlatas.',
  },
  {
    title: '2. Uso educacional e conduta',
    content:
      'O conteúdo disponibilizado tem finalidade estritamente acadêmica e informativa. A plataforma não substitui aulas presenciais ou remotas, orientações oficiais da instituição de ensino, editais, regulamentos ou comunicados formais. O usuário compromete-se a utilizar os recursos de forma ética, respeitando a propriedade intelectual e as normas de convivência da comunidade.',
  },
  {
    title: '3. Cursos e certificados complementares',
    content:
      'As indicações de cursos gratuitos no aplicativo servem como sugestão de aprimoramento. A aceitação destes certificados para fins de horas complementares (AC/APS) é de responsabilidade exclusiva do aluno junto à sua coordenação de curso. Recomendamos a verificação prévia da carga horária, validade do certificado e aderência à grade curricular antes da realização dos mesmos.',
  },
  {
    title: '4. Segurança da conta e responsabilidades',
    content:
      'O usuário é o único responsável pela guarda e confidencialidade de suas credenciais de acesso (e-mail/RA e senha). É expressamente proibido o compartilhamento de contas, a tentativa de engenharia reversa, o acesso a áreas administrativas sem autorização ou qualquer ação que comprometa a integridade dos sistemas. Violações de segurança podem resultar em suspensão imediata da conta.',
  },
  {
    title: '5. Conteúdo, disponibilidade e manutenção',
    content:
      'A Decode reserva-se o direito de atualizar, modificar ou remover conteúdos, funcionalidades e interfaces sem aviso prévio, visando a melhoria contínua da experiência. Manutenções preventivas ou corretivas podem causar indisponibilidades temporárias. Não nos responsabilizamos por falhas decorrentes de conexões de internet, navegadores desatualizados ou incompatibilidades de hardware do usuário.',
  },
  {
    title: '6. Sistema de anúncios e monetização',
    content:
      'Para manter a gratuidade de diversos recursos, a plataforma exibe anúncios e links de parceiros. Buscamos garantir que tais comunicações sejam discretas e contextuais. Ao clicar em links externos, o usuário reconhece que estará sujeito aos termos de privacidade e uso de terceiros, sobre os quais a Decode não exerce controle ou responsabilidade.',
  },
  {
    title: '7. Tratamento de dados e privacidade',
    content:
      'Coletamos dados de interação, progresso acadêmico, logs de segurança e informações de perfil para personalizar a experiência de aprendizado e garantir a proteção do ambiente. Seus dados são tratados com base nos princípios de transparência e necessidade. Para mais detalhes, consulte nossa Política de Privacidade integrada.',
  },
  {
    title: '8. Propriedade Intelectual',
    content:
      'Todo o design, interface, logotipos, animações (incluindo a assistente Ella) e textos originais da Decode Analytics Academy são protegidos por direitos autorais. A reprodução, distribuição ou venda não autorizada de qualquer parte da plataforma é estritamente proibida.',
  },
  {
    title: '9. Limitação de Garantia e Indenização',
    content:
      'A plataforma é fornecida "como está". Não garantimos que os resultados obtidos nos simulados e exercícios assegurem aprovação em exames oficiais. O sucesso acadêmico depende do empenho individual do estudante. A Decode não se responsabiliza por decisões tomadas com base nas informações aqui contidas.',
  },
  {
    title: '10. Disposições Finais',
    content:
      'Estes termos são regidos pelas leis brasileiras. Qualquer controvérsia será resolvida no foro da comarca da sede da Decode Analytics. Dúvidas podem ser esclarecidas através do suporte integrado no menu "Comunidade" ou pelos canais oficiais de atendimento.',
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
