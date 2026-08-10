import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { captureCampaign, recordSponsorLead } from '@/lib/sponsor-leads';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BarChart3,
  Check,
  Handshake,
  LayoutPanelLeft,
  Mail,
  MessageCircle,
  MonitorSmartphone,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';

const WHATSAPP_NUMBER = '5511939222885';
const EMAIL_ADDRESS = 'decodeanalytics@outlook.com.br';

const MEDIA_KIT = [
  {
    icon: Users,
    value: 'ENEM + Tecnologia',
    label: 'Perfil do público',
    desc: 'Estudantes de ensino médio em preparação e universitários de computação e sistemas.',
  },
  {
    icon: MonitorSmartphone,
    value: 'Web e Android',
    label: 'Onde sua marca aparece',
    desc: 'Aplicativo instalável, navegador e versão Android — mesma campanha nos três.',
  },
  {
    icon: BarChart3,
    value: 'Impressões e cliques',
    label: 'Métricas por campanha',
    desc: 'Cada anúncio registra exibições, cliques e período. Relatório enviado ao fim do ciclo.',
  },
  {
    icon: ShieldCheck,
    value: 'Sem rastreadores',
    label: 'Ambiente limpo',
    desc: 'Nada de redes de terceiros ou venda de dados. Sua marca em contexto de estudo.',
  },
];

const FORMATS = [
  {
    icon: LayoutPanelLeft,
    name: 'Lateral fixa',
    spec: 'Imagem 1080×1350 ou 1080×1080 · legenda até 180 caracteres',
    desc: 'Painel permanente ao lado do conteúdo no computador, com rotação entre anunciantes.',
  },
  {
    icon: MonitorSmartphone,
    name: 'Rodapé mobile',
    spec: 'Imagem 1200×628 · legenda até 120 caracteres',
    desc: 'Faixa discreta na base da tela no celular, sem cobrir o conteúdo de estudo.',
  },
  {
    icon: Target,
    name: 'Pop-up de abertura',
    spec: 'Imagem 1080×1350 ou somente texto',
    desc: 'Aparece uma vez por sessão, com fechamento imediato. Também aceita anúncio só de texto.',
  },
  {
    icon: Handshake,
    name: 'Patrocínio de matéria',
    spec: 'Logo + assinatura na capa da disciplina',
    desc: '"Matemática apresentada por sua marca" — associação direta ao conteúdo estudado.',
  },
];

const PLANS = ['Apoiador Profissional', 'Parceiro de Conteúdo', 'Master', 'Ainda não sei'];

const briefingSchema = z.object({
  company: z.string().trim().min(2, 'Informe o nome da empresa').max(120),
  contact: z.string().trim().min(2, 'Informe o responsável').max(120),
  email: z.string().trim().email('E-mail inválido').max(255),
  phone: z.string().trim().max(40).optional(),
  site: z.string().trim().max(200).optional(),
  plan: z.string().trim().max(60),
  goal: z.string().trim().min(5, 'Descreva o objetivo da campanha').max(500),
  period: z.string().trim().max(120).optional(),
  budget: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
});

type BriefingForm = z.infer<typeof briefingSchema>;

const EMPTY: BriefingForm = {
  company: '',
  contact: '',
  email: '',
  phone: '',
  site: '',
  plan: 'Ainda não sei',
  goal: '',
  period: '',
  budget: '',
  notes: '',
};

function buildBriefing(data: BriefingForm) {
  return [
    'Olá Kaique! Quero anunciar na Decode Analytics Academy.',
    '',
    'BRIEFING DO ANUNCIANTE',
    `Empresa: ${data.company}`,
    `Responsável: ${data.contact}`,
    `E-mail: ${data.email}`,
    `Telefone / WhatsApp: ${data.phone || '-'}`,
    `Site ou rede social: ${data.site || '-'}`,
    `Formato de interesse: ${data.plan}`,
    `Objetivo da campanha: ${data.goal}`,
    `Período desejado: ${data.period || '-'}`,
    `Investimento previsto: ${data.budget || '-'}`,
    `Observações: ${data.notes || '-'}`,
  ];
}

