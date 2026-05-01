import { Instagram, MessageCircle, Share2, ExternalLink, PenLine, Sparkles, CheckCircle, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_APP_URL = 'https://decodeanalyticsacademydev.vercel.app/';
const SHARE_TEXT = 'Conheça a Decode Analytics Academy — plataforma de estudos para alunos de Tecnologia 🚀';
const WRITELAB_URL = 'https://writelab-one.vercel.app';

const SOCIALS = [
  {
    name: '@kaiqueaurelio.ai',
    label: 'Criador',
    icon: Instagram,
    url: 'https://instagram.com/kaiqueaurelio.ai',
    bg: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
  },
  {
    name: '@decode.analytics',
    label: 'Decode Analytics',
    icon: Instagram,
    url: 'https://instagram.com/decode.analytics',
    bg: 'linear-gradient(135deg, #00f0ff, #a855f7)',
  },
  {
    name: '+55 11 93922-2885',
    label: 'WhatsApp',
    icon: MessageCircle,
    url: 'https://wa.me/5511939222885?text=' + encodeURIComponent('Olá! Vim pela Decode Analytics 👋'),
    bg: 'linear-gradient(135deg, #25D366, #128C7E)',
  },
];

function buildShareTargets(appUrl: string) {
  return [
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      color: '#25D366',
      href: `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + ' ' + appUrl)}`,
    },
    {
      label: 'Telegram',
      icon: Share2,
      color: '#229ED9',
      href: `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(SHARE_TEXT)}`,
    },
    {
      label: 'Twitter / X',
      icon: Share2,
      color: '#ffffff',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(appUrl)}`,
    },
  ];
}

export function SocialAndProjectsSection() {
  const [copied, setCopied] = useState(false);
  const [appUrl, setAppUrl] = useState<string>(DEFAULT_APP_URL);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'share_app_url')
        .maybeSingle();
      const raw = data?.value as unknown;
      if (!cancelled && typeof raw === 'string' && raw.trim()) {
        setAppUrl(raw.trim());
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const shareTargets = buildShareTargets(appUrl);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Decode Analytics Academy', text: SHARE_TEXT, url: appUrl });
        return;
      } catch {/* user cancelled */}
    }
    handleCopy();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <section className="relative py-20 px-5 overflow-hidden">
      <div
        className="absolute -top-32 -left-20 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'rgba(168,85,247,0.08)' }}
      />
      <div
        className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'rgba(0,240,255,0.08)' }}
      />

      <div className="max-w-5xl mx-auto relative space-y-12">
        {/* HEADER */}
        <div className="text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary mb-3">
            // siga · compartilhe · explore
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            Acompanhe o projeto
            <br />
            <span className="text-primary">e descubra novidades</span>
          </h2>
        </div>

        {/* REDES SOCIAIS */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4 text-center">
            Nossas redes
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {SOCIALS.map(s => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl p-4 flex items-center gap-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                style={{
                  background: 'rgba(10,10,18,0.7)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6"
                  style={{ background: s.bg }}
                >
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="text-sm font-semibold truncate text-foreground">{s.name}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </div>

        {/* COMPARTILHAR */}
        <div
          className="rounded-2xl p-5 sm:p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(0,240,255,0.06), rgba(168,85,247,0.06))',
            border: '1px solid rgba(0,240,255,0.18)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary" /> Compartilhar com a turma
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Indique para colegas que também precisam estudar.
              </p>
            </div>
            <button
              onClick={handleNativeShare}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-transform hover:scale-[1.03] active:scale-95 shrink-0"
              style={{ background: '#00f0ff', color: '#050508' }}
            >
              <Share2 className="h-3.5 w-3.5" /> Compartilhar
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SHARE_TARGETS.map(t => (
              <a
                key={t.label}
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: t.color,
                }}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </a>
            ))}
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors text-foreground"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {copied ? <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--success))]" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copiado' : 'Copiar link'}
            </button>
          </div>
        </div>

        {/* WRITELAB */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4 text-center">
            Conheça nossos outros apps
          </h3>

          <a
            href={WRITELAB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-2xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(168,85,247,0.18)]"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(0,240,255,0.05))',
              border: '1px solid rgba(168,85,247,0.25)',
            }}
          >
            <div
              className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-[100px] opacity-50 pointer-events-none"
              style={{ background: 'rgba(168,85,247,0.4)' }}
            />

            <div className="relative grid md:grid-cols-[auto_1fr_auto] gap-5 items-center">
              <div
                className="h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 mx-auto md:mx-0"
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #00f0ff)',
                  boxShadow: '0 10px 30px rgba(168,85,247,0.4)',
                }}
              >
                <PenLine className="h-7 w-7 text-white" />
              </div>

              <div className="text-center md:text-left min-w-0">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                  <span
                    className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(168,85,247,0.15)',
                      color: '#c084fc',
                      border: '1px solid rgba(168,85,247,0.3)',
                    }}
                  >
                    <Sparkles className="h-2.5 w-2.5 inline mr-1" />
                    Beta
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Novo projeto
                  </span>
                </div>
                <h4 className="font-display text-2xl sm:text-3xl font-bold mb-1">
                  WriteLab
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Laboratório de escrita para estudantes — organize textos, ensaios e
                  trabalhos acadêmicos com ferramentas de revisão, estrutura e foco.
                  Em fase beta de testes.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  {['Editor de textos', 'Revisão estruturada', 'Foco e produtividade'].map(t => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded-full text-muted-foreground"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-center md:justify-end">
                <div
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-transform group-hover:translate-x-1 shrink-0"
                  style={{ background: '#a855f7', color: '#fff' }}
                >
                  Testar agora <ExternalLink className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