export default function AnunciePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<BriefingForm>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof BriefingForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    captureCampaign();
  }, []);

  const preview = useMemo(() => buildBriefing(form).join('\n'), [form]);

  const validate = () => {
    const result = briefingSchema.safeParse(form);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error('Revise os campos destacados antes de enviar.');
      return null;
    }
    setErrors({});
    return result.data;
  };

  const sendWhatsapp = () => {
    const data = validate();
    if (!data) return;
    void recordSponsorLead({ ...data, channel: 'whatsapp', source: 'anuncie-form', ctaId: 'anuncie-form-whatsapp' });
    const text = encodeURIComponent(buildBriefing(data).join('\n'));
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const sendEmail = () => {
    const data = validate();
    if (!data) return;
    void recordSponsorLead({ ...data, channel: 'email', source: 'anuncie-form', ctaId: 'anuncie-form-email' });
    const subject = encodeURIComponent(
      `Briefing de anúncio — ${data.company} (${data.plan})`,
    );
    const body = encodeURIComponent(buildBriefing(data).join('\r\n'));
    window.location.href = `mailto:${EMAIL_ADDRESS}?subject=${subject}&body=${body}`;
  };

  const copyBriefing = async () => {
    const data = validate();
    if (!data) return;
    void recordSponsorLead({ ...data, channel: 'copia', source: 'anuncie-form', ctaId: 'anuncie-form-copia' });
    await navigator.clipboard.writeText(buildBriefing(data).join('\n'));
    toast.success('Briefing copiado.');
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-6 gap-2"
          aria-label="Voltar para a página inicial"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          Voltar
        </Button>

        <header className="mb-12 max-w-2xl">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary sm:text-xs">
            // para empresas e parceiros
          </p>
          <h1 className="font-display text-3xl leading-[1.1] sm:text-5xl">
            Anuncie ou patrocine a Decode Analytics Academy
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            O aluno nunca paga para estudar aqui. A plataforma se mantém com marcas que escolhem
            apoiar educação gratuita — e ganham presença num ambiente de atenção real, sem
            rastreamento e sem poluição visual.
          </p>
        </header>

        <section className="mb-14" aria-labelledby="media-kit">
          <h2 id="media-kit" className="mb-5 font-display text-2xl sm:text-3xl">
            Media kit
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {MEDIA_KIT.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm"
              >
                <item.icon className="mb-3 h-5 w-5 text-primary" strokeWidth={1.75} />
                <p className="font-display text-lg leading-tight">{item.value}</p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                  {item.label}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14" aria-labelledby="formatos">
          <h2 id="formatos" className="mb-5 font-display text-2xl sm:text-3xl">
            Formatos disponíveis
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {FORMATS.map((format) => (
              <div
                key={format.name}
                className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <format.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  <h3 className="font-display text-lg leading-tight">{format.name}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{format.desc}</p>
                <p className="mt-3 font-mono text-[11px] leading-relaxed text-primary">
                  {format.spec}
                </p>
              </div>
            ))}
          </div>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {[
              'Anúncio sem link também é aceito — só imagem e legenda.',
              'Agendamento por período: início e fim definidos por você.',
              'Aprovação da arte antes de publicar, com prévia real do app.',
              'Valores combinados caso a caso, inclusive para empresas locais.',
            ].map((li) => (
              <li key={li} className="flex gap-2 text-sm leading-relaxed">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                <span className="text-muted-foreground">{li}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="briefing" className="scroll-mt-24" id="briefing">
          <h2 id="briefing-title" className="mb-2 font-display text-2xl sm:text-3xl">
            Enviar briefing
          </h2>
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Preencha abaixo e escolha por onde enviar. O briefing vai montado, sem você precisar
            escrever nada além dos campos.
          </p>

          <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm sm:p-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="company"
                label="Empresa"
                value={form.company}
                onChange={set('company')}
                error={errors.company}
                placeholder="Nome da empresa ou marca"
              />
              <Field
                id="contact"
                label="Responsável"
                value={form.contact}
                onChange={set('contact')}
                error={errors.contact}
                placeholder="Quem fala com a gente"
              />
              <Field
                id="email"
                label="E-mail"
                type="email"
                value={form.email}
                onChange={set('email')}
                error={errors.email}
                placeholder="contato@empresa.com"
              />
              <Field
                id="phone"
                label="Telefone / WhatsApp"
                value={form.phone ?? ''}
                onChange={set('phone')}
                error={errors.phone}
                placeholder="(11) 90000-0000"
              />
              <Field
                id="site"
                label="Site ou rede social"
                value={form.site ?? ''}
                onChange={set('site')}
                error={errors.site}
                placeholder="instagram.com/suamarca"
              />
              <div className="space-y-2">
                <Label htmlFor="plan">Formato de interesse</Label>
                <Select value={form.plan} onValueChange={set('plan')}>
                  <SelectTrigger id="plan" aria-label="Formato de interesse">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANS.map((plan) => (
                      <SelectItem key={plan} value={plan}>
                        {plan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field
                id="period"
                label="Período desejado"
                value={form.period ?? ''}
                onChange={set('period')}
                error={errors.period}
                placeholder="Ex.: março a maio"
              />
              <Field
                id="budget"
                label="Investimento previsto"
                value={form.budget ?? ''}
                onChange={set('budget')}
                error={errors.budget}
                placeholder="Opcional"
              />
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="goal">Objetivo da campanha</Label>
              <Textarea
                id="goal"
                value={form.goal}
                maxLength={500}
                onChange={(e) => set('goal')(e.target.value)}
                placeholder="Divulgar vagas, curso, produto, fortalecer a marca..."
                className="min-h-24"
              />
              {errors.goal && <p className="text-xs text-destructive">{errors.goal}</p>}
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={form.notes ?? ''}
                maxLength={1000}
                onChange={(e) => set('notes')(e.target.value)}
                placeholder="Já tem arte pronta? Alguma data importante?"
                className="min-h-20"
              />
            </div>

            <details className="mt-5 rounded-xl border border-border/50 bg-background/40 p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Pré-visualizar briefing
              </summary>
              <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-muted-foreground">
                {preview}
              </pre>
            </details>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button onClick={sendWhatsapp} className="gap-2 sm:w-auto" aria-label="Enviar briefing pelo WhatsApp">
                <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
                Enviar pelo WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={sendEmail}
                className="gap-2 sm:w-auto"
                aria-label="Enviar briefing por e-mail"
              >
                <Mail className="h-4 w-4" strokeWidth={1.75} />
                Enviar por e-mail
              </Button>
              <Button
                variant="ghost"
                onClick={copyBriefing}
                className="sm:w-auto"
                aria-label="Copiar briefing"
              >
                Copiar briefing
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Contato direto: {EMAIL_ADDRESS} · WhatsApp (11) 93922-2885
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  type = 'text',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        maxLength={255}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
